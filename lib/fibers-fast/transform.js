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
	exports.version = require("../version").version + " (fibers-fast)";
	// hack to fix #123
	exports.transform.version = exports.version;

var walker = require('../fibers/walker');

function aggressiveReplace(source) {
	// arr.forEach_(_, function(_, item) {...}) --> arr.forEach(function(item, __, _) {...})
	// The __ parameter captures index param (2 chars so that replace preserves length)
	// we append _ to callback args list because transform needs async marker on callback.
	function testArg(arg) {
		return new RegExp('\\b' + arg + '\\b').test(source) ? null : arg;
	}
	function unusedIdent() {
		var arg;
		if ((arg = testArg('__'))) return arg;
		for (var i = 0; i < 26 && !arg; i++) {
			if ((arg = testArg(String.fromCharCode(0x41) + '_'))) return arg;
			if ((arg = testArg('_' + String.fromCharCode(0x41)))) return arg;
			if ((arg = testArg(String.fromCharCode(0x61) + '_'))) return arg;
			if ((arg = testArg('_' + String.fromCharCode(0x61)))) return arg;
		}
		return null;
	}
	var arg = unusedIdent();
	if (!arg) {
		console.log("cannot apply aggressive optimization!!");
		return source;
	} else {
		return source.replace(/\.(forEach|map|filter|every|some|reduce)_\(_, function\(_, ([^)]+)\)/g, function(all, name, params) {
			return '.' + name + '(function(' + params + ', ' + arg + ', _)';
		});
	}
}

/**
 * Transforms code to be streamliney. Line numbers are not maintained, but could be if I could
 * figure out how to do it with uglifyjs.
 */
function transform(source, options) {
	source = source.replace(/\r\n/g, "\n");
	options = options || {};
	if (options.aggressive) source = aggressiveReplace(source);
	var callback = options.callback || '_';
	var didRewrite = 0;
	var position = 0;
	var buffer = '';
	var async = false;

	function isAsyncArg(arg) {
		return arg.type === 'UnaryExpression' && arg.operator === '~' && arg.argument.type === 'Identifier' && arg.argument.name === callback;
	}
	function isArrayArg(arg) {
		return arg.type === 'ArrayExpression' && arg.elements.length === 1 && arg.elements[0].type === 'Identifier' && arg.elements[0].name === callback;
	}
	function isLShiftArg(arg) {
		return arg.type === 'BinaryExpression' && arg.operator === '<<' && //
		arg.left.type === 'Identifier' && arg.left.name === callback;
	}
	function isRShiftArg(arg) {
		return arg.type === 'BinaryExpression' && arg.operator === '>>' && //
		arg.left.type === 'Identifier' && arg.left.name === callback;
	}
	function isFutureArg(arg) {
		return arg.type === 'UnaryExpression' && (arg.operator === '!' || arg.operator === 'void') //
		&& arg.argument.type === 'Identifier' && arg.argument.name === callback;
	}
	function isAsyncParam(param) {
		return param === callback || (param.type === 'Identifier' && param.name === callback);
	}
	/**
	 * Finds the index of the callback param in an argument list, -1 if not found.
	 */
	function getCallback(args, testFn, lineno) {
		var idx = -1;
		for (var ii = 0; ii < args.length; ++ii) {
			if (testFn(args[ii])) {
				if (idx === -1) {
					idx = ii;
				} else {
					lineno = lineno || args[ii].loc.start.line;
					throw new Error('Callback argument used more than once in function call on line ' + lineno);
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

	var walk = walker({
		Function: function(name, args, body) {
			// Open this function
			if (name === callback) {
				throw new Error('Invalid usage of callback on line ' + this.loc.start.line);
			}
			var idx = getCallback(args, isAsyncParam, this.loc.start.line);
			catchup(this.body.range[0] + 1);
			var oldAsync = async;
			async = idx !== -1 || this.forceAsync;
			walk(this.body);
			async = oldAsync;
		},
		CallExpression: function(expr, args) {
			if (expr.type === 'Identifier' && expr.name === callback && args.length === 2) {
				catchup(expr.range[0]);
				buffer += 'fstreamline__.star';
				skipTo(expr.range[1]);
				args.map(walk);
				++didRewrite;
				return;
			}
			if (expr.type === 'MemberExpression' && !expr.computed && args.length === 2 && args[0].type === 'Identifier' && args[0].name === callback //
				&& args[1].type === 'Identifier' && args[1].name === callback) {
				if (!async) throw new Error(this.loc.start.line + ": Function contains async calls but does not have _ parameter");
				catchup(this.range[0]);
				buffer += ('fstreamline__.then.call(this,');
				skipTo(expr.object.range[0]);
				walk(expr.object);
				catchup(expr.object.range[1]);
				buffer += (', "' + expr.property.name + '", _)');
				skipTo(this.range[1]);
				++didRewrite;
				return;
			}
			var idxFast = getCallback(args, isAsyncParam);
			var idx = getCallback(args, isAsyncArg);
			var idxArray = getCallback(args, isArrayArg);
			if (idx === -1) idx = idxArray;
			if ((idxFast !== -1 || idx !== -1) && !async) throw new Error("Function contains async calls but does not have _ parameter on line " + this.loc.start.line);
			var ii, arg;
			function walkExpr() {
				skipTo(expr.range[0]);
				if (expr.type === 'MemberExpression') {
					skipTo(expr.object.range[0]);
					if (!expr.computed) {
						// Method call: foo.bar(_)
						walk(expr.object);
						catchup(expr.object.range[1]);
						buffer += ', ' + JSON.stringify(expr.property.name);
					} else {
						// Dynamic method call: foo[bar](_)
						walk(expr.object);
						catchup(expr.object.range[1]);
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
					catchup(expr.range[1]);
				}				
			}
			if (idx !== -1) {
				// Rewrite streamlined calls
				// issue #108: process between expr.range[0] and last arg end rather than this.range[0]/end
				catchup(this.range[0]);
				buffer += 'fstreamline__.invoke(';
				walkExpr();
				// Render arguments
				buffer += ', [';
				skipTo(args[0].range[0]);
				for (ii = 0; ii < args.length; ++ii) {
					catchup(args[ii].range[0]);
					if (ii !== idx) {
						walk(args[ii]);
						catchup(args[ii].range[1]);
					} else {
						buffer += '_';							
						skipTo(args[ii].range[1]);
					}
				}
				var options = idx;
				if (idxArray !== -1) options = '{ callbackIndex: ' + idx + ', returnArray: true }';
				buffer += '], ' + options + ')';
				skipTo(this.range[1]);
				++didRewrite;
			} else if ((idx = getCallback(args, isRShiftArg)) !== -1) {
				catchup(this.range[0]);
				skipTo(expr.range[0]);
				if (expr.type === 'MemberExpression' && !expr.computed) {
					buffer += 'fstreamline__.createBound(';
					walk(expr.object);
					catchup(expr.object.range[1]);
					buffer += ",'" + expr.property.name + "'";
					skipTo(expr.range[1]);
				} else {
					buffer += 'fstreamline__.create(';
					walk(expr);
					catchup(expr.range[1]);
				}
				buffer += ',' + idx + ')(';
				for (ii = 0; ii < args.length; ++ii) {
					skipTo(args[ii].range[0]);
					if (ii > 0) buffer += ', ';
					if (ii !== idx) {
						walk(args[ii]);
						catchup(args[ii].range[1]);
					} else {
						arg = args[ii].right;
						skipTo(arg.range[0]);
						walk(arg);
						catchup(arg.range[1]);
						skipTo(args[ii].range[1]);
					}
				}
				buffer += ')';
				skipTo(this.range[1]);
				++didRewrite;
			} else if ((idx = getCallback(args, isLShiftArg)) !== -1) {
				catchup(this.range[0]);
				skipTo(expr.range[0]);
				walk(expr);
				catchup(expr.range[1]);
				buffer += '(';
				for (ii = 0; ii < args.length; ++ii) {
					skipTo(args[ii].range[0]);
					if (ii > 0) buffer += ', ';
					if (ii !== idx) {
						walk(args[ii]);
						catchup(args[ii].range[1]);
					} else {
						arg = args[ii].right;
						if (arg.type !== 'FunctionExpression') throw new Error("Expected function after _ << ");
						var idx2 = getCallback(arg.params, isAsyncParam);
						if (idx2 === -1) throw new Error("Expected async function after _ << ");
						buffer += 'fstreamline__.create(';
						skipTo(arg.range[0]);
						walk(arg);
						catchup(arg.range[1]);
						buffer += ',' + idx2 + ', true)';
						skipTo(args[ii].range[1]);
					}
				}
				buffer += ')';
				skipTo(this.range[1]);
				++didRewrite;
			} else if ((idx = getCallback(args, isFutureArg)) !== -1) {
				var isPromise = args[idx].operator === "void";
				catchup(this.range[0]);
				buffer += 'fstreamline__.' + (isPromise ? 'promise' : 'spin') + '(';
				walkExpr();
				buffer += ', [';
				for (ii = 0; ii < args.length; ++ii) {
					skipTo(args[ii].range[0]);
					if (ii > 0) buffer += ', ';
					if (ii !== idx) {
						walk(args[ii]);
						catchup(args[ii].range[1]);
					} else {
						catchup(args[ii].range[0]);
						buffer += isPromise ? 'null' : 'false';
						skipTo(args[ii].range[1]);
					}
				}
				catchup(args[args.length - 1].range[1]);
				buffer += '], ' + idx + ')';
				skipTo(this.range[1]);
				++didRewrite;
			} else {
				var paren = 0;
				if (source[this.range[0]] === '(' && source[this.range[0] + 1] === '(' && 
					source[this.range[1] - 1] === ')' && source[this.range[1] - 2] === ')') {
					paren = 1;
				}
				if (startsWith(source, this.range[0] + paren, '(function() {')) {
					// handle coffeescript wrappers: set the forceAsync flag
					// so that we don't get an error about _ being used inside non async function
					if (endsWith(source, this.range[1] - paren, '})()')) {
						expr.forceAsync = async;
					}	
					if (endsWith(source, this.range[1] - paren, '}).call(this)') //
						|| endsWith(source, this.range[1] - paren, '}).call(_this)') //
						|| endsWith(source, this.range[1] - paren, '}).apply(this, arguments)')) {
						expr.object.forceAsync = async;
					}
				}
				walk(expr);
				args.map(walk);					
			}
		},
		Property: function() {
			// Dont't walk the property key, because that's an identifier and it will be clobbered, per
			// the below code
			walk(this.value);
		},
		MemberExpression: function() {
			// See comment above for Property
			walk(this.object);
			if (this.computed) walk(this.property);
		},
		UnaryExpression: function(operator, argument) {
			if (operator === '!' && argument.type === 'Identifier' && argument.name === callback) {
				catchup(this.range[0]);
				buffer += 'null';
				skipTo(this.range[1]);
			} else {
				walk(argument);
			}
		},
	});

	// Walk parsed source, rendering along the way
	var originalSource = source;
	var optStr = "(function(){";
	if (options.promise) {
		var arg = typeof options.promise === "string" ? "'" + options.promise + "'" : "true";
		optStr += "fstreamline__.globals.setPromise(" + arg + ");";
	}
	optStr += "})();";
	source = 'var fstreamline__ = require("' + (options.internal ? '..' : 'streamline/lib') + '/fibers-fast/runtime");' + optStr + ' (function(_) { ' + //
			source + //
		'\n})(_ >> function(err) {\n' + //
		'  if (err) throw err;\n' + //
		'});\n';
	var parsed = esprima.parse(source, {
		loc: true,
		range: true,
	});
	walk(parsed);
	buffer += source.substring(position);

	if (didRewrite > 0) {
		return buffer;
	} else {
		return originalSource;
	}
}
})(typeof exports !== 'undefined' ? exports : (window.Streamline = window.Streamline || {}));
