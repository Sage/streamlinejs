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
this.transform = transform;

var Narcissus = require('../../deps/narcissus');
var t = Narcissus.definitions.tokenIds;
var Walker = require('./walker');

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
		var vars = this.children;
		for (var ii = 0; ii < vars.length; ++ii) {
			names[vars[ii].name] = vars[ii].name;
		}
	}
	var walk = Walker({
		'function': function(name, args, body) {
			if (this.functionForm !== 1) {
				names[this.name] = this.name;
			}
			// Don't walk further by default
			if (recurse) {
				for (var ii in getLocals(this, true)) {
					names[ii] =ii;
				}
			}
		},
		'var': decl,
		'const': decl,
		'let': decl,
	});
	fn.body.children.map(walk);
	for (var ii = 0; ii < fn.params; ++ii) {
		names[fn.params[ii]] = fn.params[ii];
	}
	if (fn.name && fn.functionForm === 1) {
		names[fn.name] = fn.name;
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
	options = options || {};
	var callback = options.callback || '_';
	var didRewrite = 0;
	var position = 0;
	var buffer = '';
	var scope = Object.create(null);
	var streamlined = Object.create(null);
	var verboten = Object.create(null);
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
		var walk = Walker({
			'function': function(name, args, body) {
				if (this.functionForm !== 1) {
					(getCallback(args) === -1 ? not : declared)[name] = true;
				}
				// Don't walk further
			},
			'identifier': function(name, initializer) {
				if (!initializer) {
					return;
				}
				if (initializer.type === t.FUNCTION) {
					(getCallback(initializer.params) === -1 ? not : exprs)[name] = true;
				} else {
					not[name] = true;
				}
				walk(initializer);
			},
			'assign': function() {
				var name = this.children[0].type === t.IDENTIFIER && this.children[0].value;
				if (name) {
					var expr = this.children[1];
					if (expr.type === t.FUNCTION) {
						(getCallback(expr.params) === -1 ? not : exprs)[name] = true;
					} else {
						not[name] = true;
					}
				}
				walk(this.children[1]);
			},
		});
		fn.body.children.map(walk);
		for (var ii in declared) {
			exprs[ii] = true;
		}
		for (var ii in not) {
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
			if (args[ii] === callback || (args[ii].type === t.IDENTIFIER && args[ii].value === callback)) {
				if (idx === -1) {
					idx = ii;
				} else {
					lineno = lineno || args[ii].lineno;
					throw new Error('Callback argument used more than once in function call on line '+ lineno);
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
			throw new Error('Invalid catchup, '+ position+ ' to '+ end);
		}
		buffer += source.substring(position, end);
		position = end;
	}

	var walk = Walker({
		'function': function(name, args, body) {
			// Open this function
			if (name === callback) {
				throw new Error('Invalid usage of callback on line '+ this.lineno);
			}
			catchup(this.start);
			var idx = getCallback(args, this.lineno);
			if (idx !== -1 && this.functionForm === 1) {
				buffer += 'fstreamline__.create(';
				++didRewrite;
			}
			catchup(this.body.start + 1);

			// Analyze the scope of this function for locals and streamlined functions
			// We need locals to avoid renaming collisions with streamlined functions, and the streamlined
			// functions let us optimize `invoke`.
			var locals = getLocals(this);
			var localStreamlined = getStreamlinedDeclarations(this);
			var oldScope = scope;
			var oldStreamlined = streamlined;
			var oldVerboten = verboten;
			scope = chain(scope, locals);
			streamlined = chain(streamlined, localStreamlined.strict);
			verboten = chain(verboten);
			for (var ii in locals) {
				if (!localStreamlined.strict[ii]) {
					streamlined[ii] = false;
				}
				verboten[ii] = false;
			}
			if (idx !== -1 && this.functionForm === 1 && name) {
				// Can't use a streamline'd function by name from within that function
				verboten[name] = true;
			}

			// Hoist streamlined functions
			var hoisted = [];
			for (var ii in localStreamlined.declared) {
				var fragment = '_', len = 1;
				while (scope[ii+ fragment] || allIdentifiers[ii+ fragment]) {
					fragment = Array(++len + 1).join('_');
				}
				scope[ii] = ii+ fragment;
				hoisted.push(ii+ fragment+ ' = fstreamline__.create('+ ii+ ')');
				++didRewrite;
			}
			if (hoisted.length) {
				buffer += 'var '+ hoisted.join(', ')+ ';';
			}

			// Close up the function
			body.map(walk);
			catchup(this.end);
			if (idx !== -1 && this.functionForm === 1) {
				buffer += ', '+ idx+ ')';
			}

			// Reset scopes
			scope = oldScope;
			streamlined = oldStreamlined;
			verboten = oldVerboten;
		},
		'call': function(expr, args) {
			var idx = getCallback(args);
			if (false && idx !== -1 && expr.type === t.IDENTIFIER && streamlined[expr.value]) {
				// Optimized streamline callback. We know this call is to a streamlined function so we can
				// just inline it.
				if (scope[expr.value] === expr.value) {
					// In this case `expr` was declared with a function expression instead of a function
					// declaration, so the original function is no longer around.
					catchup(expr.start);
					buffer += '(';
					catchup(expr.end);
					buffer += '.fstreamlineFunction || 0)';
				} else {
					catchup(expr.end);
				}
				catchup(args[idx].start);
				buffer += '_';
				position = args[idx].end;
			} else if (idx !== -1) {
				// Rewrite streamlined calls
				catchup(this.start);
				buffer += 'fstreamline__.invoke(';
				if (expr.type === t.DOT) {
					// Method call: foo.bar(_)
					walk(expr.children[0]);
					catchup(expr.children[0].end);
					buffer += ', '+ JSON.stringify(expr.children[1].value);
				} else if (expr.type === t.INDEX) {
					// Dynamic method call: foo[bar](_)
					walk(expr.children[0]);
					catchup(expr.children[0].end);
					buffer += ', ';
					position = expr.children[1].start;
					walk(expr.children[1]);
					catchup(expr.children[1].end);
				} else {
					// Function call
					buffer += 'null, ';
					walk(expr);
					catchup(expr.end);
				}
				// Render arguments
				buffer += ', [';
				if (args.length) {
					position = args[0].start;
					for (var ii = 0; ii < args.length; ++ii) {
						if (ii !== idx) {
							walk(args[ii]);
						}
					}
					catchup(args[args.length - 1].end);
				}
				buffer += '], '+ idx+ ')';
				position = this.end;
				++didRewrite;
			} else {
				walk(expr);
				args.map(walk);
			}
		},
		'identifier': function(name, initializer) {
			if (name === callback) {
				throw new Error('Invalid usage of callback on line '+ this.lineno);
			} else if (verboten[name]) {
				throw new Error('Invalid use of indentifier `'+ name+ '` on line '+ this.lineno);
			}
			if (scope[name] && !this.followsDot) {
				catchup(this.start);
				buffer += scope[name];
				position = this.end;
			} else {
				// catchup to end will deal with all sort of oddities, like object initializer keys that are 
				// parsed as identifiers but need to be quoted.
				catchup(this.end);
			}
			initializer && walk(initializer);
		},
		'property_init': function() {
			catchup(this.children[1].start);
			walk(this.children[1]);
			catchup(this.children[1].end);			
		},
		'dot': function() {
			this.children[1].followsDot = true;
			this.children.map(walk);
		}
	});

	// Walk parsed source, rendering along the way
	var originalSource = source;
	source =
		'var fstreamline__ = require("streamline/lib/fibers/runtime"); (function(_) { '+
			source+
		'\n}.call(this, function(err) {\n'+
		'  if (err) throw err;\n'+
		'}));';
	var parsed = Narcissus.parser.parse(source);
	allIdentifiers = getLocals(parsed.children[1].expression.children[0].children[0], true);
	walk(parsed);
	buffer += source.substring(position);

	if (didRewrite > 1) {
		return buffer;
	} else {
		return originalSource;
	}
}
