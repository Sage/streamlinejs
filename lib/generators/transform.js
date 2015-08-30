// Copyright 2011 Marcel Laverdet
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.
"use strict";
if (typeof exports !== 'undefined') {
	var esprima = require('esprima');
	var sourceMap = require('../util/source-map');
}
(function(exports) {
	exports.transform = transform;
	exports.version = require("../version").version + " (generators)";
	// hack to fix #123
	exports.transform.version = exports.version;

	try {
		/* eslint-disable no-eval */
		eval("(function*(){})");
		/* eslint-enable no-eval */
	} catch (ex) {
		console.log("warning: generators not supported or not enabled by your JS engine");
	}

	var walker = require('../fibers/walker');

	// TODO ensure `foo(_)` calls have a bounding fiber. streamline is smart enough to allow this:
	// ~function() { foo(_) }();
	// and disallow this:
	// foo(function() { foo(_) });
	/**
	 * Finds all variables which have been declared locally in this function.
	 */
	function getLocals(fn, recurse) {
		var names = Object.create(null);
		function decl() {
			var vars = this.declarations;
			for (var ii = 0; ii < vars.length; ++ii) {
				names[vars[ii].id.name] = vars[ii].id.name;
				vars[ii].init && walk(vars[ii].init);
			}
		}
		var walk = walker({
			Function: function(name, args, body) {
				if (this.type !== 'FunctionExpression') {
					names[this.id.name] = this.id.name;
				}
				// Don't walk further by default
				if (recurse) {
					for (var ii in getLocals(this, true)) {
						names[ii] = ii;
					}
				}
			},
			VariableDeclaration: decl,
		});
		fn.body.body.map(walk);
		for (var ii = 0; ii < fn.params; ++ii) {
			names[fn.params[ii].name] = fn.params[ii].name;
		}
		if (fn.id && fn.type === 'FunctionExpression') {
			names[fn.id.name] = fn.id.name;
		}
		return names;
	}


	/**
	 * Create a new object inheriting from `base` and extended by `vector`
	 */

	function chain(base, vector) {
		var obj = Object.create(base);
		for (var ii in vector) {
			obj[ii] = vector[ii];
		}
		return obj;
	}

	/**
	 * Transforms code to be streamliney. Line numbers are not maintained, but could be if I could
	 * figure out how to do it with uglifyjs.
	 */

	function transform(source, options) {
		source = source.replace(/\r\n/g, "\n");
		options = options || {};
		var callback = options.callback || '_';
		var didRewrite = 0;
		var position = 0;
		var buffer = '';
		var scope = Object.create(null);
		var streamlined = Object.create(null);
		var verboten = Object.create(null);
		var async = false;
		var asyncDepth = 0;
		var allIdentifiers;

		/**
		 * Walks a parse tree and finds all functions which have been declared as streamline functions.
		 * Also returns variables which are always streamlined functions. Note that this does not enter
		 * new function scopes.
		 */

		function getStreamlinedDeclarations(fn) {
			var declared = Object.create(null);
			var exprs = Object.create(null);
			var not = Object.create(null);
			var walk = walker({
				Function: function(name, args, body) {
					if (this.type !== 'FunctionExpression') {
						var idx = getCallback(args);
						(idx === -1 ? not : declared)[name] = getCallbackDefault(args, body) || idx;
					}
					// Don't walk further
				},
				VariableDeclarator: function(name, initializer) {
					if (!initializer) {
						return;
					}
					if (initializer.type === 'FunctionExpression') {
						(getCallback(initializer.params) === -1 ? not : exprs)[name] = true;
					} else {
						not[name] = true;
					}
					walk(initializer);
				},
				AssignmentExpression: function(left, right) {
					var name = left.type === 'Identifier' && left.name;
					if (name) {
						if (right.type === 'FunctionExpression') {
							(getCallback(right.params) === -1 ? not : exprs)[name] = true;
						} else {
							not[name] = true;
						}
					}
					walk(right);
				},
			});
			fn.body.body.map(walk);
			var ii;
			for (ii in declared) {
				exprs[ii] = true;
			}
			for (ii in not) {
				delete exprs[ii];
			}
			return {
				declared: declared,
				strict: exprs,
			};
		}

		/**
		 * Finds the index of the callback param in an argument list, -1 if not found.
		 */

		function getCallback(args, lineno) {
			var idx = -1;
			for (var ii = 0; ii < args.length; ++ii) {
				if (args[ii] === callback || (args[ii].type === 'Identifier' && args[ii].name === callback) || //
					(args[ii].type === 'UnaryExpression' && args[ii].operator === '~' && args[ii].argument.type === 'Identifier' && args[ii].argument.name === callback) ||
					(args[ii].type === 'ArrayExpression' && args[ii].elements.length === 1 && args[ii].elements[0].type === 'Identifier' && args[ii].elements[0].name === callback)) {
					if (idx === -1) {
						idx = ii;
					} else {
						lineno = lineno || args[ii].loc.start.line;
						throw new Error(lineno + ': Callback argument used more than once in function call ');
					}
				}
			}
			return idx;
		}

		/**
		 * Adds to `buffer` everything that hasn't been rendered so far.
		 */

		function catchup(end) {
			if (end < position || end === undefined) {
				throw new Error('Invalid catchup, ' + position + ' to ' + end);
			}
			buffer += source.substring(position, end);
			position = end;
		}

		function skipTo(pos) {
			buffer += source.substring(position, pos).replace(/\S/g, '');
			position = pos;
		}

		function startsWith(str, start, pat) {
			return str.substring(start, start + pat.length) === pat;
		}

		function endsWith(str, end, pat) {
			return str.substring(end - pat.length, end) === pat;
		}

		function getCallbackDefault(params, body) {
			var paramI = -1;
			for (var i = 0; i < body.length; i++) {
				var child = body[i];
				if (i === 0 && child.type === 'VariableDeclaration') { continue; }
				if (child.type !== 'IfStatement') return null;
				if (child.test.type !== 'BinaryExpression' || child.test.operator !== '==') return null;
				var ident = child.test.left;
				if (ident.type !== 'Identifier') return null;
				if (child.test.right.type !== 'Literal' || child.test.right.value !== null) return false;
				if (!child.consequent.body || child.consequent.body.length !== 1) return false;
				var assign = child.consequent.body[0];
				if (assign.type !== 'ExpressionStatement') return false;
				assign = assign.expression;
				if (assign.type !== 'AssignmentExpression') return false;
				if (assign.left.type !== 'Identifier') return false;
				if (assign.left.name !== ident.name) return false;
				// we got a candidate - let us find the param
				while (++paramI < params.length) {
					if (ident.name === params[paramI].name) break;
				}
				if (paramI === params.length) return null;
				if (ident.name === callback) {
					body.splice(i, 1); // remove it from body
					var def = assign.right;
					return '{callbackIndex:' + paramI + ",callbackDefault:function(){ return " + //
					source.substring(def.range[0], def.range[1]) + ';}}';
				}
			}
			// we did not find it
			return null;
		}

		var walk = walker({
			Function: function(name, args, body) {
				// Open this function
				if (name === callback) {
					throw new Error('Invalid usage of callback on line ' + this.loc.start.line);
				}
				catchup(this.range[0]);
				var idx = getCallback(args, this.loc.start.line), opts;
				if (idx !== -1 && this.type === 'FunctionExpression') {
					buffer += 'galaxy.unstar(';
					opts = getCallbackDefault(args, body) || idx;
					++didRewrite;
				}
				if (idx !== -1 || this.forceAsync) {
					catchup(source.indexOf('function', position));
					buffer += "function*";
					position += 8;
				}
				catchup(this.body.range[0] + 1);
				// keep "use strict"; and similar directives at beginning of block
				while (body[0] && body[0].type === 'ExpressionStatement' && body[0].expression.type === 'Literal' && typeof body[0].expression.value === 'string') {
					catchup(body[0].range[1]);
					body.splice(0, 1);
				}

				// Analyze the scope of this function for locals and streamlined functions
				// We need locals to avoid renaming collisions with streamlined functions, and the streamlined
				// functions let us optimize `invoke`.
				var locals = getLocals(this);
				var localStreamlined = getStreamlinedDeclarations(this);
				var oldScope = scope;
				var oldStreamlined = streamlined;
				var oldVerboten = verboten;
				var oldAsync = async;
				async = idx !== -1 || this.forceAsync;
				if (async) asyncDepth++;
				scope = chain(scope, locals);
				streamlined = chain(streamlined, localStreamlined.strict);
				verboten = chain(verboten);
				var ii;
				for (ii in locals) {
					if (!localStreamlined.strict[ii]) {
						streamlined[ii] = false;
					}
					verboten[ii] = false;
				}
				if (idx !== -1 && this.type === 'FunctionExpression' && name) {
					// Can't use a streamline'd function by name from within that function
					verboten[name] = true;
				}

				// Hoist streamlined functions
				var hoisted = [];
				for (ii in localStreamlined.declared) {
					var fragment = '_',
						len = 1;
					while (scope[ii + fragment] || allIdentifiers[ii + fragment]) {
						fragment = Array(++len + 1).join('_');
					}
					scope[ii] = ii + fragment;
					hoisted.push(ii + fragment + ' = galaxy.unstar(' + ii + ', ' + localStreamlined.declared[ii] + ')');
					++didRewrite;
				}
				if (hoisted.length) {
					buffer += 'var ' + hoisted.join(', ') + ';';
				}

				// Close up the function
				body.map(walk);
				catchup(this.range[1]);
				if (idx !== -1 && this.type === 'FunctionExpression') {
					buffer += ', ' + opts + ')';
				}

				// Reset scopes
				scope = oldScope;
				streamlined = oldStreamlined;
				verboten = oldVerboten;
				if (async) asyncDepth--;
				async = oldAsync;
			},
			CallExpression: function(expr, args) {
				if (expr.type === 'Identifier' && expr.name === '_' && args.length === 2) {
					catchup(this.range[0]);
					buffer += 'galaxy.streamlinify(';
					skipTo(args[0].range[0]);
					args.map(walk);
					catchup(args[1].range[1]);
					buffer += ')';
					skipTo(this.range[1]);
					++didRewrite;
					return;
				}
				if (expr.type === 'MemberExpression' && args.length === 2 && args[0].type === 'Identifier' && args[0].name === callback //
					&& args[1].type === 'Identifier' && args[1].name === callback) {
					if (!async) throw new Error(this.loc.start.line, "Function contains async calls but does not have _ parameter");
					catchup(this.range[0]);
					skipTo(expr.object.range[0]);
					buffer += '(yield galaxy.then.call(this,';
					walk(expr.object);
					catchup(expr.object.range[1]);
					buffer += ', "' + expr.property.name + '", _))';
					skipTo(this.range[1]);
					++didRewrite;
					return;
				}
				if (expr.type === 'MemberExpression' && expr.object.type === 'Identifier' && expr.object.name === callback &&
					!expr.computed && expr.property.name === 'callback' && args.length === 1) {
					catchup(this.range[0]);
					skipTo(args[0].range[0]);
					walk(args[0]);
					catchup(args[0].range[1]);
					skipTo(this.range[1]);
					++didRewrite;
					return;
				}
				var idx = getCallback(args);
				if (idx !== -1 && !async) throw new Error("Function contains async calls but does not have _ parameter on line " + this.loc.start.line);
				var ii;
				if (idx !== -1 && expr.type === 'Identifier' && streamlined[expr.name]) {
					// Optimized streamline callback. We know this call is to a streamlined function so we can
					// just inline it.
					catchup(this.range[0]);
					buffer += '(yield ';
					if (scope[expr.name] === expr.name) {
						// In this case `expr` was declared with a function expression instead of a function
						// declaration, so the original function is no longer around.
						catchup(expr.range[0]);
						buffer += '(';
						catchup(expr.range[1]);
						buffer += '.__starred__' + idx + ' || 0)';
					} else {
						catchup(expr.range[1]);
					}
					buffer += '(';
					for (ii = 0; ii < args.length; ++ii) {
						skipTo(args[ii].range[0]);
						if (ii > 0) buffer += ', ';
						if (ii !== idx) {
							walk(args[ii]);
							catchup(args[ii].range[1]);
						} else {
							buffer += '_';
							skipTo(args[ii].range[1]);
						}
					}
					skipTo(this.range[1]);
					buffer += '))';
				} else if (idx !== -1) {
					// Rewrite streamlined calls
					// issue #108: process between expr.range[0] and last arg end rather than this.range[0]/end
					catchup(this.range[0]);
					buffer += '(yield galaxy.invoke(';
					skipTo(expr.range[0]);
					if (expr.type === 'MemberExpression') {
						skipTo(expr.object.range[0]);
						walk(expr.object);
						catchup(expr.object.range[1]);
						if (!expr.computed) {
							// Method call: foo.bar(_)
							buffer += ', ' + JSON.stringify(expr.property.name);
						} else {
							// Dynamic method call: foo[bar](_)
							buffer += ', ';
							skipTo(expr.property.range[0]);
							walk(expr.property);
							catchup(expr.property.range[1]);
						}
						skipTo(expr.range[1]);					
					} else {
						// Function call
						buffer += 'null, ';
						walk(expr);
					}
					catchup(expr.range[1]);
					// Render arguments
					buffer += ', [';
					skipTo(args[0].range[0]);
					for (ii = 0; ii < args.length; ++ii) {
						skipTo(args[ii].range[0]);
						if (ii > 0) buffer += ', ';
						if (ii !== idx) {
							walk(args[ii]);
							catchup(args[ii].range[1]);
						} else {
							buffer += '_';
							skipTo(args[ii].range[1]);
						}
					}
					var options = idx;
					if (args[idx].type === 'ArrayExpression') options = '{ callbackIndex: ' + idx + ', returnArray: true }';
					buffer += '], ' + options + '))';
					skipTo(this.range[1]);
					++didRewrite;
				} else {
					var paren = 0, forceAsync = false;
					if (source[this.range[0]] === '(' && source[this.range[0] + 1] === '(' && 
						source[this.range[1] - 1] === ')' && source[this.range[1] - 2] === ')') {
						paren = 1;
					}
					if (async && asyncDepth > 1 && startsWith(source, this.range[0] + paren, '(function() {')) {
						// handle coffeescript wrappers: set the forceAsync flag
						// so that we don't get an error about _ being used inside non async function
						if (endsWith(source, this.range[1] - paren, '})()')) {
							expr.forceAsync = forceAsync = true;
						}
						if (endsWith(source, this.range[1] - paren, '}).call(this)') //
							|| endsWith(source, this.range[1] - paren, '}).call(_this)') //
							|| endsWith(source, this.range[1] - paren, '}).apply(this, arguments)')) {
							expr.object.forceAsync = forceAsync = true;
						}
					}
					if (forceAsync) {
						catchup(this.range[0]);
						buffer += '(yield ';
						walk(expr);
						args.map(walk);
						catchup(this.range[1]);
						buffer += ')';
					} else {
						walk(expr);
						args.map(walk);
					}
				}
			},
			Identifier: function(name) {
				if (name === callback) {
					throw new Error('Invalid usage of callback on line ' + this.loc.start.line);
				} else if (verboten[name]) {
					throw new Error('Invalid use of indentifier `' + name + '` on line ' + this.loc.start.line);
				}
				if (scope[name]) {
					catchup(this.range[0]);
					buffer += scope[name];
					skipTo(this.range[1]);
				} else {
					// catchup to end will deal with all sort of oddities, like object initializer keys that are 
					// parsed as identifiers but need to be quoted.
					catchup(this.range[1]);
				}
			},
			Property: function() {
				// Dont't walk the property key, because that's an identifier and it will be clobbered, per
				// the below code
				walk(this.value);
			},
			MemberExpression: function() {
				// See comment above for propery_init
				walk(this.object);
				if (this.computed) walk(this.property);
			},
			NewExpression: function(expr, args) {
				var idx = getCallback(args);
				if (idx !== -1) {
					// assumes that this is a streamlined function!
					catchup(this.range[0]);
					skipTo(expr.range[0]); // skip new keyword
					buffer += "(yield galaxy.new(galaxy.star(";
					walk(expr);
					catchup(expr.range[1]);
					buffer += "," + idx + "), " + idx + ")(";
					// process arguments to avoid 'invalid usage of callback' error
					for (var ii = 0; ii < args.length; ++ii) {
						skipTo(args[ii].range[0]);
						if (ii > 0) buffer += ', ';
						if (ii !== idx) {
							walk(args[ii]);
							catchup(args[ii].range[1]);
						} else {
							buffer += '_';
							skipTo(args[ii].range[1]);
						}
					}
					buffer += "))";
					skipTo(this.range[1]);
				} else {
					walk(expr);
					args.map(walk);
				}
			},
			ReturnStatement: function(argument) {
				argument && walk(argument);
				fixASI(this);
			},
			ThrowStatement: function(argument) {
				argument && walk(argument);
				fixASI(this);
			},
			YieldStatement: function(argument) {
				argument && walk(argument);
				fixASI(this);
			},
			UnaryExpression: function(operator, argument) {
				if (operator === '!' || operator === 'void') {
					if (argument.type === 'Identifier' && argument.name === callback) {
						catchup(this.range[0]);
						buffer += operator === '!' ? 'false' : 'null';
						skipTo(this.range[1]);
					} else {
						walk(argument);
					}
				} else {
					walk(argument);
				}
			},
			TryStatement: function(block, handlers, finalizer) {
				walk(block);
				handlers.map(walk);
				finalizer && walk(finalizer);
			},
			ExpressionStatement: function(expression) {
				expression && walk(expression);
				fixASI(this);
			},
			BinaryExpression: function(operator, left, right) {
				if (operator === '<<' || operator === '>>') {
					walkShift.call(this, left, right);
				} else {
					walk(left);
					walk(right);
				}
			},
			VariableDeclaration: function(declarations) {
				declarations && declarations.map(walk);
				if (this.eligibleForASI) fixASI(this);
			},
		});

		// take care of ASI, in case transformation parenthesized next statement
		function fixASI(node) {
			catchup(node.range[1]);
			if (buffer[buffer.length - 1] !== ';') buffer += ';';
		}

		function walkShift(left, right) {
			if (left.type === 'Identifier' && left.name === callback) {
				catchup(left.range[0]);
				skipTo(source.indexOf(this.operator, left.range[1]) + 2);

				walk(right);
				++didRewrite;
			} else {
				walk(left);
				walk(right);
			}
		}

		// Walk parsed source, rendering along the way
		var originalSource = source;
		var optStr = "(function(){";
		if (options.promise) {
			var arg = typeof options.promise === "string" ? "'" + options.promise + "'" : "true";
			optStr += "galaxy.globals.setPromise(" + arg + ");";
		}
		optStr += "})();";
		source = 'var galaxy = require("' + (options.internal ? '..' : 'streamline/lib') + '/generators/runtime");' + optStr + '(function(_) { ' + //
			source + //
			'\n}.call(this, function(err) {\n' + //
			'  if (err) throw err;\n' + //
			'}));\n';
		var parsed = esprima.parse(source, {
			loc: true,
			range: true,
		});
		allIdentifiers = getLocals(parsed.body[2].expression.callee.object, true);
		walk(parsed);
		buffer += source.substring(position);

		if (didRewrite > 0) {
			return buffer;
		} else {
			return originalSource;
		}
	}
})(typeof exports !== 'undefined' ? exports : (window.Streamline = window.Streamline || {}));
