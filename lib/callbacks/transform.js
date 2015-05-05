/**
 * Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
/// !doc
/// 
/// # Transformation engine (callback mode)
/// 
/// `var transform = require('streamline/lib/callbacks/transform')`
/// 
var esprima, escodegen;
if (typeof exports !== 'undefined') {
	esprima = require('esprima');
	escodegen = require('escodegen');
} else {
	esprima = window.esprima;
	escodegen = window.escodegen;
}(function(exports) {
	"use strict";
	/// * `version = transform.version`  
	///   current version of the transformation algorithm.
	exports.version = require("../version").version + " (callbacks)";
	var Syntax = esprima.Syntax;

    // ES6 forms that we don't transform yet
    // ArrowFunctionExpression = 'ArrowFunctionExpression',
    // ClassBody = 'ClassBody',
    // ClassDeclaration = 'ClassDeclaration',
    // ClassExpression = 'ClassExpression',
    // MethodDefinition = 'MethodDefinition',

    // ES5 node types that we don't use:
    // CatchClause: catch clause inside TryStatement
    // DebuggerStatement: debugger
    // EmptyStatement: ;
    // ObjectExpression: object initializer
    // Property: prop: inside ObjectExpression
    // WithStatement


	function _assert(cond) {
		if (!cond) throw new Error("Assertion failed!");
	}

	/*
	 * Utility functions
	 */

	function originalLine(options, line, col) {
		if (!options.prevMap) return line || 0;
		// Work around a bug in CoffeeScript's source maps; column number 0 is faulty.
		if (col == null) col = 1000;
		var r = options.prevMap.originalPositionFor({ line: line, column: col }).line;
		return r == null ? line || 0 : r;
	}

	function originalCol(options, line, col) {
		if (!options.prevMap) return col || 0;
		return options.prevMap.originalPositionFor({ line: line, column: col }).column || 0;
	}

	function _node(ref, type, init) {
		var n = {
			_scope: ref && ref._scope,
			_async: ref && ref._async,
			type: type,
			loc: ref && ref.loc,
			range: ref && ref.range,
		};
		if (Array.isArray(init)) throw new Error("INTERNAL ERROR: children in esprima!");
		if (init) Object.keys(init).forEach(function(k) {
			n[k] = init[k];
		});
		return n;
	}

	function _isFunction(node) {
		return node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression';
	}

	function isDot(node) {
		return node.type === 'MemberExpression' && !node.computed;
	}

	function isIndex(node) {
		return node.type === 'MemberExpression' && node.computed;
	}

	function _identifier(name) {
		return {
			type: 'Identifier',
			name: name,
		};
	}

	function _declarator(name, init) {
		return {
			_scope: init && init._scope,
			type: 'VariableDeclarator',
			id: _identifier(name),
			init: init,
		};
	}

	function _literal(val) {
		return {
			type: 'Literal',
			value: val,
		};
	}

	function _return(node) {
		return {
			type: 'ReturnStatement',
			_scope: node._scope,
			argument: node
		};
	}

	function _semicolon(node) {
		var stmt = _node(node, 'ExpressionStatement');
		stmt.expression = node;
		return stmt;
	}

	function _safeName(precious, name) {
		if (name.substring(0, 2) === '__') while (precious[name]) name += 'A';
		return name;
	}
	// cosmetic stuff: template logic generates nested blocks. Flatten them.

	function _flatten(node) {
		if (node.type === 'BlockStatement' || node.type === 'Program') {
			do {
				var found = false;
				var body = [];
				node.body.forEach(function(child) {
					if (child._isFunctionReference || (child.type === 'ExpressionStatement' && (child.expression == null || child.expression._isFunction))) return; // eliminate empty statement and dummy function node;
					node._async |= child._async;
					if (child.type === 'BlockStatement' || child.type === 'Program') {
						body = body.concat(child.body);
						found = true;
					} else body.push(child);
				});
				node.body = body;
			}
			while (found);
		}
		return node;
	}

	// generic helper to traverse parse tree
	// if doAll is true, fn is called on every property, otherwise only on sub-nodes
	// if clone object is passed, values returned by fn are assigned to clone properties

	function _propagate(node, fn, doAll, clone) {
		var result = clone ? clone : node;
		for (var prop in node) {
			if (node.hasOwnProperty(prop) && prop[0] !== '_') {
				var child = node[prop];
				if (child != null) {
					if (Array.isArray(child)) {
						if (clone) result[prop] = (child = [].concat(child));
						var undef = false;
						for (var i = 0; i < child.length; i++) {
							if (doAll || (child[i] && child[i].type)) {
								child[i] = fn(child[i], node);
								undef |= typeof child[i] === "undefined";
							}
						}
						if (undef) {
							result[prop] = child.filter(function(elt) {
								return typeof elt !== "undefined";
							});
						}
					} else {
						if (doAll || (child && child.type)) result[prop] = fn(child, node);

					}
				} else if (child === null) {
					result[prop] = null;
				}
			}
		}
		return result;
	}

	// clones the tree rooted at node.

	function _clone(node) {
		var lastId = 0;
		var clones = {}; // target property creates cycles

		function cloneOne(child) {
			if (!child || !child.type) return child;
			var cloneId = child._cloneId;
			if (!cloneId) cloneId = (child._cloneId = ++lastId);
			var clone = clones[cloneId];
			if (clone) return clone;
			clones[cloneId] = (clone = {
				_cloneId: cloneId
			});
			return _propagate(child, cloneOne, true, clone);
		}

		return _propagate(node, cloneOne, true, {});
	}

	/*
	 * Utility class to generate parse trees from code templates
	 */

	function Template(pass, str, isExpression, createScope) {
		// parser the function and set the root
		var _root = esprima.parse("function _t(){" + str + "}").body[0].body.body;
		if (_root.length === 1) _root = _root[0];
		else _root = _node(_root[0], 'BlockStatement', {
			body: _root,
		});
		function _mark(obj) {
			if (!obj || typeof obj !== 'object') return obj;
			if (Array.isArray(obj)) return obj.map(_mark);
			if (obj.type) obj.isTemplate = true;
			Object.keys(obj).forEach(function(k) {
				_mark(obj[k]);
			});
			return obj;
		}
		_root = _mark(_root);
		// if template is an expression rather than a full statement, go one more step down
		//if (isExpression) 
		//	_root = _root.expression;
		// generates a parse tree from a template by substituting bindings.
		this.generate = function(scopeNode, bindings) {
			var scope = scopeNode._scope;
			var loc = scopeNode.loc;
			_assert(scope != null);
			bindings = bindings || {};
			var fn = null;

			function gen(node) {
				if (node && node.type && !node.isTemplate) return node;
				if (node && typeof node === 'object' && node.type !== 'Program' && node.type !== 'BlockStatement') node._pass = pass;
				if (_isFunction(node) && createScope) {
					_assert(fn == null);
					fn = node;
				}
				if (!node || !node.type) {
					if (node === "_") return scope.options.callback;
					// not a parse node - replace if it is a name that matches a binding
					if (typeof node === "string") {
						if (node[0] === "$") return bindings[node];
						return _safeName(scope.options.precious, node);
					}
					return node;
				}
				node._scope = scope;
				// if node is ident; statement ('ExpressionStatement') or ident expression, try to match with binding
				var ident = node.type === 'ExpressionStatement' ? node.expression : node;
				if (ident && ident.type === 'Identifier' && ident.name[0] === "$" && !ident._binding) {
					return typeof bindings[ident.name] === 'string' ? _identifier(bindings[ident.name]) : bindings[ident.name];
				} else {
					// recurse through sub nodes
					node = _propagate(node, function(child) {
						child = gen(child);
						// propagate async flag like analyze phase
						if (child && (child._async || (child === scope.options.callback && createScope)) && !_isFunction(node)) node._async = true;
						return child;
					}, true);
					node = _flatten(node);
					node.loc = node.loc || loc;
					return node;
				}
			}

			function _changeScope(node, parent) {
				if (_isFunction(node)) return node;
				node._scope = scope;
				return _propagate(node, _changeScope);
			}

			// generate
			var result = gen(_clone(_root));
			if (fn) {
				// parser drops parenthesized flag (because of return)
				fn.parenthesized = true;
				scope = new Scope(fn.body, fn._scope.options);
				scope.name = fn._scope.name;
				scope.line = fn._scope.line;
				scope.last = fn._scope.last;
				_assert(fn.params[0].name === fn._scope.options.callback);
				scope.cbIndex = 0;

				_propagate(fn, _changeScope);
			}
			result = isExpression ? result.argument : result;
			result.loc = loc;
			return result;
		};
		this.root = isExpression ? _root.argument : _root; // for simplify pass
	}

	/*
	 * Utility to generate names of intermediate variables
	 */

	function Scope(script, options) {
		//this.script = script;
		this.line = 0;
		this.last = 0;
		this.vars = [];
		this.functions = [];
		this.options = options;
		this.cbIndex = -1;
		this.isAsync = function() {
			return this.cbIndex >= 0;
		};
	}

	function _genId(node) {
		return _safeName(node._scope.options.precious, "__" + ++node._scope.last);
	}

	/*
	 * Preliminary pass: mark source nodes so we can map line numbers
	 * Also eliminate _fast_ syntax
	 */
	function _removeFast(node, options) {
		function _isMarker(node) {
			return node.type === 'Identifier' && node.name === options.callback;
		}
		function _isStar(node) {
			return node.type === 'CallExpression' && _isMarker(node.callee) && node.arguments.length === 2;
		}
		// ~_ -> _
		if (node.type === 'UnaryExpression' && node.operator === '~' && _isMarker(node.argument)) {
			options.needsTransform = true;
			return node.argument;
		}
		// [_] -> _ (with multiple marker)
		if (node.type === 'ArrayExpression' && node.elements.length === 1 && _isMarker(node.elements[0])) {
			options.needsTransform = true;
			node.elements[0]._returnArray = true; 
			return node.elements[0];
		}
		// _ >> x -> x
		if (node.type === 'BinaryExpression' && node.operator === '>>' && _isMarker(node.left)) {
			options.needsTransform = true;
			return node.right;
		}
		// _ << x -> x
		if (node.type === 'BinaryExpression' && node.operator === '<<' && _isMarker(node.left)) {
			options.needsTransform = true;
			return node.right;
		}
		// !_ -> false
		if (node.type === 'UnaryExpression' && node.operator === '!' && _isMarker(node.argument)) {
			options.needsTransform = true;
			node.type = 'Literal';
			node.value = false;
			node.raw = "false";
			delete node.argument;
			return node;
		}
		// void _ -> null
		if (node.type === 'UnaryExpression' && node.operator === 'void' && _isMarker(node.argument)) {
			options.needsTransform = true;
			node.type = 'Literal';
			node.value = null;
			node.raw = "null";
			delete node.argument;
			return node;
		}
		if (_isStar(node)) {
			node._isStar = true;
			options.needsTransform = true;
			node.callee.name = _safeName(options.precious, "__rt") + ".streamlinify";
			return node;
		} 
		return node;
	}

	function _markSource(node, options) {
		function _markOne(node) {
			if (typeof node.name === 'string') options.precious[node.name] = true;
			node.params && node.params.forEach(function(param) {
				options.precious[param.name] = true;
			});
			node._isSourceNode = true;
			_propagate(node, function(child) {
				child = _removeFast(child, options);
				_markOne(child);
				return child;
			});
		}

		_markOne(node);
	}

	/*
	 * Canonicalization pass: wrap top level script if async
	 */

	function _isScriptAsync(script, options) {
		var async = false;

		function _doIt(node, parent) {
			switch (node.type) {
			case 'FunctionDeclaration':
			case 'FunctionExpression':
				// do not propagate into functions
				return node;
			case 'Identifier':
				if (node.name === options.callback) {
					async = true;
				} else { // propagate only if async is still false
					_propagate(node, _doIt);
				}
				return node;
				/* eslint-disable no-fallthrough */		
			case 'CallExpression':
				// special hack for coffeescript top level closure
				var fn = node.callee,
					args = node.arguments,
					ident;
				if (isDot(fn) && (ident = fn.property).name === "call" //
					&& (fn = fn.object).type === 'FunctionExpression' && fn.params.length === 0 //
					&& !fn.id && args.length === 1 //
					&& args[0].type === 'ThisExpression') {
					_propagate(fn.body, _doIt);
					return node;
				}
				// fall through	
			default:
				// do not propagate if async has been found
				if (!async) {
					_propagate(node, _doIt);
				}
				return node;
			}
		}
		_propagate(script, _doIt);
		if (async && options.verbose) console.log("WARNING: async calls found at top level in " + script.filename);
		return async;
	}

	var _rootTemplate = new Template("root",
	// define as string on one line to get lineno = 1
	"(function main(_){ $script }).call(this, __trap);");

	function _canonTopLevelScript(script, options) {
		script._scope = new Scope(script, options);
		if (_isScriptAsync(script, options)) return _rootTemplate.generate(script, {
			$script: script
		});
		else return script;
	}

	/*
	 * Scope canonicalization pass:
	 *   Set _scope on all nodes
	 *   Set _async on all nodes that contain an async marker
	 *   Move vars and functions to beginning of scope.
	 *   Replace this by __this.
	 *   Set _breaks flag on all statements that end with return, throw or break
	 */
	var _assignTemplate = new Template("canon", "$lhs = $rhs;");

	// try to give a meaningful name to an anonymous func

	function _guessName(node, parent) {
		function _sanitize(name) {
			// replace all invalid chars by '_o_'
			name = ('' + name).replace(/[^A-Z0-9_$]/ig, '_o_');
			// add '_o_' prefix if name is empty or starts with a digit
			return name && !/^\d/.test(name) ? name : '_o_' + name;
		}
		var id = _genId(node),
			n, nn;
		if (parent.type === 'Identifier') return _sanitize(parent.name) + id;
		if (parent.type === 'AssignmentExpression') {
			n = parent.left;
			var s = "";
			while ((isDot(n) && (nn = n.property).type === 'Identifier') || (isIndex(n) && (nn = n.property).type === 'Literal')) {
				s = s ? (nn.name || nn.value) + "_" + s : (nn.name || nn.value);
				n = n.object;
			}
			if (n.type === 'Identifier') s = s ? n.name + "_" + s : n.name;
			if (s) return _sanitize(s) + id;
		} else if (parent.type === 'Property') {
			n = parent.key;
			if (n.type === 'Identifier' || n.type === 'Literal') return _sanitize(n.name || n.value) + id;
		}
		return id;
	}

	function _canonScopes(node, options) {
		function _doIt(node, parent) {
			var scope = parent._scope;
			node._scope = scope;
			var async = scope.isAsync();
			if (!async && !_isFunction(node)) {
				if (node.type === 'Identifier' && node.name === options.callback && !parent._isStar) {
					throw new Error(node.filename + ": Function contains async calls but does not have _ parameter: " + node.name + " at line " + (node.loc && node.loc.start.line));
				}
				return _propagate(node, _doIt);
			}

			if (node.type === 'TryStatement') node._async = true;
			var result, cbIndex;
			switch (node.type) {
			case 'FunctionDeclaration':
			case 'FunctionExpression':
				result = node;
				cbIndex = node.params.reduce(function(index, param, i) {
					if (param.name !== options.callback) return index;
					if (index < 0) return i;
					else throw new Error("duplicate _ parameter");
				}, -1);
				if (cbIndex >= 0) {
					// handle coffeescript fat arrow method definition (issue #141)
					if (_isFatArrow(node)) return node;
					// handl coffeescript default params (issue #218)
					if (_hasDefaultCallback(node, options)) {
						// converted function is not async any more
						cbIndex = -1;
					} else {
						// should rename options -> context because transform writes into it.
						options.needsTransform = true;
						// assign names to anonymous functions (for futures)
						if (!node.id) node.id = _identifier(_guessName(node, parent));
					}
				}
				// if function is a statement, move it away
				if (async && (parent.type === 'Program' || parent.type === 'BlockStatement')) {
					scope.functions.push(node);
					result = undefined;
				}
				// create new scope for the body
				var bodyScope = new Scope(node.body, options);
				node.body._scope = bodyScope;
				bodyScope.name = node.id && node.id.name;
				bodyScope.cbIndex = cbIndex;
				bodyScope.line = node.loc && node.loc.start.line;
				node.body = _propagate(node.body, _doIt);
				// insert declarations at beginning of body
				if (cbIndex >= 0) bodyScope.functions.push(_literal("BEGIN_BODY")); // will be removed later
				node.body.body = bodyScope.functions.concat(node.body.body);
				if (bodyScope.hasThis && !node._inhibitThis) {
					bodyScope.vars.push(_declarator(_safeName(options.precious, "__this"), _node(node, 'ThisExpression')));
				}
				if (bodyScope.hasArguments && !node._inhibitArguments) {
					bodyScope.vars.push(_declarator(_safeName(options.precious, "__arguments"), _identifier("arguments")));
				}
				if (bodyScope.vars.length > 0) {
					node.body.body.splice(0, 0, _node(node, 'VariableDeclaration', {
						kind: 'var', // will see later about preserving const, ...
						declarations: bodyScope.vars,
					}));
				}
				// do not set _async flag
				return result;
			case 'VariableDeclaration':
				var declarations = node.declarations.map(function(child) {
					if (!scope.vars.some(function(elt) {
						return elt.id.name === child.id.name;
					})) {
						scope.vars.push(_declarator(child.id.name, null));
					}
					if (!child.init) return null;
					child = _assignTemplate.generate(parent, {
						$lhs: _identifier(child.id.name),
						$rhs: child.init
					});
					if (parent.type === 'ForStatement') child = child.expression;
					return child;
				}).filter(function(child) {
					return child != null;
				});
				if (declarations.length === 0) {
					// leave variable if `for (var x in y)`
					return parent.type === 'ForInStatement' //
					? node.declarations[node.declarations.length - 1].id : undefined;
				}
				if (parent.type === 'BlockStatement' || parent.type === 'Program') {
					result = _node(parent, 'BlockStatement', {
						body: declarations,
					});
				} else {
					result = _node(parent, 'SequenceExpression', {
						expressions: declarations,
					});
				}
				result = _propagate(result, _doIt);
				parent._async |= result._async;
				return result;
			case 'ThisExpression':
				scope.hasThis = true;
				return _identifier(_safeName(options.precious, "__this"));
			case 'Identifier':
				if (node.name === "arguments") {
					scope.hasArguments = true;
					return _identifier(_safeName(options.precious, "__arguments"));
				}
				node = _propagate(node, _doIt);
				node._async |= node.name === options.callback;
				if (node._async && !(parent.arguments) && // func(_) is ok
					!(parent.type === 'Property' && node === parent.key) && // { _: 1 } is ok
					!(isDot(parent) && node === parent.property))
					throw new Error("invalid usage of '_'");
				parent._async |= node._async;
				return node;
			case 'NewExpression':
				cbIndex = node.arguments.reduce(function(index, arg, i) {
					if (arg.type !== 'Identifier' || arg.name !== options.callback) return index;
					if (index < 0) return i;
					else throw new Error("duplicate _ argument");
				}, -1);
				if (cbIndex >= 0) {
					var constr = _node(node, 'CallExpression', {
						callee: _identifier(_safeName(options.precious, '__construct')),
						arguments: [node.callee, _literal(cbIndex)]
					});
					node = _node(node, 'CallExpression', {
						callee: constr,
						arguments: node.arguments
					});
				}
				node = _propagate(node, _doIt);
				parent._async |= node._async;
				return node;
			case 'CallExpression':
				_convertThen(node, options);
				_convertCoffeeScriptCalls(node, options);
				_convertApply(node, options);
				// fall through
			default:
				if (node.type === 'SwitchCase') {
					// wrap consequent into a block, to reuse block logic in subsequent steps
					if (node.consequent.length !== 1 || node.consequent[0].type !== 'BlockStatement') {
						node.consequent = [_node(node, 'BlockStatement', {
							body: node.consequent,
						})];
					}
					if (node.test == null) parent.hasDefault = true;
				}
				node = _propagate(node, _doIt);
				_setBreaks(node);
				parent._async |= node._async;
				return node;
			}
		}
		return _propagate(node, _doIt);
	}

	function _convertThen(node, options) {
		// promise.then(_, _) -> __pthen(promise, _)
		var fn = node.callee;
		var args = node.arguments;
		if (isDot(fn) && args.length === 2 //
			&& args[0].type === 'Identifier' && args[0].name === options.callback
			&& args[1].type === 'Identifier' && args[1].name === options.callback) {
			node.arguments = [fn.object, _literal(fn.property.name), args[1]];
			fn.type = 'Identifier';
			fn.name = "__pthen";
		}
	}

	function _convertCoffeeScriptCalls(node, options) {
		// takes care of anonymous functions inserted by 
		// CoffeeScript compiler
		var fn = node.callee;
		var args = node.arguments;
		if (fn.type === 'FunctionExpression' && fn.params.length === 0 && !fn.id && args.length === 0) {
			// (function() { ... })() 
			// --> (function(_) { ... })(_)
			fn._noFuture = true;
			fn.id = _identifier("___closure");
			fn.params = [_identifier(options.callback)];
			node.arguments = [_identifier(options.callback)];
		} else if (isDot(fn)) {
			var ident = fn.property;
			fn = fn.object;
			if (fn.type === 'FunctionExpression' && fn.params.length === 0 && !fn.id && ident.type === 'Identifier') {
				if (ident.name === "call" && args.length === 1 && args[0].type === 'ThisExpression') {
					// (function() { ... }).call(this) 
					// --> (function(_) { ... })(_)
					node.callee = fn;
					fn._noFuture = true;
					fn.id = _identifier("___closure");
					fn.params = [_identifier(options.callback)];
					node.arguments = [_identifier(options.callback)];
					node._scope.hasThis = true;
					fn._inhibitThis = true;
				} else if (ident.name === "apply" && args.length === 2 && args[0].type === 'ThisExpression' //
					&& args[1].type === 'Identifier' && args[1].name === "arguments") {
					// (function() { ... }).apply(this, arguments) 
					// --> (function(_) { ... })(_)
					node.callee = fn;
					fn._noFuture = true;
					fn.id = _identifier("___closure");
					fn.params = [_identifier(options.callback)];
					node.arguments = [_identifier(options.callback)];
					node._scope.hasThis = true;
					node._scope.hasArguments = true;
					fn._inhibitThis = true;
					fn._inhibitArguments = true;
				} else if (ident.name === "call" && args.length === 1 && args[0].type === 'Identifier' && args[0].name === '_this') {
					// (function() { ... }).call(_this) 
					// --> (function(_) { ... }).call(_this, _)
					fn._noFuture = true;
					fn.id = _identifier("___closure");
					fn.params.push(_identifier(options.callback));
					args.push(_identifier(options.callback));
				}
			}
		}
	}

	function _isFatArrow(node) {
		//this.method = function(_) {
		//	return Test.prototype.method.apply(_this, arguments);
		//};
		// Params may vary but so we only test body.
		if (node.body.body.length !== 1) return false;
		var n = node.body.body[0];
		if (n.type !== 'ReturnStatement' || !n.argument) return false;
		n = n.argument;
		if (n.type !== 'CallExpression') return false;
		var args = n.arguments;
		var target = n.callee;
		if (args.length !== 2 || args[0].name !== '_this' || args[1].name !== 'arguments') return false;
		if (!isDot(target) || target.property.name !== 'apply') return false;
		target = target.object;
		if (!isDot(target)) return false;
		target = target.object;
		if (!isDot(target) || target.property.name !== 'prototype') return false;
		target = target.object;
		if (target.type !== 'Identifier') return false;
		// Got it. Params are useless so nuke them
		node.params = [];
		return true;
	}

	function _hasDefaultCallback(node, options) {
		// function(a, b, _) {
		//  if (a == null) { a = ... }
		//  if (_ == null) { _ = ... }
		//  <body>
		//
		// becomes
		//
		// function(a, b, cb) {
		//  var args = Array.prototype.slice.call(arguments, 0);
		//  if (a == null) { args[0] = ... }
		//  if (cb == null) { args[2] = ... }
		//  (function(a, b, _) {
		//    <body>
		//  }).apply(this, args);
		var indexes = [];
		var paramI = -1;
		var skip = 0;
		for (var i = 0; i < node.body.body.length; i++) {
			var child = node.body.
			body[i];
			if (i === 0 && child.type === 'VariableDeclaration') {
				skip = 1;
				continue;
			}
			if (child.type !== 'IfStatement') return false;
			if (child.test.type !== 'BinaryExpression' && child.test.operator !== '==') return false;
			var ident = child.test.left;
			if (ident.type !== 'Identifier') return false;
			if (child.test.right.type !== 'Literal' || child.test.right.value !== null) return false;
			if (!child.consequent.body || child.consequent.body.length !== 1) return false;
			var assign = child.consequent.body[0];
			if (assign.type !== 'ExpressionStatement') return false;
			assign = assign.expression;
			if (assign.type !== 'AssignmentExpression') return false;
			if (assign.left.type !== 'Identifier') return false;
			if (assign.left.name !== ident.name) return false;
			// we got a candidate - let us find the param
			while (++paramI < node.params.length) {
				if (ident.name === node.params[paramI].name) break;
			}
			if (paramI === node.params.length) return false;
			indexes.push(paramI);
			if (ident.name === options.callback) {
				// got it
				var originalParams = node.params.slice(0);
				var cb = _safeName(options.precious, 'cb');
				// need to clone args because arguments is not a true array and its length is not bumped
				// if we assigned the callback beyond arguments.length
				var args = _safeName(options.precious, 'args');
				node.params[paramI] = _identifier(cb);
				for (var k = 0; k < indexes.length; k++) {
					// chain has been verified above
					var ifn = node.body.body[skip + k];
					if (k === indexes.length - 1) ifn.test.left.name = cb;
					var lhs = ifn.consequent.body[0].expression.left;
					// too lazy to create real tree - fake it with identifier
					lhs.name = args + "[" + indexes[k] + "]";
				}
				node._async = false;
				var remain = node.body.body;
				node.body.body = remain.splice(0, paramI);
				// ugly hack to insert args initializer
				node.body.body.splice(0, 0, _identifier("var " + args + " = Array.prototype.slice.call(arguments, 0);"));
				node.body.body.push(_node(node, 'ReturnStatement', {
					argument: _node(node, 'CallExpression', {
						callee: _node(node, 'MemberExpression', {
							object: _node(node, 'FunctionExpression', {
								params: originalParams,
								body: _node(node, 'BlockStatement', { body: remain }),
								parenthesized: true,
							}),
							property: _identifier("apply"),
						}),
						arguments: [_identifier("this"), _identifier(args)],
					}),
				}));
				return true;
			}
		}
		// we did not find it
		return false;
	}

	function _convertApply(node, options) {
		// f.apply(this, arguments) -> __apply(_, f, __this, __arguments, cbIndex)
		var dot = node.callee;
		var args = node.arguments;
		if (isDot(dot)) {
			var ident = dot.property;
			if (ident.type === 'Identifier' && ident.name === "apply" && args.length === 2 //
			&& args[0].type === 'ThisExpression' && args[1].type === 'Identifier' && args[1].name === "arguments") {
				var f = dot.object;
				node.callee = _identifier('__apply');
				node.arguments = [_identifier(options.callback), f, _identifier('__this'), _identifier('__arguments'), _literal(node._scope.cbIndex)];
				node._scope.hasThis = true;
				node._scope.hasArguments = true;
			}
		}
	}

	var _switchVarTemplate = new Template("canon", "{ var $v = true; }");
	var _switchIfTemplate = new Template("canon", "if ($v) { $block; }");

	function _setBreaks(node) {
		switch (node.type) {
		case 'IfStatement':
			node._breaks = node.consequent._breaks && node.alternate && node.alternate._breaks;
			break;
		case 'SwitchStatement':
			if (!node.hasDefault && node._async) {
				node.cases.push(_node(node, 'SwitchCase', {
					consequent: [_node(node, 'BlockStatement', {
						body: [_node(node, 'BreakStatement')],
					})],
				}));
			}
			for (var i = 0; i < node.cases.length; i++) {
				var stmts = node.cases[i];
				if (node._async && stmts.consequent[0].body.length > 0 && !stmts._breaks) {
					if (i === node.cases.length - 1) {
						stmts.consequent[0].body.push(_node(node, 'BreakStatement'));
						stmts._breaks = true;
					} else {
						// we rewrite:
						//		case A: no_break_A
						//		case B: no_break_B
						//		case C: breaking_C
						//
						// as:
						//		case A: var __A = true;
						//		case B: var __B = true;
						//		case C:
						//			if (__A) no_break_A
						//			if (__B) no_break_B
						//			breaking_C
						var v = _identifier(_genId(node));
						var body = stmts.consequent[0];
						node.cases[i].consequent = [_switchVarTemplate.generate(node.cases[i], {
							$v: v,
						})];
						var ifStmt = _switchIfTemplate.generate(node.cases[i], {
							$v: v,
							$block: body,
						});
						node.cases[i + 1].consequent[0].body.splice(0, 0, ifStmt);
					}
				}
			}
			break;
		case 'TryStatement':
			node._breaks = node.block._breaks && node.handlers.length && node.handlers[0].body._breaks;
			break;
		case 'BlockStatement':
		case 'Program':
			node.body.forEach(function(child) {
				node._breaks |= child._breaks;
			});
			break;
		case 'SwitchCase':
			if (node.consequent.length !== 1 || node.consequent[0].type !== 'BlockStatement') throw new Error("internal error: SwitchCase not wrapped: " + node.consequent.length);
			node._breaks |= node.consequent[0]._breaks;
			break;
		case 'ReturnStatement':
		case 'ThrowStatement':
		case 'BreakStatement':
			node._breaks = true;
			break;
		}
	}

	/*
	 * Flow canonicalization pass:
	 *   Converts all loops to FOR format
	 *   Converts lazy expressions
	 *   Splits try/catch/finally
	 *   Wraps isolated statements into blocks
	 */

	function _statementify(exp) {
		if (!exp) return exp;
		var block = _node(exp, 'BlockStatement', {
			body: []
		});

		function uncomma(node) {
			if (node.type === 'SequenceExpression') {
				node.expressions.forEach(uncomma);
			} else {
				block.body.push(node.type === 'ExpressionStatement' ? node : _semicolon(node));
			}
		}
		uncomma(exp);
		return block;

	}

	function _blockify(node) {
		if (!node || node.type === 'BlockStatement') return node;
		if (node.type === 'SequenceExpression') return _statementify(node);
		var block = _node(node, 'BlockStatement', {
			body: [node]
		});
		block._async = node._async;
		return block;
	}

	var _flowsTemplates = {
		WHILE: new Template("flows", "{" + //
		"	for (; $test;) {" + //
		"		$body;" + //
		"	}" + //
		"}"),

		DO: new Template("flows", "{" + //
		"	var $firstTime = true;" + //
		"	for (; $firstTime || $test;) {" + //
		"		$firstTime = false;" + //
		"		$body;" + //
		"	}" + //
		"}"),

		FOR: new Template("flows", "{" + //
		"	$init;" + //
		"	for (; $test; $update) {" + //
		"		$body;" + //
		"	}" + //
		"}"),

		FOR_IN: new Template("flows", "{" + //
		"	var $array = __forIn($object);" + //
		"	var $i = 0;" + //
		"	for (; $i < $array.length;) {" + //
		"		$iter = $array[$i++];" + //
		"		$body;" + //
		"	}" + //
		"}"),

		TRY: new Template("flows", "" + //
		"try {" + //
		"	try { $try; }" + //
		"	catch ($ex) { $catch; }" + //
		"}" + //
		"finally { $finally; }"),

		AND: new Template("flows", "" + //
		"return (function $name(_){" + //
		"	var $v = $op1;" + //
		"	if (!$v) {" + //
		"		return $v;" + //
		"	}" + //
		"	return $op2;" + //
		"})(_)", true, true),

		OR: new Template("flows", "" + //
		"return (function $name(_){" + //
		"	var $v = $op1;" + //
		"	if ($v) {" + //
		"		return $v;" + //
		"	}" + //
		"	return $op2;" + //
		"})(_)", true, true),

		HOOK: new Template("flows", "" + //
		"return (function $name(_){" + //
		"	var $v = $test;" + //
		"	if ($v) {" + //
		"		return $true;" + //
		"	}" + //
		"	return $false;" + //
		"})(_);", true, true),

		COMMA: new Template("flows", "" + //
		"return (function $name(_){" + //
		"	$body;" + //
		"	return $result;" + //
		"})(_);", true, true),

		CONDITION: new Template("flows", "" + //
		"return (function $name(_){" + //
		"	return $test;" + //
		"})(_);", true, true),

		UPDATE: new Template("flows", "" + //
		"return (function $name(_){" + //
		"	$update;" + //
		"})(_);", true, true)
	};

	function _canonFlows(node, options) {
		var targets = {};
		function _doIt(node, parent, force) {
			var scope = node._scope;
			function withTarget(node, label, isLoop, fn) {
				label = label || '';
				var breakTarget = targets['break_' + label];
				var continueTarget = targets['continue_' + label];
				targets['break_' + label] = node;
				if (isLoop) targets['continue_' + label] = node;
				var result = fn();
				targets['break_' + label] = breakTarget;
				targets['continue_' + label] = continueTarget;
				return result;
			}

			function _doAsyncFor(node) {
				// extra pass to wrap async test and update
				if (node.test && node.test._async && node.test.type !== 'CallExpression') node.test = _flowsTemplates.CONDITION.generate(node, {
					$name: "__$" + node._scope.name,
					$test: _doIt(node.test, node, true),
				});
				if (node.update && node.update._async) node.update = _flowsTemplates.UPDATE.generate(node, {
					$name: "__$" + node._scope.name,
					$update: _statementify(node.update)
				});
			}
			if (node.type === 'ForStatement' && node._pass === "flows") _doAsyncFor(node);
			if (!scope || !scope.isAsync() || (!force && node._pass === "flows")) return _propagate(node, _doIt);

			var target;
			switch (node.type) {
			case 'IfStatement':
				node.consequent = _blockify(node.consequent);
				node.alternate = _blockify(node.alternate);
				break;
			case 'SwitchStatement':
				return withTarget(node, null, false, function() {
					if (node._async) {
						var def = node.cases.filter(function(n) {
							return n.test == null;
						})[0];
						if (!def) {
							def = _node(node, 'SwitchCase', {
								consequent: [_node(node, 'BlockStatement', {
									body: [],
								})],
							});
							node.cases.push(def);
						}
						if (!def._breaks) {
							def.consequent[0].body.push(_node(node, 'BreakStatement'));
						}
					}
					return _propagate(node, _doIt);					
				});
			case 'WhileStatement':
				node.body = _blockify(node.body);
				return withTarget(node, null, true, function() {
					if (node._async) {
						node = _flowsTemplates.WHILE.generate(node, {
							$test: node.test,
							$body: node.body
						});
					}
					return _propagate(node, _doIt);					
				});
			case 'DoWhileStatement':
				node.body = _blockify(node.body);
				return withTarget(node, null, true, function() {
					if (node._async) {
						node = _flowsTemplates.DO.generate(node, {
							$firstTime: _identifier(_genId(node)),
							$test: node.test,
							$body: node.body
						});
					}
					return _propagate(node, _doIt);					
				});
			case 'ForStatement':
				node.test = node.test || _literal(1);
				node.body = _blockify(node.body);
				return withTarget(node, null, true, function() {
					if (node._async) {
						if (node.init) {
							node = _flowsTemplates.FOR.generate(node, {
								$init: _statementify(node.init),
								$test: node.test,
								$update: node.update,
								$body: node.body
							});
						} else {
							if (node._pass !== "flows") {
								node._pass = "flows";
								_doAsyncFor(node);
							}
						}
					}
					return _propagate(node, _doIt);					
				});
			case 'ForInStatement':
				node.body = _blockify(node.body);
				return withTarget(node, null, true, function() {
					if (node._async) {
						if (node.left.type !== 'Identifier') {
							throw new Error("unsupported 'for ... in' syntax: type=" + node.left.type);
						}
						node = _flowsTemplates.FOR_IN.generate(node, {
							$array: _identifier(_genId(node)),
							$i: _identifier(_genId(node)),
							$object: node.right,
							$iter: node.left,
							$body: node.body
						});
					}
					return _propagate(node, _doIt);					
				});
			case 'TryStatement':
				if (node.block && node.handlers.length && node.finalizer) {
					node = _flowsTemplates.TRY.generate(node, {
						$try: node.block,
						$catch: node.handlers[0].body,
						$ex: node.handlers[0].param,
						$finally: node.finalizer
					});
				}
				break;
			case 'LogicalExpression':
				if (node._async) {
					node = _flowsTemplates[node.operator === '&&' ? 'AND' : 'OR'].generate(node, {
						$name: "__$" + node._scope.name,
						$v: _identifier(_genId(node)),
						$op1: node.left,
						$op2: node.right,
					});
				}
				break;
			case 'ConditionalExpression':
				if (node._async) {
					node = _flowsTemplates.HOOK.generate(node, {
						$name: "__$" + node._scope.name,
						$v: _identifier(_genId(node)),
						$test: node.test,
						$true: node.consequent,
						$false: node.alternate,
					});
				}
				break;

			case 'SequenceExpression':
				if (node._async) {
					node = _flowsTemplates.COMMA.generate(node, {
						$name: "__$" + node._scope.name,
						$body: _node(node, 'BlockStatement', {
							body: node.expressions.slice(0, node.expressions.length - 1).map(_semicolon),
						}),
						$result: node.expressions[node.expressions.length - 1]
					});
				}
				break;
			case 'LabeledStatement':
				return withTarget(node, node.label.name, true, function() {
					return _propagate(node, _doIt);
				});
			case 'BreakStatement':
				target = targets['break_' + (node.label ? node.label.name : '')];
				if (!target) {
					if (node._async == null) throw new Error("internal error: break target not set");
				} else {
					node._async = !!target._async;
				}
				break;
			case 'ContinueStatement':
				target = targets['continue_' + (node.label ? node.label.name : '')];
				if (!target) {
					if (node._async == null) throw new Error("internal error: continue target not set");
				} else {
					node._async = !!target._async;
				}
				break;
			}
			return _propagate(node, _doIt);
		}
		return _propagate(node, _doIt);
	}

	/*
	 * Disassembly pass
	 */

	function _split(node, prop) {
		var exp = node[prop];
		if (!exp || !exp._async) return node;
		var id = _genId(node);
		var v = _declarator(id, exp);
		node[prop] = _identifier(id);
		return _node(node, 'BlockStatement', {
			body: [_node(node, 'VariableDeclaration', {
				kind: 'var', // see later
				declarations: [v],
			}), node]
		});
	}

	function _disassemble(node, options) {
		function _disassembleIt(node, parent, noResult) {
			if (!node._async) return _propagate(node, _scanIt);
			node = _propagate(node, _disassembleIt);
			if (node.type === 'CallExpression') {
				if (node.callee.type === 'Identifier' && node.callee.name.indexOf('__wrap') === 0) {
					node._isWrapper = true;
					return node;
				}
				var args = node.arguments;
				if (args.some(function(arg) {
					return (arg.type === 'Identifier' && arg.name === options.callback) || arg._isWrapper;
				})) {
					if (noResult) {
						node._scope.disassembly.push(_statementify(node));
						return;
					} else {
						if (parent.type === 'Identifier' && parent.name.indexOf('__') === 0) {
							// don't generate another ID, use the parent one
							node._skipDisassembly = true;
							return node;
						}
						var id = _genId(node);
						var v = _declarator(id, node);
						node = _node(node, 'VariableDeclaration', {
							kind: 'var', // fix later
							declarations: [v]
						});
						node._scope.disassembly.push(node);
						return _identifier(id);
					}
				}
			}
			return node;
		}

		function _scanIt(node, parent) {
			var scope = node._scope;
			if (!scope || !scope.isAsync() || !node._async) return _propagate(node, _scanIt);
			switch (node.type) {
			case 'IfStatement':
				node = _split(node, "test");
				break;
			case 'SwitchStatement':
				node = _split(node, "discriminant");
				break;
			case 'ForStatement':
				break;
			case 'ReturnStatement':
				node = _split(node, "argument");
				break;
			case 'ThrowStatement':
				node = _split(node, "argument");
				break;
			case 'VariableDeclaration':
				_assert(node.declarations.length === 1);
				var decl = node.declarations[0];
				scope.disassembly = [];
				decl.init = _disassembleIt(decl.init, decl);
				node._async = decl.init._skipDisassembly;
				scope.disassembly.push(node);
				return _node(parent, 'BlockStatement', {
					body: scope.disassembly,
				});
			case 'ExpressionStatement':
				scope.disassembly = [];
				node.expression = _disassembleIt(node.expression, node, true);
				if (node.expression) {
					node._async = false;
					scope.disassembly.push(node);
				}
				return _node(parent, 'BlockStatement', {
					body: scope.disassembly,
				});
			}
			return _propagate(node, _scanIt);
		}
		return _propagate(node, _scanIt);

	}

	/*
	 * Transformation pass - introducing callbacks
	 */
	var _cbTemplates = {
		FUNCTION: new Template("cb", "{" + //
		"	$decls;" + //
		"	var __frame = { name: $fname, line: $line };" + //
		"	return __func(_, this, arguments, $fn, $index, __frame, function $name(){" + //
		"		$body;" + //
		"		_();" + //
		"	});" + //
		"}"),

		FUNCTION_INTERNAL: new Template("cb", "{ $decls; $body; _(); }"),

		RETURN: new Template("cb", "return _(null, $value);"),

		RETURN_UNDEFINED: new Template("cb", "return _(null);"),

		THROW: new Template("cb", "return _($exception);"),

		IF: new Template("cb", "" + //
		"return (function $name(__then){" + //
		"	if ($test) { $then; __then(); }" + //
		"	else { $else; __then(); }" + //
		"})(function $name(){ $tail; });"),

		SWITCH: new Template("cb", "" + // 
		"return (function $name(__break){" + //
		"	$statement;" + //
		"})(function $name(){ $tail; });"),

		LABEL: new Template("cb", "" + // 
		"$statement;" + //
		"$tail;"),

		BREAK: new Template("cb", "return __break();"),
		
		LABELLED_BREAK: new Template("cb", "return $break();"),

		CONTINUE: new Template("cb", "" + //
		"while (__more) { __loop(); } __more = true;" + //
		"return;"),

		LABELLED_CONTINUE: new Template("cb", "" + //
		"while ($more.get()) { $loop(); } $more.set(true);" + //
		"return;"),

		LOOP1: new Template("cb", "" + //
		"if ($v) {" + //
		"	$body;" + //
		"	while (__more) { __loop(); } __more = true;" + //
		"}" + //
		"else { __break(); }"),

		// LOOP2 is in temp pass so that it gets transformed if update is async
		LOOP2: new Template("temp", "var $v = $test; $loop1;"),

		LOOP2_UPDATE: new Template("temp", "" + //
		"if ($beenHere) { $update; } else { $beenHere = true; }" + //
		"var $v = $test; $loop1;"),

		FOR: new Template("cb", "" + //
		"return (function ___(__break){" + //
		"	var __more;" + //
		"	var __loop = __cb(_, __frame, 0, 0, function $name(){" + //
		"		__more = false;" + //
		"		$loop2" + //
		"	});" + //
		"	do { __loop(); } while (__more); __more = true;" + //
		"})(function $name(){ $tail;});"),

		LABELLED_FOR: new Template("cb", "" + //
		"return (function ___(__break){" + //
		"	var __more, $more = { get: function() { return __more; }, set: function(v) { __more = v; }};" + //
		"	var __loop = __cb(_, __frame, 0, 0, function $name(){" + //
		"		var $break = __break, $loop = __loop;" + //
		"		__more = false;" + //
		"		$loop2" + //
		"	});" + //
		"	do { __loop(); } while (__more); __more = true;" + //
		"})(function $name(){ $tail;});"),

		FOR_UPDATE: new Template("cb", "" + //
		"var $beenHere = false;" + //
		"return (function ___(__break){" + //
		"	var __more;" + //
		"	var __loop = __cb(_, __frame, 0, 0, function $name(){" + //
		"		__more = false;" + //
		"		$loop2" + //
		"	});" + //
		"	do { __loop(); } while (__more); __more = true;" + //
		"})(function $name(){ $tail; });"),

		LABELLED_FOR_UPDATE: new Template("cb", "" + //
		"var $beenHere = false;" + //
		"return (function ___(__break){" + //
		"	var __more, $more = { get: function() { return __more; }, set: function(v) { __more = v; }};" + //
		"	var __loop = __cb(_, __frame, 0, 0, function $name(){" + //
		"		var $break = __break, $loop = __loop;" + //
		"		__more = false;" + //
		"		$loop2" + //
		"	});" + //
		"	do { __loop(); } while (__more); __more = true;" + //
		"})(function $name(){ $tail; });"),

		CATCH: new Template("cb", "" + //
		"return (function ___(__then){" + //
		"	(function ___(_){" + //
		"		__tryCatch(_, function $name(){ $try; __then(); });" + //
		"	})(function ___($ex, __result){" + //
		"		__catch(function $name(){" + //
		"			if ($ex) { $catch; __then(); }" + //
		"			else { _(null, __result); }" + //
		"		}, _);" + //
		"	});" + //
		"})(function ___(){" + //
		"	__tryCatch(_, function $name(){ $tail; });" + //
		"});"),

		FINALLY: new Template("cb", "" + //
		"return (function ___(__then){" + //
		"	(function ___(_){" + //
		"		__tryCatch(_, function $name(){ $try; _(null, null, true); });" + //
		"	})(function ___(__e, __r, __cont){" + //
		"		(function ___(__then){" + //
		"			__tryCatch(_, function $name(){ $finally; __then(); });" + //
		"		})(function ___(){" + //
		"			__tryCatch(_, function ___(){" + //
		"				if (__cont) __then(); else _(__e, __r);" + //
		"			});" + //
		"		})" + //
		"	});" + //
		"})(function ___(){" + //
		"	__tryCatch(_, function $name(){ $tail; });" + //
		"});"),

		CALL_VOID: new Template("cb", "return __cb(_, __frame, $offset, $col, function $name(){ $tail; }, true, $returnArray)", true),

		CALL_TMP: new Template("cb", "return __cb(_, __frame, $offset, $col, function ___(__0, $result){ $tail }, true, $returnArray)", true),

		CALL_RESULT: new Template("cb", "" + //
		"return __cb(_, __frame, $offset, $col, function $name(__0, $v){" + //
		"	var $result = $v;" + //
		"	$tail" + //
		"}, true, $returnArray)", true)
	};

	function _callbackify(node, options) {
		var label;
		function _scanIt(node, parent) {
			node = _flatten(node);
			if (!node._scope || !node._scope.isAsync() || node._pass === "cb") return _propagate(node, _scanIt);
			switch (node.type) {
			case 'Program':
			case 'BlockStatement':
				if (node.type === 'Program' || parent.type === 'FunctionExpression' || parent.type === 'FunctionDeclaration') {
					if (parent._pass !== "cb") {
						// isolate the leading decls from the body because 'use strict'
						// do not allow hoisted functions inside try/catch
						var decls;
						for (var cut = 0; cut < node.body.length; cut++) {
							var child = node.body[cut];
							if (child.type === 'Literal' && child.value === "BEGIN_BODY") {
								decls = node.body.splice(0, cut);
								node.body.splice(0, 1);
								break;
							}
						}
						var template = parent._noFuture || parent._pass === "flows" ? _cbTemplates.FUNCTION_INTERNAL : _cbTemplates.FUNCTION;
						node = template.generate(node, {
							$fn: parent.id.name,
							//node._scope.name ? _identifier(node._scope.name) : _node(node, NULL),
							$name: "__$" + node._scope.name,
							$fname: _literal(parent.id.name),
							$line: _literal(originalLine(options, node._scope.line)),
							$index: _literal(node._scope.cbIndex),
							$decls: _node(node, 'BlockStatement', {
								body: decls || []
							}),
							$body: node
						});
					}
					//node.type = 'Program';
				}
				// continue with block restructure
				for (var i = 0; i < node.body.length; i++) {
					node.body[i] = _restructureIt(node, i);
				}
				return node;
			}
			return _propagate(node, _scanIt);
		}

		function _extractTail(parent, i) {
			return _node(parent, 'BlockStatement', {
				body: parent.body.splice(i + 1, parent.body.length - i - 1)
			});
		}

		function _restructureIt(parent, i) {
			var node = parent.body[i];
			if (node._pass === "cb") return _propagate(node, _scanIt);
			var tail;
			switch (node.type) {
			case 'ReturnStatement':
				_extractTail(parent, i);
				var template = node.argument ? _cbTemplates.RETURN : _cbTemplates.RETURN_UNDEFINED;
				node = template.generate(node, {
					$value: node.argument
				});
				break;
			case 'ThrowStatement':
				_extractTail(parent, i);
				node = _cbTemplates.THROW.generate(node, {
					$exception: node.argument
				});
				break;
			case 'BreakStatement':
				if (!node._async) break;
				_extractTail(parent, i);
				if (node.label) {
					node = _cbTemplates.LABELLED_BREAK.generate(node, {
						$break: _safeName(options.precious, '__break__' + node.label.name)
					});
				} else {
					node = _cbTemplates.BREAK.generate(node, {});					
				}
				break;
			case 'ContinueStatement':
				if (!node._async) break;
				_extractTail(parent, i);
				if (node.label) {
					node = _cbTemplates.LABELLED_CONTINUE.generate(node, {
						$loop: _safeName(options.precious, '__loop__' + node.label.name),
						$more: _safeName(options.precious, '__more__' + node.label.name),
					});					
				} else {
					node = _cbTemplates.CONTINUE.generate(node, {});					
				}
				break;
			case 'TryStatement':
				tail = _extractTail(parent, i);
				if (node.handlers.length) {
					node = _cbTemplates.CATCH.generate(node, {
						$name: "__$" + node._scope.name,
						$try: node.block,
						$catch: node.handlers[0].body,
						$ex: node.handlers[0].param,
						$tail: tail
					});
				} else {
					node = _cbTemplates.FINALLY.generate(node, {
						$name: "__$" + node._scope.name,
						$try: node.block,
						$finally: node.finalizer,
						$tail: tail
					});
				}
				break;
			default:
				if (node._async) {
					tail = _extractTail(parent, i);
					switch (node.type) {
					case 'IfStatement':
						node = _cbTemplates.IF.generate(node, {
							$name: "__$" + node._scope.name,
							$test: node.test,
							$then: node.consequent,
							$else: node.alternate || _node(node, 'BlockStatement', {
								body: []
							}),
							$tail: tail
						});
						break;
					case 'SwitchStatement':
						node._pass = "cb"; // avoid infinite recursion
						node = _cbTemplates.SWITCH.generate(node, {
							$name: "__$" + node._scope.name,
							$statement: node,
							$tail: tail
						});
						break;
					case 'LabeledStatement':
						var l = label;
						label = node.label.name;
						node = _cbTemplates.LABEL.generate(node, {
							$name: "__$" + node._scope.name,
							$statement: node.body,
							$tail: tail
						});
						node = _scanIt(node, parent);
						label = l;
						return node;
					case 'ForStatement':
						var v = _identifier(_genId(node));
						var loop1 = _cbTemplates.LOOP1.generate(node, {
							$v: v,
							$body: node.body,
						});
						var update = node.update;
						var beenHere = update && _identifier(_genId(node));
						var loop2 = (update ? _cbTemplates.LOOP2_UPDATE : _cbTemplates.LOOP2).generate(node, {
							$v: v,
							$test: node.test,
							$beenHere: beenHere,
							$update: _statementify(update),
							$loop1: loop1
						});
						node = (update 
							? (label ? _cbTemplates.LABELLED_FOR_UPDATE : _cbTemplates.FOR_UPDATE) 
							: (label ? _cbTemplates.LABELLED_FOR : _cbTemplates.FOR)).generate(node, {
							$name: "__$" + node._scope.name,
							$loop: _identifier(_safeName(options.precious, '__loop__' + label)),
							$break: _identifier(_safeName(options.precious, '__break__' + label)),
							$more: _identifier(_safeName(options.precious, '__more__' + label)),
							$beenHere: beenHere,
							$loop2: loop2,
							$tail: tail

						});
						break;
					case 'VariableDeclaration':
						_assert(node.declarations.length === 1);
						var decl = node.declarations[0];
						_assert(decl.type === 'VariableDeclarator');
						call = decl.init;
						decl.init = null;
						_assert(call && call.type === 'CallExpression');
						return _restructureCall(call, tail, decl.id.name);
					case 'ExpressionStatement':
						var call = node.expression;
						_assert(call.type === 'CallExpression');
						return _restructureCall(call, tail);
					default:
						throw new Error("internal error: bad node type: " + node.type + ": " + escodegen.generate(node));
					}
				}
			}
			return _scanIt(node, parent);

			function _restructureCall(node, tail, result) {
				var args = node.arguments;

				function _cbIndex(args) {
					return args.reduce(function(index, arg, i) {
						if ((arg.type === 'Identifier' && arg.name === options.callback) || arg._isWrapper) return i;
						else return index;
					}, -1);
				}
				var i = _cbIndex(args);
				_assert(i >= 0);
				var returnArray = args[i]._returnArray;
				if (args[i]._isWrapper) {
					args = args[i].arguments;
					i = _cbIndex(args);
				}
				// find the appropriate node for this call:
				// e.g. for "a.b(_)", find the node "b"
				var identifier = node.callee;
				while (isDot(identifier)) {
					identifier = identifier.property;
				}
				var bol = options.source.lastIndexOf('\n', identifier.start) + 1;
				var col = identifier.start - bol;
				args[i] = (result ? result.indexOf('__') === 0 ? _cbTemplates.CALL_TMP : _cbTemplates.CALL_RESULT : _cbTemplates.CALL_VOID).generate(node, {
					$v: _genId(node),
					$frameName: _literal(node._scope.name),
					$offset: _literal(Math.max(originalLine(options, identifier.loc && identifier.loc.start.line, col) - originalLine(options, node._scope.line), 0)),
					$col: _literal(originalCol(options, identifier.loc && identifier.loc.start.column, col)),
					$name: "__$" + node._scope.name,
					$returnArray: _node(node, 'Literal', {
						value: !!returnArray,
					}),
					$result: _identifier(result),
					$tail: tail
				});
				node = _propagate(node, _scanIt);

				var stmt = _node(node, 'ReturnStatement', {
					argument: node
				});
				stmt._pass = "cb";
				return stmt;
			}
		}
		return _propagate(node, _scanIt);
	}

	/*
	 * Simplify pass - introducing callbacks
	 */

	function _checkUsed(val, used) {
		if (typeof val === "string" && val.substring(0, 2) === "__") used[val] = true;
	}

	/* eslint-disable camelcase */
	var _optims = {
		function__0$fn: new Template("simplify", "return function ___(__0) { $fn(); }", true).root,
		function$return: new Template("simplify", "return function $fn1() { return $fn2(); }", true).root,
		function__0$arg1return_null$arg2: new Template("simplify", "return function ___(__0, $arg1) { var $arg2 = $arg3; return _(null, $arg4); }", true).root,
		__cb__: new Template("simplify", "return __cb(_, $frameVar, $line, $col, _)", true).root,
		__cbt__: new Template("simplify", "return __cb(_, $frameVar, $line, $col, _, true, false)", true).root,
		function$fn: new Template("simplify", "return function $fn1() { $fn2(); }", true).root,
		closure: new Template("simplify", "return (function ___closure(_){ $body; })(__cb(_,$frameVar,$line,$col,function $fnName(){_();},true,false))", true).root,
		safeParam: new Template("simplify", "return (function $fnName($param){ $body; })(function $fnName(){_();})", true).root,
	};
	/* eslint-enable camelcase */

	function _simplify(node, options, used) {
		if (node._simplified) return node;
		node._simplified = true;
		// eliminate extra braces on switch cases
		if (node.type === 'SwitchCase') {
			if (node.consequent.length === 1 && node.consequent[0].type === 'BlockStatement') //
				node.consequent = node.consequent[0].body;
		}

		_propagate(node, function(child) {
			return _simplify(child, options, used);
		});
		_checkUsed(node.name, used);

		function _match(prop, v1, v2, result) {
			var ignored = ["loc", "range", "raw"];
			if (prop.indexOf('_') === 0 || ignored.indexOf(prop) >= 0) return true;
			/* eslint-disable eqeqeq */
			if (v1 == v2) {
				//console.log("MATCHING1: " + v1);
				return true;
			}
			/* eslint-enable eqeqeq */
			if (v1 == null || v2 == null) {
				// ignore difference between null and empty array
				if (prop === "body" && v1 && v1.length === 0) return true;
				return false;
			}
			if (Array.isArray(v1)) {
				if (v1.length !== v2.length) return false;
				for (var i = 0; i < v1.length; i++) {
					if (!_match(prop, v1[i], v2[i], result)) return false;
				}
				return true;
			}
			if (v1.type === 'Identifier' && v1.name[0] === "$" && typeof v2.value === "number") {
				//console.log("MATCHING2: " + v1.name + " with " + v2.value);
				result[v1.name] = v2.value;
				return true;
			}
			if (typeof v1 === "string" && v1[0] === "$" && typeof v2 === "string") {
				//console.log("MATCHING3: " + v1 + " with " + v2);
				result[v1] = v2;
				return true;
			}
			if (v1.type) {
				var exp;
				if (v1.type === 'BlockStatement' && v1.body[0] && (exp = v1.body[0].expression) && typeof exp.name === "string" && exp.name[0] === '$') {
					result[exp.name] = v2;
					return true;
				}
				if (v1.type !== v2.type) return false;
				if (v1.type === 'Identifier' && v1.name === '$') {
					result[v1.name] = v2.name;
					return true;
				}

				for (var p in v1) {
					if (v1.hasOwnProperty(p) && p !== 'isTemplate') {
						if (!_match(p, v1[p], v2[p], result)) return false;
					}
				}
				return true;
			}
			return false;
		}

		var result = {};
		if (_match("", _optims.function__0$fn, node, result)) return _identifier(result.$fn);
		if (_match("", _optims.function$return, node, result) && (result.$fn1 === '___' || result.$fn1.indexOf('__$') === 0) && (result.$fn2 === '__break')) return _identifier(result.$fn2);
		if (_match("", _optims.function__0$arg1return_null$arg2, node, result) && result.$arg1 === result.$arg3 && result.$arg2 === result.$arg4) return _identifier("_");
		if (options.optimize && _match("", _optims.__cb__, node, result)) return _identifier("_");
		if (options.optimize && _match("", _optims.__cbt__, node, result)) return _identifier("_");
		if (_match("", _optims.function$fn, node, result) && (result.$fn1 === '___' || result.$fn1.indexOf('__$') === 0) && (result.$fn2 === '__then' || result.$fn2 === '__loop')) return _identifier(result.$fn2);
		if (_match("", _optims.closure, node, result)) { node.arguments[0] = _identifier("_"); }
		if (_match("", _optims.safeParam, node, result) && (result.$param === '__then' || result.$param === '__break')) node.arguments[0] = _identifier("_");
		_flatten(node);
		return node;
	}

	function _extend(obj, other) {
		for (var i in other) {
			obj[i] = other[i];
		}
		return obj;
	}

	function _cl(obj) {
		return _extend({}, obj);
	}

	var visit = 0;
	function dump(obj) {
		function fix(obj) {
			if (!obj || typeof obj !== 'object') return '' + obj;
			if (obj._visited === visit) return "<circular>";
			obj._visited = visit;
			if (Array.isArray(obj)) return obj.map(fix);
			return Object.keys(obj).filter(function(k) {
				return !/^(_|loc)/.test(k) || k === '_async';
			}).reduce(function(r, k) {
				r[k] = fix(obj[k]);
				return r;
			}, {});
		}
		visit++;
		return JSON.stringify(fix(obj), null, '  ');
	}

	function addNewlines(node) {
		var line = 1, l = 1;
		function doIt(obj, insideBlock) {
			if (!obj) return;
			if (obj.loc) l = Math.max(obj.loc.start.line, l);
			if (obj.type && insideBlock && line < l) {
				obj.leadingComments = new Array(l - line).join('#').split('#');
				line = l;
			}
			if (Array.isArray(obj)) return obj.forEach(function(o) {
				doIt(o, insideBlock);
			});
			if (!obj.type) return;
			var isBlock = obj.type === 'BlockStatement' || obj.type === 'SwitchCase';
			Object.keys(obj).forEach(function(k) {
				var v = obj[k];
				doIt(v, isBlock);
			});
		}
		doIt(node, false);
	}

	/// * `transformed = transform.transform(source, options)`  
	///   Transforms streamline source.  
	///   The following `options` may be specified:
	///   * `sourceName` identifies source (stack traces, transformation errors)
	///   * `lines` controls line mapping
	//    Undocumented options:
	//    * (obsolete) `callback` alternative identifier if `_` is already used 
	//    * (internal) `noHelpers` disables generation of helper functions (`__cb`, etc.)
	//    * (internal) `optimize` optimizes transform (but misses stack frames)
	exports.transform = function(source, options) {
		try {
			source = source.replace(/\r\n/g, "\n");
			options = options ? _extend({}, options) : {}; // clone to isolate options set at file level
			var sourceOptions = /streamline\.options\s*=\s*(\{.*\})/.exec(source);
			if (sourceOptions) {
				_extend(options, JSON.parse(sourceOptions[1]));
			}
			options.source = source;
			options.callback = options.callback || "_";
			options.lines = options.lines || "preserve";
			options.precious = {}; // identifiers found inside source
			//console.log("TRANSFORMING " + options.sourceName)
			//console.log("source=" + source);
			// esprima does not like return at top level so we wrap into a function
			// also \n is needed before } in case last line ends on a // comment
			source = "function dummy(){" + source + "\n}";
			var node = esprima.parse(source, {
				loc: true,
				range: true,
				source: options.sourceName || '<unknown>',
			});
			node = node.body[0].body;
			if (node.type !== 'BlockStatement') throw new Error("source wrapper error: " + node.type);
			//console.log(JSON.stringify(node, null, '  '));
			var strict = node.body[0] && node.body[0].expression && node.body[0].expression.value === "use strict";
			strict && node.body.splice(0, 1);
			_markSource(node, options);
			//console.log("tree=" + node);
			node = _canonTopLevelScript(node, options);
			//console.log("CANONTOPLEVEL=" + escodegen.generate(node));
			node = _canonScopes(node, options);
			//console.log("CANONSCOPES=" + escodegen.generate(node));
			if (!options.needsTransform) return options.source; // original source!
			node = _canonFlows(node, options);
			//console.log("CANONFLOWS=" + escodegen.generate(node));
			node = _disassemble(node, options);
			//console.log("DISASSEMBLE=" + escodegen.generate(node))
			node = _callbackify(node, options);
			//console.error(dump(node));
			//console.log("CALLBACKIFY=" + escodegen.generate(node))
			var used = {};
			node = _simplify(node, options, used);
			//fixRanges(node);
			if (options.lines === "preserve") addNewlines(node);

			// transform top node into Program to avoid extra curly braces
			if (node.type === "BlockStatement") node.type = "Program";

			var ecopts = options.sourceMap ? {
				sourceMap: true,
				sourceMapWithCode: true,
			} : options.lines === "preserve" ? {
				comment: true,
			} : {};
			var result = escodegen.generate(node, ecopts);
			if (options.sourceMap) {
				// convert result into a SourceNode.
				// would be much easier (and faster) if escodegen had an option to return SourceNode directly 
				var SourceNode = require('source-map').SourceNode;
				var SourceMapConsumer = require('source-map').SourceMapConsumer;
				result = SourceNode.fromStringWithSourceMap(result.code, new SourceMapConsumer(result.map.toString()));
			}

			if (options.lines === "preserve") {
				// turn comments into newlines
				//result = result.replace(/\n\s*/g, ' ').replace(/\/\*undefined\*\//g, '\n');
				result = result.split(/\/\*undefined\*\/\n/).map(function(s) {
					return s.replace(/\n\s*/g, ' ');
				}).join('\n');
			}

			// add helpers at beginning so that __g is initialized before any other code
			if (!options.noHelpers) {
				var s = exports.helpersSource(options, used, strict);
				if (options.sourceMap) {
					result.prepend(s);
				} else {
					result = s + result;
				}
			}
			//console.log("result=" + result);
			//console.log("TRANSFORMED " + options.sourceName + ": " + result.length)
			return result;
		} catch (err) {
			var message = "error streamlining " + (options.sourceName || 'source') + ": " + err.message;
			if (err.source && err.cursor) {
				var line = 1;
				for (var i = 0; i < err.cursor; i++) {
					if (err.source[i] === "\n") line += 1;
				}
				message += " on line " + line;
			} else if (err.stack) {
				message += "\nSTACK:\n" + err.stack;
			}
			throw new Error(message);
		}
	};
	// hack to fix #123
	exports.transform.version = exports.version;

	function _trim(fn) {
		return fn.toString().replace(/\s+/g, " ");
	}

	function include(mod, modules) {
		var source = modules + "['" + mod + "']=(mod={exports:{}});";
		source += "(function(module, exports){";
		var req = require; 	// prevents client side require from getting fs as a dependency
		source += req('fs').readFileSync(__dirname + '/../' + mod + '.js', 'utf8').replace(/(\/\/[^"\n]*\n|\/\*[\s\S]*?\*\/|\n)[ \t]*/g, "");
		source += "})(mod, mod.exports);";
		return source;
	}

	function requireRuntime(options) {
		var req = "require";
		if (!options.standalone) return req + "('" + (options.internal ? '..' : 'streamline/lib') + "/callbacks/runtime').runtime(__filename, " + !!options.oldStyleFutures + ")";
		var modules = _safeName(options.precious, "__modules");
		var s = "(function(){var " + modules + "={},mod;";
		s += "function require(p){var m=" + modules + "[p.substring(3)]; return m && m.exports};";
		s += include('globals', modules);
		s += include('util/future', modules);
		s += include('callbacks/runtime', modules);
		if (['funnel', 'forEach_', 'map_', 'filter_', 'every_', 'some_', 'reduce_', 'reduceRight_', 'sort_', 'apply_'].some(function(name) {
				return options.precious[name];
			})) s += include('callbacks/builtins', modules);
		s += "return " + modules + "['callbacks/runtime'].exports.runtime('" + options.sourceName + "', " + !!options.oldStyleFutures + ");";
		s += "})()";
		return s;
	}

	// Undocumented (internal)
	exports.helpersSource = function(options, used, strict) {
		var srcName = "" + options.sourceName; // + "_.js";
		var i = srcName.indexOf('node_modules/');
		if (i === -1 && typeof process === 'object' && typeof process.cwd === 'function') i = process.cwd().length;
		srcName = i >= 0 ? srcName.substring(i + 13) : srcName;
		var sep = options.lines === "preserve" ? " " : "\n";
		strict = strict ? '"use strict";' + sep : "";
		var s = sep + strict;
		var keys = ['__g', '__func', '__cb', '__future', '__propagate', '__trap', '__catch', '__tryCatch', '__forIn', '__apply', '__construct', '__setEF', '__pthen'];
		var __rt = _safeName(options.precious, "__rt");
		s += "var " + __rt + "=" + requireRuntime(options);
		keys.forEach(function(key) {
			var k = _safeName(options.precious, key);
			if (used[k]) s += "," + k + "=" + __rt + "." + key;
		});
		s += ";" + sep;
		if (options.promise) {
			var arg = typeof options.promise === "string" ? "'" + options.promise + "'" : "true";
			s += _safeName(options.precious, "__rt.__g") + ".setPromise(" + arg + ");" + sep;
		}
		return s;
	};
})(typeof exports !== 'undefined' ? exports : (window.Streamline = window.Streamline || {}));
