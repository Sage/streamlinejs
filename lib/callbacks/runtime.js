/**
 * Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */
(function(exports) {
	var __g = exports.globals || require("../globals");
	__g.context = __g.context || {};
	__g.depth = __g.depth || 0;

	__g.trampoline = (function() {
		var q = [];
		return {
			queue: function(fn) {
				q.push(fn);
			},
			flush: function() {
				__g.depth++;
				try {
					var fn;
					while (fn = q.shift()) fn();
				} finally {
					__g.depth--;
				}
			}
		}
	})();

	exports.runtime = function(filename) {
		function __func(_, __this, __arguments, fn, index, frame, body) {
			if (!_) {
				return __future.call(__this, fn, __arguments, index);
			}
			frame.file = filename;
			frame.prev = __g.frame;
			__g.frame = frame;
			__g.depth++;
			try {
				frame.active = true;
				body();
			} catch (e) {
				__setEF(e, frame.prev);
				__propagate(_, e);
			} finally {
				frame.active = false;
				__g.frame = frame.prev;
				if (--__g.depth === 0 && __g.trampoline) __g.trampoline.flush();
			}
		}

		return {
			__g: __g,
			__func: __func,
			__cb: __cb,
			__future: __future,
			__propagate: __propagate,
			__trap: __trap,
			__tryCatch: __tryCatch,
			__forIn: __forIn,
			__apply: __apply,
			__construct: __construct,
			__setEF: __setEF
		};
	}

	function __cb(_, frame, offset, col, fn, trampo) {
		frame.offset = offset;
		frame.col = col;
		var ctx = __g.context;
		return function ___(err, result) {
			var oldFrame = __g.frame;
			__g.frame = frame;
			__g.context = ctx;
			__g.depth++;
			try {
				if (trampo && frame.active && __g.trampoline) {
					__g.trampoline.queue(function() {
						return ___(err, result);
					});
				} else {
					if (err) {
						__setEF(err, frame);
						return _(err);
					}
					frame.active = true;
					return fn(null, result);
				}
			} catch (ex) {
				__setEF(ex, frame);
				return __propagate(_, ex);
			} finally {
				frame.active = false;
				__g.frame = oldFrame;
				if (--__g.depth === 0 && __g.trampoline) __g.trampoline.flush();
			}
		}
	}

	// unfortunately callee is gone. So we need to pass a function

	function __future(fn, args, i) {
		var err, result, done, q = [];
		args = Array.prototype.slice.call(args);
		args[i] = function(e, r) {
			err = e, result = r, done = true;
			q && q.forEach(function(f) {
				try {
					f(e, r);
				} catch (ex) {
					__trap(ex);
				}
			});
			q = null;
		};
		fn.apply(this, args);
		return function ___(_) {
			if (!_) return ___;
			if (done) _(err, result);
			else q.push(_)
		}
	}

	function __propagate(_, err) {
		try {
			_(err);
		} catch (ex) {
			__trap(ex);
		}
	}

	function __trap(err) {
		if (err) {
			if (__g.context && __g.context.errorHandler) __g.context.errorHandler(err);
			else __g.trampoline.queue(function() {
				throw err;
			});
		}
	}

	__tryCatch: function __tryCatch(_, fn) {
		try {
			fn();
		} catch (e) {
			try {
				_(e);
			} catch (ex) {
				__trap(ex);
			}
		}
	}

	function __forIn(object) {
		var array = [];
		for (var obj in object) {
			array.push(obj);
		}
		return array;
	}

	function __apply(cb, fn, thisObj, args, index) {
		if (cb == null) return __future(__apply, arguments, 0);
		args = Array.prototype.slice.call(args, 0);
		args[index != null ? index : args.length] = cb;
		return fn.apply(thisObj, args);
	}

	function __construct(constructor, i) {
		var key = '__async' + i,
			f;
		return constructor[key] || (constructor[key] = function() {
			var args = arguments;

			function F() {
				var self = this;
				var cb = args[i];
				args[i] = function(e, r) {
					cb(e, self);
				}
				return constructor.apply(self, args);
			}
			F.prototype = constructor.prototype;
			return new F();
		});
	}

	function __setEF(e, f) {
		function formatStack(e, raw) {
			var s = raw,
				f, skip, skipFunc = 0;
			if (s) {
				var ff;
				s = s.split('\n').map(function(l) {
					// try to map firefox format to V8 format
					// ffOffset takes care of lines difference introduced by require.js script.
					var ffOffset = (typeof navigator === 'object' && typeof require === 'function' && require.async) ? 10 : 0;
					var m = /(^[^(]+)\([^@]*\@(.*)\:(\d+)$/.exec(l);
					l = m ? "    at " + m[1] + " (" + m[2] + ":" + (parseInt(m[3]) - ffOffset) + ":0)" : l;
					ff = ff || (m != null);
					var i = l.indexOf('__$');
					if (i >= 0 && !skip) {
						skip = true;
						return l.substring(0, i) + l.substring(i + 3) + '\n';
					}
					return skip ? '' : l + '\n';
				}).join('');
				if (ff) // firefox does not include message
				s = "Error: " + e.message + '\n' + s;
				for (var f = e.__frame; f; f = f.prev) {
					if (f.offset >= 0) s += "    at " + f.name + " (" + f.file + ":" + (f.line + f.offset) + ":" + f.col + ")\n"
				}
			}
			return s;
		};
		e.__frame = e.__frame || f;
		if (exports.stackTraceEnabled && e.__lookupGetter__ && e.__lookupGetter__("rawStack") == null) {
			var getter = e.__lookupGetter__("stack");
			if (!getter) { // FF or Safari case
				var raw = e.stack || "raw stack unavailable";
				getter = function() {
					return raw;
				}
			}
			e.__defineGetter__("rawStack", getter);
			e.__defineGetter__("stack", function() {
				return formatStack(e, getter());
			});
		}
	}

	/// * `runtime.stackTraceEnabled = true/false;`
	///   If true, `err.stack` returns the reconstructed _sync_ stack trace.
	///   Otherwise, it returns the _raw_ stack trace.
	///   The default is true, but you must require the flows module
	///   at least once to enable sync stack traces.
	exports.stackTraceEnabled = true;
	})(typeof exports !== 'undefined' ? exports : (window.StreamlineRuntime = window.StreamlineRuntime || {
	globals: {}
}));
require && require("streamline/lib/callbacks/builtins");