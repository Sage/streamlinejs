/**
 * Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */
(function(exports) {
	var __g = require("../globals");
	__g.runtime = 'callbacks';
	var __fut = require("../util/future");
	__g.context = __g.context || {};
	__g.depth = __g.depth || 0;
	__g.async = __g.async || false;

	__g.trampoline = (function() {
		var q = [];
		return {
			queue: function(fn) {
				q.push(fn);
			},
			flush: function() {
				var oldContext = __g.context;
				__g.depth++;
				try {
					var fn;
					while (fn = q.shift()) fn();
				} finally {
					__g.context = oldContext;
					__g.depth--;
				}
			}
		}
	})();

	exports.runtime = function(filename, oldStyleFutures) {
		__g.oldStyleFutures = oldStyleFutures;
		function __func(_, __this, __arguments, fn, index, frame, body) {
			if (typeof _ !== 'function') return __fut.promise.call(__this, fn, __arguments, index);
			frame.file = filename;
			frame.prev = __g.frame;
			frame.calls = 0;
			if (frame.prev) frame.prev.calls++;
			var emitter = __g.emitter;
			__g.frame = frame;
			__g.depth++;
			if (emitter) emitter.emit("enter", frame, _); // <- This allows the event handler to detect if the callback starts a new asynchronous path.
			try {
				frame.active = true;
				body();
			} catch (e) {
				__setEF(e, frame.prev);
				__propagate(_, e);
			} finally {
				frame.active = false;
				// We emit this before resetting the frame so that the 'exit' handler has access to the current frame.
				if (emitter) {
					emitter.emit("exit", frame);
				}
				__g.frame = frame.prev;
				if (--__g.depth === 0 && __g.trampoline) __g.trampoline.flush();
			}
		}

		return {
			__g: __g,
			__func: __func,
			__cb: __cb,
			__future: __fut.future,
			__propagate: __propagate,
			__trap: __trap,
			__tryCatch: __tryCatch,
			__catch: __catch,
			__forIn: __forIn,
			__apply: __apply,
			__construct: __construct,
			__setEF: __setEF,
			streamlinify: __fut.streamlinify,
			__pthen: __fut.then,
		};
	};

	function __cb(_, frame, offset, col, fn, trampo, returnArray) {
		frame.offset = offset;
		frame.col = col;
		var ctx = __g.context;
		var calls = frame.calls;
		var emitter = __g.emitter;
		var ret = function ___(err, result) {
			if (returnArray) result = Array.prototype.slice.call(arguments, 1);
			returnArray = false; // so that we don't do it twice if we trampoline
			var oldFrame = __g.frame;
			__g.frame = frame;
			var oldContext = __g.context;
			__g.context = ctx;
			if (emitter && __g.depth === 0) emitter.emit('resume', frame);
			if (emitter) emitter.emit('enter', frame);
			__g.depth++;
			try {
				if (trampo && frame.active && __g.trampoline) {
					__g.trampoline.queue(function() {
						return ___(err, result);
					});
				} else {
					// detect extra callback.
					// The offset/col test is necessary because __cb is also used by loops and called multiple times then.
					/*if (___.dispatched && (offset || col)) throw new Error("callback called twice");*/
					___.dispatched = true;
					if (err) {
						__setEF(err, frame);
						return _(err);
					}
					frame.active = true;
					return fn(null, result);
				}
			} catch (ex) {
				if (___.dispatched && _.name !== '___' && _.name !== '__trap' && calls !== frame.calls) throw ex;
				__setEF(ex, frame);
				return __propagate(_, ex);
			} finally {
				frame.active = false;
				// We emit this before resetting the frame so that the 'exit' handler has access to the current frame.
				if (emitter) emitter.emit("exit", frame);
				__g.frame = oldFrame;
				__g.context = oldContext;
				if (--__g.depth === 0 && __g.trampoline) __g.trampoline.flush();
			}
		};
		if (emitter && !ret.dispatched) emitter.emit('yield', frame);
		ret.__streamlined = true;
		return ret;
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

	function __tryCatch(_, fn) {
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

	function __catch(fn, _) {
		var frame = __g.frame,
			context = __g.context;
		__g.trampoline.queue(function() {
			var oldFrame = __g.frame,
				oldContext = __g.context;
			__g.frame = frame;
			__g.context = context;
			try {
				fn();
			} catch (ex) {
				_(ex);
			} finally {
				__g.frame = oldFrame;
				__g.context = oldContext;
			}
		});
	}

	function __forIn(object) {
		var array = [];
		for (var obj in object) {
			array.push(obj);
		}
		return array;
	}

	function __apply(cb, fn, thisObj, args, index) {
		if (cb == null) return __fut.future(__apply, arguments, 0);
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
				};
				args[i].__streamlined = cb.__streamlined;
				args[i].__futurecb = cb.__futurecb;
				return constructor.apply(self, args);
			}
			F.prototype = constructor.prototype;
			return new F();
		});
	}

	function __setEF(e, f) {
		function formatStack(e, raw) {
			var ff = typeof navigator === 'object' && navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
			// firefox does not include message
			if (ff) raw = "Error: " + e.message + '\n' + raw;
			var s = raw,
				f, skip;
			var cut = (e.message || '').split('\n').length;
			var lines = s.split('\n');
			s = lines.slice(cut).map(function(l) {
				// try to map firefox format to V8 format
				var m = /([^@]*)\@(.*?)\:(\d+)(?:\:(\d+))?$/.exec(l);
				l = m ? "  at " + m[1] + " (" + m[2] + ":" + parseInt(m[3]) + ":" + (m[4] || "0") + ")" : l;
				var i = l.indexOf('__$');
				if (i >= 0 && !skip) {
					skip = true;
					return l.substring(0, i) + l.substring(i + 3);
				}
				return skip ? '' : l;
			}).filter(function(l) {
				return l;
			}).join('\n');
			// if __$ marker is missing (if skip is false) the stack is 100% raw so we don't include its frames in the async stack
			s = lines.slice(0, cut).join('\n') + '\n  <<< async stack >>>' + (skip ? '\n' + s : '');
			for (var f = e.__frame; f; f = f.prev) {
				if (f.offset >= 0) s += "\n  at " + f.name + " (" + f.file + ":" + (f.line + f.offset) + ":" + (f.col+1) + ")"
			}
			s += '\n  <<< raw stack >>>' + '\n' + lines.slice(cut).join('\n');
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
				return formatStack(e, getter.call(this));
			});
		}
	}

	/// * `runtime.stackTraceEnabled = true/false;`
	///   If true, `err.stack` returns the reconstructed _sync_ stack trace.
	///   Otherwise, it returns the _raw_ stack trace.
	///   The default is true, but you must require the flows module
	///   at least once to enable sync stack traces.
	exports.stackTraceEnabled = true;
})(typeof exports !== 'undefined' ? exports : (Streamline.runtime = Streamline.runtime || {}));
require && require("../callbacks/builtins");
