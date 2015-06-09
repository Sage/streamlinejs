/* eslint no-alert: 0 */
"use strict";
if (!Object.create || !Object.defineProperty || !Object.defineProperties) alert("Example will fail because your browser does not support ECMAScript 5. Try with another browser!");
var __filename = "" + window.location;

window.Streamline = { globals: {} };

function require_(str) {
	if (/^\.\.\//.test(str)) str = "streamline/lib" + str.substring(2);
	if (str === "streamline/lib/util/flows") return Streamline.flows;
	else if (str === "streamline/lib/globals") return Streamline.globals;
	else if (str === "streamline/lib/version") return Streamline.version;
	else if (str === "streamline/lib/callbacks/runtime") return Streamline.runtime;
	else if (str === "streamline/lib/callbacks/transform") return Streamline;
	else if (str === "streamline/lib/callbacks/builtins") return Streamline.builtins;
	else if (str === "streamline/lib/util/future") return Streamline.future;
	else if (str === "streamline/lib/util/source-map") return Streamline.sourceMap.exports;
	else alert("cannot require " + str);
}
"use strict";

/// 
/// # Container for global context
/// 
/// The `globals` module is a container for the global `context` object which is maintained across
/// asynchronous calls.
/// 
/// This context is very handy to store information that all calls should be able to access
/// but that you don't want to pass explicitly via function parameters. The most obvious example is
/// the `locale` that each request may set differently and that your low level libraries should
/// be able to retrieve to format messages.
/// 
/// `var globals = require_('streamline/lib/globals')`
/// 
/// * `globals.context = ctx`
/// * `ctx = globals.context`  
///   sets and gets the context
/// 
/// Note: an empty context (`{}`) is automatically set by the server wrappers of the `streams` module,
/// before they dispatch a request. So, with these wrappers, each request starts with a fresh empty context.
// This module may be loaded several times so we need a true global (with a secret name!).
// This implementation also allows us to share the context between modules compiled in callback and fibers mode.
(function() {
	var glob = typeof global === "object" ? global : window;
	var secret = "_20c7abceb95c4eb88b7ca1895b1170d1";
	var g = glob[secret] || (glob[secret] = { context: {} });
	if (typeof exports !== 'undefined') {
		module.exports = g;
	} else {
		Streamline.globals = g;
	}
	// Internal call to manage runtimes
	g.runtime || Object.defineProperty(g, 'runtime', {
		get: function() { return g.__runtime__; },
		set: function(value) {
			if (g.__runtime__ !== value) {
				if (g.__runtime__) {
					if (/-fast$/.test(g.__runtime__) ||
						/-fast$/.test(value)) throw new Error("cannot mix streamline runtimes: " + g.__runtime__ + " and " + value);
					console.log("warning: mixing streamline runtimes: " + g.__runtime__ + " and " + value);
				}
				g.__runtime__ = value;
			}
		}
	});

	/// 
	/// * `fn = globals.withContext(fn, cx)`  
	///   wraps a function so that it executes with context `cx` (or a wrapper around current context if `cx` is falsy).
	///   The previous context will be restored when the function returns (or throws).  
	///   returns the wrapped function.
	g.withContext = function(fn, cx) {
		if (Object.prototype.toString.call(fn) === "[object GeneratorFunction]") throw new Error("async function not allowed in globals.withContext")
		return function() {
			var oldContext = g.context;
			g.context = cx || Object.create(oldContext);
			try {
				return fn.apply(this, arguments);
			} finally {
				g.context = oldContext;
			}
		};
	};

	g.setPromise = function(name) {
		if (g.Promise) return; // first caller wins
		var req = require_; // defeat streamline-require dependencies
		if (name === true) g.Promise = typeof Promise === "function" ? Promise : req('es6-promise');
		else g.Promise = require_(name);
	};
})();

"use strict";
/**
 * Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */
(function(exports) {
	var globals = require_("../globals");

	exports.future = function(fn, args, i) {
		var err, result, done, q = [], self = this;
		args = Array.prototype.slice.call(args);
		args[i] = function(e, r) {
			err = e;
			result = r;
			done = true;
			q && q.forEach(function(f) {
				f.call(self, e, r);
			});
			q = null;
		};
		args[i].__futurecb = true;
		fn.apply(this, args);
		var ret = function F(cb) {
			if (typeof cb !== 'function') {
				var globals = require_('../globals');
				if (cb == null && globals.Promise) return exports.promise.call(this, F, [], 0);
				if (cb !== false && !globals.oldStyleFutures) throw new Error("callback missing (argument #0). See https://github.com/Sage/streamlinejs/blob/master/FAQ.md#no-callback-given-error");
				return F;
			}
			if (done) cb.call(self, err, result);
			else q.push(cb);
		};
		ret.__future = true;
		return ret;
	};

	exports.streamlinify = function(fn, idx) {
		return function() {
			if (!arguments[idx]) return exports.future.call(this, fn, arguments, idx);
			else return fn.apply(this, arguments);
		};
	};

	exports.promise = function(fn, args, i) {
		if (args[i] === false) return exports.future.call(this, fn, args, i);
		if (args[i] != null) throw new Error("invalid callback: " + typeof args[i]);
		if (globals.oldStyleFutures) return exports.future.call(this, fn, args, i);
		if (!globals.Promise) throw new Error("callback missing (argument #" + i + "). See https://github.com/Sage/streamlinejs/blob/master/FAQ.md#no-callback-given-error");

		var self = this;
		args = Array.prototype.slice.call(args);
		return new globals.Promise(function(resolve, reject) {
			args[i] = function(e, r) {
				if (e) reject(e);
				else resolve(r);
			};
			fn.apply(self, args);
		});
	};

	exports.then = function(promise, method, cb) {
		promise[method](function(r) {
			cb && cb(null, r);
			cb = null;
		}, function(e) {
			cb && cb(e);
			cb = null;
		});
	};
})(typeof exports !== 'undefined' ? exports : (Streamline.future = Streamline.future || {}));

/**
 * Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */
(function(exports) {
	"use strict";
	var __g = require_("../globals");
	__g.runtime = 'callbacks';
	var __fut = require_("../util/future");
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
					while ((fn = q.shift())) fn();
				} finally {
					__g.context = oldContext;
					__g.depth--;
				}
			}
		};
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
			for (f = e.__frame; f; f = f.prev) {
				if (f.offset >= 0) s += "\n  at " + f.name + " (" + f.file + ":" + (f.line + f.offset) + ":" + (f.col + 1) + ")";
			}
			s += '\n  <<< raw stack >>>' + '\n' + lines.slice(cut).join('\n');
			return s;
		}
		if (typeof e !== "object") return;
		e.__frame = e.__frame || f;
		if (exports.stackTraceEnabled && e.__lookupGetter__ && e.__lookupGetter__("rawStack") == null) {
			var getter = e.__lookupGetter__("stack");
			if (!getter) { // FF or Safari case
				var raw = e.stack || "raw stack unavailable";
				getter = function() {
					return raw;
				};
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
if (require_) require_("../callbacks/builtins");
/*** Generated by streamline 0.12.1 (callbacks) - DO NOT EDIT ***/ var __rt=require_('../callbacks/runtime').runtime(__filename, false),__func=__rt.__func,__cb=__rt.__cb; 







(function (exports) { 
    'use strict'; 
    var VERSION = 3; 
    
    
    
    var future = function (fn, args, i) { 
        var err, result, done, q = [], self = this; 
        
        args = Array.prototype.slice.call(args); 
        args[i] = function (e, r) { 
            err = e; 
            result = r; 
            done = true; 
            q && q.forEach(function (f) { 
                f.call(self, e, r); }); 
            
            q = null; }; 
        
        fn.apply(this, args); 
        return function F(cb) { 
            if (!cb) return F; 
            if (done) cb.call(self, err, result); else q.push(cb); }; }; 
    
    
    
    
    
    exports.funnel = function (max) { 
        max = max == null ? -1 : max; 
        if (max === 0) max = funnel.defaultSize; 
        if (typeof max !== 'number') throw new Error('bad max number: ' + max); 
        var queue = [], active = 0, closed = false; 
        
        
        
        var funCb = function (callback, fn) { 
            if (callback == null) return future(funCb, arguments, 0); 
            
            if (max < 0 || max === Infinity) return fn(callback); 
            
            queue.push({ fn: fn, cb: callback }); 
            
            
            
            
            function _doOne() { 
                var current = queue.splice(0, 1)[0]; 
                if (!current.cb) return current.fn(); 
                active++; 
                current.fn(function (err, result) { 
                    active--; 
                    if (!closed) { 
                        current.cb(err, result); 
                        while (active < max && queue.length > 0) _doOne(); } }); } 
            
            
            
            
            while (active < max && queue.length > 0) _doOne(); }; 
        
        var fun = __rt.streamlinify(funCb, 0); 
        
        fun.close = function () { 
            queue = []; 
            closed = true; }; 
        
        return fun; }; 
    
    var funnel = exports.funnel; 
    funnel.defaultSize = 4; 
    
    function _parallel(options) { 
        if (typeof options === 'number') return options; 
        if (typeof options.parallel === 'number') return options.parallel; 
        return options.parallel ? -1 : 1; } 
    
    
    if (Array.prototype.forEach_ && Array.prototype.forEach_.version_ >= VERSION) return; 
    
    
    try { 
        Object.defineProperty({}, 'x', {}); } catch (e) { 
        
        return; } 
    
    
    var has = Object.prototype.hasOwnProperty; 
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    delete Array.prototype.forEach_; 
    Object.defineProperty(Array.prototype, 'forEach_', { configurable: true, writable: true, enumerable: false, value: function value__1(_, options, fn, thisObj) { 
            
            
            
            var par, len, i, __this = this; var __frame = { name: 'value__1', line: 129 }; return __func(_, this, arguments, value__1, 0, __frame, function __$value__1() { 
                if (typeof options === 'function') { 
                    thisObj = fn; 
                    fn = options; 
                    options = 1; } par = _parallel(options); 
                
                
                thisObj = thisObj !== undefined ? thisObj : __this; len = __this.length; 
                
                return function __$value__1(__then) { if (par === 1 || len <= 1) { 
                        i = 0; var __2 = false; return function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$value__1() { __more = false; if (__2) { i++; } else { __2 = true; } var __1 = i < len; if (__1) { 
                                    return function __$value__1(__then) { if (has.call(__this, i)) { return fn.call(thisObj, __cb(_, __frame, 11, 0, __then, true, false), __this[i], i, __this); } else { __then(); } }(function __$value__1() { while (__more) { __loop(); } __more = true; }); } else { __break(); } }); do { __loop(); } while (__more); __more = true; }(__then); } else { 
                        
                        
                        return __this.map_(__cb(_, __frame, 14, 0, __then, true, false), par, fn, thisObj); } }(function __$value__1() { 
                    
                    return _(null, __this); }); }); } }); 
    
    
    Array.prototype.forEach_.version_ = VERSION; 
    
    
    delete Array.prototype.map_; 
    Object.defineProperty(Array.prototype, 'map_', { configurable: true, writable: true, enumerable: false, value: function value__2(_, options, fn, thisObj) { 
            
            
            
            var par, len, result, i, fun, __this = this; var __frame = { name: 'value__2', line: 156 }; return __func(_, this, arguments, value__2, 0, __frame, function __$value__2() { 
                if (typeof options === 'function') { 
                    thisObj = fn; 
                    fn = options; 
                    options = 1; } par = _parallel(options); 
                
                
                thisObj = thisObj !== undefined ? thisObj : __this; len = __this.length; 
                
                
                return function __$value__2(__then) { if (par === 1 || len <= 1) { 
                        result = new Array(len); 
                        i = 0; var __4 = false; return function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$value__2() { __more = false; if (__4) { i++; } else { __4 = true; } var __3 = i < len; if (__3) { 
                                    return function __$value__2(__then) { if (has.call(__this, i)) { return fn.call(thisObj, __cb(_, __frame, 13, 0, function ___(__0, __1) { result[i] = __1; __then(); }, true, false), __this[i], i, __this); } else { __then(); } }(function __$value__2() { while (__more) { __loop(); } __more = true; }); } else { __break(); } }); do { __loop(); } while (__more); __more = true; }(__then); } else { 
                        
                        fun = funnel(par); 
                        
                        result = __this.map(function (elt, i, arr) { 
                            return fun(false, function __1(_) { var __frame = { name: '__1', line: 174 }; return __func(_, this, arguments, __1, 0, __frame, function __$__1() { 
                                    return fn.call(thisObj, __cb(_, __frame, 1, 0, _, true, false), elt, i, arr); }); }); }); 
                        
                        
                        i = 0; var __7 = false; return function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$value__2() { __more = false; if (__7) { i++; } else { __7 = true; } var __6 = i < len; if (__6) { 
                                    return function __$value__2(__then) { if (has.call(__this, i)) { return result[i](__cb(_, __frame, 23, 0, function ___(__0, __2) { result[i] = __2; __then(); }, true, false)); } else { __then(); } }(function __$value__2() { while (__more) { __loop(); } __more = true; }); } else { __break(); } }); do { __loop(); } while (__more); __more = true; }(__then); } }(function __$value__2() { 
                    
                    
                    return _(null, result); }); }); } }); 
    
    
    
    
    delete Array.prototype.filter_; 
    Object.defineProperty(Array.prototype, 'filter_', { configurable: true, writable: true, enumerable: false, value: function value__3(_, options, fn, thisObj) { 
            
            
            
            var par, result, len, i, elt, __this = this; var __frame = { name: 'value__3', line: 192 }; return __func(_, this, arguments, value__3, 0, __frame, function __$value__3() { 
                if (typeof options === 'function') { 
                    thisObj = fn; 
                    fn = options; 
                    options = 1; } par = _parallel(options); 
                
                
                thisObj = thisObj !== undefined ? thisObj : __this; result = []; 
                len = __this.length; 
                
                return function __$value__3(__then) { if (par === 1 || len <= 1) { 
                        i = 0; var __5 = false; return function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$value__3() { __more = false; if (__5) { i++; } else { __5 = true; } var __4 = i < len; if (__4) { 
                                    return function __$value__3(__then) { if (has.call(__this, i)) { elt = __this[i]; 
                                            
                                            return fn.call(thisObj, __cb(_, __frame, 14, 0, function ___(__0, __3) { var __2 = __3; return function __$value__3(__then) { if (__2) { result.push(elt); __then(); } else { __then(); } }(__then); }, true, false), elt, i, __this); } else { __then(); } }(function __$value__3() { while (__more) { __loop(); } __more = true; }); } else { __break(); } }); do { __loop(); } while (__more); __more = true; }(__then); } else { 
                        
                        
                        
                        return __this.map_(__cb(_, __frame, 18, 0, __then, true, false), par, function __1(_, elt, i, arr) { var __frame = { name: '__1', line: 210 }; return __func(_, this, arguments, __1, 0, __frame, function __$__1() { 
                                return fn.call(thisObj, __cb(_, __frame, 1, 0, function ___(__0, __2) { var __1 = __2; return function __$__1(__then) { if (__1) { result.push(elt); __then(); } else { __then(); } }(_); }, true, false), elt, i, arr); }); }, thisObj); } }(function __$value__3() { 
                    
                    
                    return _(null, result); }); }); } }); 
    
    
    
    
    delete Array.prototype.every_; 
    Object.defineProperty(Array.prototype, 'every_', { configurable: true, writable: true, enumerable: false, value: function value__4(_, options, fn, thisObj) { 
            
            
            
            var par, len, i, fun, futures, __this = this; var __frame = { name: 'value__4', line: 224 }; return __func(_, this, arguments, value__4, 0, __frame, function __$value__4() { 
                if (typeof options === 'function') { 
                    thisObj = fn; 
                    fn = options; 
                    options = 1; } par = _parallel(options); 
                
                
                thisObj = thisObj !== undefined ? thisObj : __this; len = __this.length; 
                
                return function __$value__4(__then) { if (par === 1 || len <= 1) { 
                        i = 0; var __8 = false; return function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$value__4() { __more = false; if (__8) { i++; } else { __8 = true; } var __7 = i < len; if (__7) { 
                                    
                                    return function __$value__4(_) { var __1 = has.call(__this, i); if (!__1) { return _(null, __1); } return fn.call(thisObj, __cb(_, __frame, 12, 0, function ___(__0, __3) { var __2 = !__3; return _(null, __2); }, true, false), __this[i], i, __this); }(__cb(_, __frame, 12, 0, function ___(__0, __4) { var __3 = __4; return function __$value__4(__then) { if (__3) { return _(null, false); } else { __then(); } }(function __$value__4() { while (__more) { __loop(); } __more = true; }); }, true, false)); } else { __break(); } }); do { __loop(); } while (__more); __more = true; }(__then); } else { 
                        
                        fun = funnel(par); 
                        futures = __this.map(function (elt, i, arr) { 
                            
                            return fun(false, function __1(_) { var __frame = { name: '__1', line: 241 }; return __func(_, this, arguments, __1, 0, __frame, function __$__1() { 
                                    return fn.call(thisObj, __cb(_, __frame, 1, 0, _, true, false), elt, i, arr); }); }); }); 
                        
                        
                        i = 0; var __11 = false; return function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$value__4() { __more = false; if (__11) { i++; } else { __11 = true; } var __10 = i < len; if (__10) { 
                                    return function __$value__4(_) { var __2 = has.call(__this, i); if (!__2) { return _(null, __2); } return futures[i](__cb(_, __frame, 22, 0, function ___(__0, __4) { var __3 = !__4; return _(null, __3); }, true, false)); }(__cb(_, __frame, 22, 0, function ___(__0, __6) { var __5 = __6; return function __$value__4(__then) { if (__5) { 
                                                fun.close(); 
                                                return _(null, false); } else { __then(); } }(function __$value__4() { while (__more) { __loop(); } __more = true; }); }, true, false)); } else { __break(); } }); do { __loop(); } while (__more); __more = true; }(__then); } }(function __$value__4() { 
                    
                    
                    
                    return _(null, true); }); }); } }); 
    
    
    
    
    delete Array.prototype.some_; 
    Object.defineProperty(Array.prototype, 'some_', { configurable: true, writable: true, enumerable: false, value: function value__5(_, options, fn, thisObj) { 
            
            
            
            var par, len, i, fun, futures, __this = this; var __frame = { name: 'value__5', line: 262 }; return __func(_, this, arguments, value__5, 0, __frame, function __$value__5() { 
                if (typeof options === 'function') { 
                    thisObj = fn; 
                    fn = options; 
                    options = 1; } par = _parallel(options); 
                
                
                thisObj = thisObj !== undefined ? thisObj : __this; len = __this.length; 
                
                return function __$value__5(__then) { if (par === 1 || len <= 1) { 
                        i = 0; var __8 = false; return function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$value__5() { __more = false; if (__8) { i++; } else { __8 = true; } var __7 = i < len; if (__7) { 
                                    return function __$value__5(_) { var __1 = has.call(__this, i); if (!__1) { return _(null, __1); } return fn.call(thisObj, __cb(_, __frame, 11, 0, _, true, false), __this[i], i, __this); }(__cb(_, __frame, 11, 0, function ___(__0, __4) { var __3 = __4; return function __$value__5(__then) { if (__3) { return _(null, true); } else { __then(); } }(function __$value__5() { while (__more) { __loop(); } __more = true; }); }, true, false)); } else { __break(); } }); do { __loop(); } while (__more); __more = true; }(__then); } else { 
                        
                        fun = funnel(par); 
                        futures = __this.map(function (elt, i, arr) { 
                            
                            return fun(false, function __1(_) { var __frame = { name: '__1', line: 278 }; return __func(_, this, arguments, __1, 0, __frame, function __$__1() { 
                                    return fn.call(thisObj, __cb(_, __frame, 1, 0, _, true, false), elt, i, arr); }); }); }); 
                        
                        
                        i = 0; var __11 = false; return function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$value__5() { __more = false; if (__11) { i++; } else { __11 = true; } var __10 = i < len; if (__10) { 
                                    return function __$value__5(_) { var __2 = has.call(__this, i); if (!__2) { return _(null, __2); } return futures[i](__cb(_, __frame, 21, 0, _, true, false)); }(__cb(_, __frame, 21, 0, function ___(__0, __6) { var __5 = __6; return function __$value__5(__then) { if (__5) { 
                                                fun.close(); 
                                                return _(null, true); } else { __then(); } }(function __$value__5() { while (__more) { __loop(); } __more = true; }); }, true, false)); } else { __break(); } }); do { __loop(); } while (__more); __more = true; }(__then); } }(function __$value__5() { 
                    
                    
                    
                    return _(null, false); }); }); } }); 
    
    
    
    
    delete Array.prototype.reduce_; 
    Object.defineProperty(Array.prototype, 'reduce_', { configurable: true, writable: true, enumerable: false, value: function value__6(_, fn, v, thisObj) { 
            
            
            
            var len, i, __this = this; var __frame = { name: 'value__6', line: 299 }; return __func(_, this, arguments, value__6, 0, __frame, function __$value__6() { 
                thisObj = thisObj !== undefined ? thisObj : __this; len = __this.length; 
                
                i = 0; var __3 = false; return function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$value__6() { __more = false; if (__3) { i++; } else { __3 = true; } var __2 = i < len; if (__2) { 
                            return function __$value__6(__then) { if (has.call(__this, i)) { return fn.call(thisObj, __cb(_, __frame, 4, 0, function ___(__0, __1) { v = __1; __then(); }, true, false), v, __this[i], i, __this); } else { __then(); } }(function __$value__6() { while (__more) { __loop(); } __more = true; }); } else { __break(); } }); do { __loop(); } while (__more); __more = true; }(function __$value__6() { 
                    
                    return _(null, v); }); }); } }); 
    
    
    
    
    delete Array.prototype.reduceRight_; 
    Object.defineProperty(Array.prototype, 'reduceRight_', { configurable: true, writable: true, enumerable: false, value: function value__7(_, fn, v, thisObj) { 
            
            
            
            var len, i, __this = this; var __frame = { name: 'value__7', line: 315 }; return __func(_, this, arguments, value__7, 0, __frame, function __$value__7() { 
                thisObj = thisObj !== undefined ? thisObj : __this; len = __this.length; 
                
                i = len - 1; var __3 = false; return function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$value__7() { __more = false; if (__3) { i--; } else { __3 = true; } var __2 = i >= 0; if (__2) { 
                            return function __$value__7(__then) { if (has.call(__this, i)) { return fn.call(thisObj, __cb(_, __frame, 4, 0, function ___(__0, __1) { v = __1; __then(); }, true, false), v, __this[i], i, __this); } else { __then(); } }(function __$value__7() { while (__more) { __loop(); } __more = true; }); } else { __break(); } }); do { __loop(); } while (__more); __more = true; }(function __$value__7() { 
                    
                    return _(null, v); }); }); } }); 
    
    
    
    
    
    
    delete Array.prototype.sort_; 
    Object.defineProperty(Array.prototype, 'sort_', { configurable: true, writable: true, enumerable: false, value: function value__8(_, compare, beg, end) { 
            
            
            
            var array, __this = this; 
            
            
            
            
            function _qsort(_, beg, end) { var tmp, mid, o, nbeg, nend; var __frame = { name: '_qsort', line: 338 }; return __func(_, this, arguments, _qsort, 0, __frame, function __$_qsort() { 
                    if (beg >= end) { return _(null); } 
                    
                    
                    return function __$_qsort(__then) { if (end === beg + 1) { 
                            return compare(__cb(_, __frame, 5, 0, function ___(__0, __4) { var __3 = __4 > 0; return function __$_qsort(__then) { if (__3) { 
                                        tmp = array[beg]; 
                                        array[beg] = array[end]; 
                                        array[end] = tmp; __then(); } else { __then(); } }(function __$_qsort() { 
                                    
                                    return _(null); }); }, true, false), array[beg], array[end]); } else { __then(); } }(function __$_qsort() { mid = Math.floor((beg + end) / 2); 
                        
                        
                        o = array[mid]; 
                        nbeg = beg; 
                        nend = end; 
                        
                        
                        return function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$_qsort() { __more = false; var __6 = nbeg <= nend; if (__6) { 
                                    return function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$_qsort() { __more = false; return function __$_qsort(_) { return function __$_qsort(_) { var __1 = nbeg < end; if (!__1) { return _(null, __1); } return compare(__cb(_, __frame, 19, 0, function ___(__0, __3) { var __2 = __3 < 0; return _(null, __2); }, true, false), array[nbeg], o); }(__cb(_, __frame, 19, 0, _, true, false)); }(__cb(_, __frame, 19, 0, function ___(__0, __7) { if (__7) { nbeg++; while (__more) { __loop(); } __more = true; } else { __break(); } }, true, false)); }); do { __loop(); } while (__more); __more = true; }(function __$_qsort() { 
                                        return function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$_qsort() { __more = false; return function __$_qsort(_) { return function __$_qsort(_) { var __2 = beg < nend; if (!__2) { return _(null, __2); } return compare(__cb(_, __frame, 20, 0, function ___(__0, __4) { var __3 = __4 < 0; return _(null, __3); }, true, false), o, array[nend]); }(__cb(_, __frame, 20, 0, _, true, false)); }(__cb(_, __frame, 20, 0, function ___(__0, __9) { if (__9) { nend--; while (__more) { __loop(); } __more = true; } else { __break(); } }, true, false)); }); do { __loop(); } while (__more); __more = true; }(function __$_qsort() { 
                                            
                                            if (nbeg <= nend) { 
                                                tmp = array[nbeg]; 
                                                array[nbeg] = array[nend]; 
                                                array[nend] = tmp; 
                                                nbeg++; 
                                                nend--; } while (__more) { __loop(); } __more = true; }); }); } else { __break(); } }); do { __loop(); } while (__more); __more = true; }(function __$_qsort() { 
                            
                            
                            
                            return function __$_qsort(__then) { if (nbeg < end) { return _qsort(__cb(_, __frame, 31, 0, __then, true, false), nbeg, end); } else { __then(); } }(function __$_qsort() { 
                                return function __$_qsort(__then) { if (beg < nend) { return _qsort(__cb(_, __frame, 32, 0, __then, true, false), beg, nend); } else { __then(); } }(_); }); }); }); }); } var __frame = { name: 'value__8', line: 333 }; return __func(_, this, arguments, value__8, 0, __frame, function __$value__8() { array = __this; beg = beg || 0; end = end == null ? array.length - 1 : end; 
                
                return _qsort(__cb(_, __frame, 39, 0, function __$value__8() { 
                    return _(null, array); }, true, false), beg, end); }); } }); 
    
    
    
    
    
    
    
    
    
    
    
    delete Function.prototype.apply_; 
    Object.defineProperty(Function.prototype, 'apply_', { configurable: true, writable: true, enumerable: false, value: function (callback, thisObj, args, index) { 
            
            
            
            
            args = Array.prototype.slice.call(args, 0); 
            args.splice(index != null && index >= 0 ? index : args.length, 0, callback); 
            return this.apply(thisObj, args); } }); }(typeof exports !== 'undefined' ? exports : Streamline.builtins = Streamline.builtins || {}));