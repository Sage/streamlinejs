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
	var Narcissus = require('../../deps/narcissus');
}
(function(exports) {
	exports.transform = transform;
	exports.version = require("../version").version + " (fibers-fast)";
	// hack to fix #123
	exports.transform.version = exports.version;

var t = Narcissus.definitions.tokenIds;
var Walker = require('../fibers/walker');

function aggressiveReplace(source) {
	// arr.forEach_(_, function(_, item) {...}) --> arr.forEach(function(item, __, _) {...})
	// The __ parameter captures index param (2 chars so that replace preserves length)
	// we append _ to callback args list because transform needs async marker on callback.
	function testArg(arg) {
		return new RegExp('\\b' + arg + '\\b').test(source) ? null : arg;
	}
	function unusedIdent() {
		var arg;
		if (arg = testArg('__')) return arg;
		for (var i = 0; i < 26 && !arg; i++) {
			if (arg = testArg(String.fromCharCode(0x41) + '_')) return arg;
			if (arg = testArg('_' + String.fromCharCode(0x41))) return arg;
			if (arg = testArg(String.fromCharCode(0x61) + '_')) return arg;
			if (arg = testArg('_' + String.fromCharCode(0x61))) return arg;
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
		return arg.type === t.BITWISE_NOT && arg.children[0].type === t.IDENTIFIER && arg.children[0].value === callback;
	}
	function isArrayArg(arg) {
		return arg.type === t.ARRAY_INIT  && arg.children.length === 1 && arg.children[0].type === t.IDENTIFIER && arg.children[0].value === callback;
	}
	function isLShiftArg(arg) {
		return arg.type === t.LSH && arg.children[0].type === t.IDENTIFIER && arg.children[0].value === callback;
	}
	function isRShiftArg(arg) {
		return arg.type === t.RSH && arg.children[0].type === t.IDENTIFIER && arg.children[0].value === callback;
	}
	function isFutureArg(arg) {
		return (arg.type === t.NOT || arg.type === t.VOID) && arg.children[0].type === t.IDENTIFIER && arg.children[0].value === callback;
	}
	function isAsyncParam(param) {
		return param === callback || (param.type === t.IDENTIFIER && param.value === callback);
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

	var walk = Walker({
		'function': function(name, args, body) {
			// Open this function
			if (name === callback) {
				throw new Error('Invalid usage of callback on line '+ this.lineno);
			}
			var idx = getCallback(args, isAsyncParam, this.lineno);
			catchup(this.body.start + 1);
			var oldAsync = async;
			async = idx !== -1 || this.forceAsync;
			walk(this.body);
			async = oldAsync;
		},
		'call': function(expr, args) {
			if (expr.type === t.IDENTIFIER && expr.value === '_' && args.length === 2) {
				catchup(expr.start);
				buffer += 'fstreamline__.star';
				skipTo(expr.end);
				args.map(walk);
				++didRewrite;
				return;
			}
			if (expr.type === t.DOT && args.length === 2 && args[0].type === t.IDENTIFIER && args[0].value === callback //
				 && args[1].type === t.IDENTIFIER && args[1].value === callback) {
				if (!async) throw error(this.lineno, "Function contains async calls but does not have _ parameter");
				catchup(this.start);
				skipTo(expr.children[0].start);
				buffer += ('fstreamline__.then.call(this,');
				walk(expr.children[0]);
				catchup(expr.children[0].end);
				buffer += (', "' + expr.children[1].value + '", _');
				skipTo(args[1].end);
				++didRewrite;
				return;
			}
			var idxFast = getCallback(args, isAsyncParam);
			var idx = getCallback(args, isAsyncArg);
			var idxArray = getCallback(args, isArrayArg);
			if (idx === -1) idx = idxArray;
			if ((idxFast !== -1 || idx !== -1) && !async) throw new Error("Function contains async calls but does not have _ parameter on line " + this.lineno);
			function walkExpr() {
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
					skipTo(expr.children[1].start);
					walk(expr.children[1]);
					catchup(expr.children[1].end);
				} else {
					// Function call
					buffer += 'null, ';
					walk(expr);
					catchup(expr.end);
				}				
			}
			if (idx !== -1) {
				// Rewrite streamlined calls
				// issue #108: process between expr.start and last arg end rather than this.start/end
				catchup(expr.start);
				buffer += 'fstreamline__.invoke(';
				walkExpr();
				// Render arguments
				buffer += ', [';
				skipTo(args[0].start);
				for (var ii = 0; ii < args.length; ++ii) {
					catchup(args[ii].start);
					if (ii !== idx) {
						walk(args[ii]);
						catchup(args[ii].end);
					} else {
						buffer += '_';							
						skipTo(args[ii].end);
					}
				}
				catchup(args[args.length - 1].end);
				var options = idx;
				if (idxArray !== -1) options = '{ callbackIndex: ' + idx + ', returnArray: true }';
				buffer += '], '+ options;
				++didRewrite;
			} else if ((idx = getCallback(args, isRShiftArg)) !== -1) {
				catchup(expr.start);
				if (expr.type === t.DOT) {
					buffer += 'fstreamline__.createBound(';
					walk(expr.children[0]);
					catchup(expr.children[0].end);
					buffer += ",'" + expr.children[1].value + "'";
					skipTo(expr.end);
				} else {
					buffer += 'fstreamline__.create(';
					walk(expr);
				}
				catchup(expr.end);
				buffer += ',' + idx + ')';
				for (var ii = 0; ii < args.length; ++ii) {
					catchup(args[ii].start);
					if (ii !== idx) {
						walk(args[ii]);
						catchup(args[ii].end);
					} else {
						var arg = args[ii].children[1];
						skipTo(arg.start);
						walk(arg);
						catchup(arg.end);
						skipTo(args[ii].end);
					}
				}
				++didRewrite;
			} else if ((idx = getCallback(args, isLShiftArg)) !== -1) {
				catchup(expr.start);
				walk(expr);
				catchup(expr.end);
				for (var ii = 0; ii < args.length; ++ii) {
					catchup(args[ii].start);
					if (ii !== idx) {
						walk(args[ii]);
						catchup(args[ii].end);
					} else {
						var arg = args[ii].children[1];
						if (arg.type !== t.FUNCTION) throw new Error("Expected function after _ << ");
						var idx2 = getCallback(arg.params, isAsyncParam);
						if (idx2 === -1) throw new Error("Expected async function after _ << ");
				buffer += 'fstreamline__.create(';
						skipTo(arg.start);
						walk(arg);
						catchup(arg.end);
				buffer += ',' + idx2 + ', true)'
						skipTo(args[ii].end);
					}
				}
				++didRewrite;
			} else if ((idx = getCallback(args, isFutureArg)) !== -1) {
				var isPromise = args[idx].type === t.VOID;
				catchup(this.start);
				buffer += 'fstreamline__.' + (isPromise ? 'promise' : 'spin') + '(';
				walkExpr();
				buffer += ', [';
				skipTo(args[0].start);
				for (var ii = 0; ii < args.length; ++ii) {
					catchup(args[ii].start);
					if (ii !== idx) {
						walk(args[ii]);
						catchup(args[ii].end);
					} else {
						catchup(args[ii].start);
						buffer += isPromise ? 'null' : 'false';
						skipTo(args[ii].end);
					}
				}
				catchup(args[args.length - 1].end);
				buffer += '], '+ idx + ')';
				skipTo(this.end);
				++didRewrite;
			} else {
				var paren = 0;
				if (source[this.start] === '(' && source[this.start + 1] === '(' && 
					source[this.end - 1] === ')' && source[this.end - 2] === ')') {
					paren = 1;
				}
				if (startsWith(source, this.start + paren, '(function() {')) {
					// handle coffeescript wrappers: set the forceAsync flag
					// so that we don't get an error about _ being used inside non async function
					if (endsWith(source, this.end - paren, '})()')) {
						expr.forceAsync = async;
					}	
					if (endsWith(source, this.end - paren, '}).call(this)') //
						|| endsWith(source, this.end - paren, '}).call(_this)') //
						|| endsWith(source, this.end - paren, '}).apply(this, arguments)')) {
						expr.children[0].forceAsync = async;
					}
				}
				walk(expr);
				args.map(walk);					
			}
		},
		'property_init': function() {
			// Dont't walk the property key, because that's an identifier and it will be clobbered, per
			// the below code
			walk(this.children[1]);
		},
		'dot': function() {
			// See comment above for propery_init
			walk(this.children[0]);
		},
		'not': function(value) {
			if (value.type === t.IDENTIFIER && value.value === callback) {
				catchup(this.start);
				buffer += 'null';
				skipTo(this.end);
			} else {
				walk(value);
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
	var parsed = Narcissus.parser.parse(source, options.sourceName);
	walk(parsed);
	buffer += source.substring(position);

	if (didRewrite > 0) {
		return buffer;
	} else {
		return originalSource;
	}
}
})(typeof exports !== 'undefined' ? exports : (window.Streamline = window.Streamline || {}));
