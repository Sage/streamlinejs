/*** Generated by streamline 0.10.13 (callbacks) --standalone - DO NOT EDIT ***/ var __rt=(function(){var __modules={},mod;function require(p){var m=__modules[p.substring(3)]; return m && m.exports};__modules['globals']=(mod={exports:{}});(function(module, exports){var glob = typeof global === "object" ? global : window;var secret = "_20c7abceb95c4eb88b7ca1895b1170d1";module.exports = (glob[secret] || (glob[secret] = { context: {} }));var g = glob[secret];g.runtime || Object.defineProperty(g, 'runtime', {get: function() { return g.__runtime__; },set: function(value) {if (g.__runtime__ !== value) {if (g.__runtime__) {if (/-fast$/.test(g.__runtime__) ||/-fast$/.test(value)) throw new Error("cannot mix streamline runtimes: " + g.__runtime__ + " and " + value);console.log("warning: mixing streamline runtimes: " + g.__runtime__ + " and " + value);}g.__runtime__ = value;}}});g.setPromise = function(name) {if (g.Promise) return; var req = require; if (name === true) g.Promise = typeof Promise === "function" ? Promise : req('es6-promise');else g.Promise = require(name);}})(mod, mod.exports);__modules['util/future']=(mod={exports:{}});(function(module, exports){(function(exports) {var globals = require("../globals");exports.future = function(fn, args, i) {var err, result, done, q = [], self = this;args = Array.prototype.slice.call(args);args[i] = function(e, r) {err = e, result = r, done = true;q && q.forEach(function(f) {f.call(self, e, r);});q = null;};args[i].__futurecb = true;fn.apply(this, args);var ret = function F(cb) {if (typeof cb !== 'function') {var globals = require('../globals');if (cb == null && globals.Promise) return exports.promise.call(this, F, [], 0);if (cb !== false && !globals.oldStyleFutures) throw new Error("callback missing (argument #0). See https://github.com/Sage/streamlinejs/blob/master/FAQ.md#no-callback-given-error");return F;}if (done) cb.call(self, err, result);else q.push(cb);};ret.__future = true;return ret;};exports.streamlinify = function(fn, idx) {return function() {if (!arguments[idx]) return exports.future.call(this, fn, arguments, idx);else return fn.apply(this, arguments);};};exports.promise = function(fn, args, i) {if (args[i] === false) return exports.future.call(this, fn, args, i);if (args[i] != null) throw new Error("invalid callback: " + typeof(args[i]));if (globals.oldStyleFutures) return exports.future.call(this, fn, args, i);if (!globals.Promise) throw new Error("callback missing (argument #" + i + "). See https://github.com/Sage/streamlinejs/blob/master/FAQ.md#no-callback-given-error");var self = this;args = Array.prototype.slice.call(args);return new globals.Promise(function(resolve, reject) {args[i] = function(e, r) {if (e) reject(e);else resolve(r);};fn.apply(self, args);});};exports.then = function(promise, method, cb) {promise[method](function(r) {cb && cb(null, r);cb = null;}, function(e) {cb && cb(e);cb = null;});};})(typeof exports !== 'undefined' ? exports : (Streamline.future = Streamline.future || {}));})(mod, mod.exports);__modules['callbacks/runtime']=(mod={exports:{}});(function(module, exports){(function(exports) {var __g = require("../globals");__g.runtime = 'callbacks';var __fut = require("../util/future");__g.context = __g.context || {};__g.depth = __g.depth || 0;__g.async = __g.async || false;__g.trampoline = (function() {var q = [];return {queue: function(fn) {q.push(fn);},flush: function() {__g.depth++;try {var fn;while (fn = q.shift()) fn();} finally {__g.depth--;}}}})();exports.runtime = function(filename, oldStyleFutures) {__g.oldStyleFutures = oldStyleFutures;function __func(_, __this, __arguments, fn, index, frame, body) {if (typeof _ !== 'function') return __fut.promise.call(__this, fn, __arguments, index);frame.file = filename;frame.prev = __g.frame;frame.calls = 0;if (frame.prev) frame.prev.calls++;var emitter = __g.emitter;__g.frame = frame;__g.depth++;if (emitter) emitter.emit("enter", _); try {frame.active = true;body();} catch (e) {__setEF(e, frame.prev);__propagate(_, e);} finally {frame.active = false;if (emitter) {emitter.emit("exit");}__g.frame = frame.prev;if (--__g.depth === 0 && __g.trampoline) __g.trampoline.flush();}}return {__g: __g,__func: __func,__cb: __cb,__future: __fut.future,__propagate: __propagate,__trap: __trap,__tryCatch: __tryCatch,__catch: __catch,__forIn: __forIn,__apply: __apply,__construct: __construct,__setEF: __setEF,streamlinify: __fut.streamlinify,__pthen: __fut.then,};};function __cb(_, frame, offset, col, fn, trampo, returnArray) {frame.offset = offset;frame.col = col;var ctx = __g.context;var calls = frame.calls;var emitter = __g.emitter;var ret = function ___(err, result) {if (returnArray) result = Array.prototype.slice.call(arguments, 1);returnArray = false; var oldFrame = __g.frame;__g.frame = frame;__g.context = ctx;if (emitter && __g.depth === 0) emitter.emit('resume');if (emitter) emitter.emit('enter');__g.depth++;try {if (trampo && frame.active && __g.trampoline) {__g.trampoline.queue(function() {return ___(err, result);});} else {___.dispatched = true;if (err) {__setEF(err, frame);return _(err);}frame.active = true;return fn(null, result);}} catch (ex) {if (___.dispatched && _.name !== '___' && _.name !== '__trap' && calls !== frame.calls) throw ex;__setEF(ex, frame);return __propagate(_, ex);} finally {frame.active = false;if (emitter) emitter.emit("exit");__g.frame = oldFrame;if (--__g.depth === 0 && __g.trampoline) __g.trampoline.flush();}};if (emitter && !ret.dispatched) emitter.emit('yield');ret.__streamlined = true;return ret;}function __propagate(_, err) {try {_(err);} catch (ex) {__trap(ex);}}function __trap(err) {if (err) {if (__g.context && __g.context.errorHandler) __g.context.errorHandler(err);else process.nextTick(function() {throw err;});}}function __tryCatch(_, fn) {try {fn();} catch (e) {try {_(e);} catch (ex) {__trap(ex);}}}function __catch(fn) {var frame = __g.frame,context = __g.context;__g.trampoline.queue(function() {var oldFrame = __g.frame,oldContext = __g.context;__g.frame = frame;__g.context = context;try {fn();} finally {__g.frame = oldFrame;__g.context = oldContext;}});}function __forIn(object) {var array = [];for (var obj in object) {array.push(obj);}return array;}function __apply(cb, fn, thisObj, args, index) {if (cb == null) return __fut.future(__apply, arguments, 0);args = Array.prototype.slice.call(args, 0);args[index != null ? index : args.length] = cb;return fn.apply(thisObj, args);}function __construct(constructor, i) {var key = '__async' + i,f;return constructor[key] || (constructor[key] = function() {var args = arguments;function F() {var self = this;var cb = args[i];args[i] = function(e, r) {cb(e, self);};args[i].__streamlined = cb.__streamlined;args[i].__futurecb = cb.__futurecb;return constructor.apply(self, args);}F.prototype = constructor.prototype;return new F();});}function __setEF(e, f) {function formatStack(e, raw) {var ff = typeof navigator === 'object' && navigator.userAgent.toLowerCase().indexOf('firefox') > -1;if (ff) raw = "Error: " + e.message + '\n' + raw;var s = raw,f, skip;var cut = (e.message || '').split('\n').length;var lines = s.split('\n');s = lines.slice(cut).map(function(l) {var ffOffset = (typeof navigator === 'object' && typeof require === 'function' && require.async) ? 11 : 0;var m = /([^@]*)\@(.*?)\:(\d+)(?:\:(\d+))?$/.exec(l);l = m ? "    at " + m[1] + " (" + m[2] + ":" + (parseInt(m[3]) - ffOffset) + ":" + (m[4] || "0") + ")" : l;var i = l.indexOf('__$');if (i >= 0 && !skip) {skip = true;return l.substring(0, i) + l.substring(i + 3);}return skip ? '' : l;}).filter(function(l) {return l;}).join('\n') + '\n';s = lines.slice(0, cut).join('\n') + '\n    <<< async stack >>>' + (skip ? s : '');for (var f = e.__frame; f; f = f.prev) {if (f.offset >= 0) s += "\n    at " + f.name + " (" + f.file + ":" + (f.line + f.offset) + ":" + (f.col+1) + ")"}s += '\n    <<< raw stack >>>' + '\n' + lines.slice(cut).join('\n');return s;};e.__frame = e.__frame || f;if (exports.stackTraceEnabled && e.__lookupGetter__ && e.__lookupGetter__("rawStack") == null) {var getter = e.__lookupGetter__("stack");if (!getter) { var raw = e.stack || "raw stack unavailable";getter = function() {return raw;}}e.__defineGetter__("rawStack", getter);e.__defineGetter__("stack", function() {return formatStack(e, getter());});}}exports.stackTraceEnabled = true;})(typeof exports !== 'undefined' ? exports : (Streamline.runtime = Streamline.runtime || {}));require && require("../callbacks/builtins");})(mod, mod.exports);return __modules['callbacks/runtime'].exports.runtime('test/common/futures-test._js', false);})(),__func=__rt.__func,__cb=__rt.__cb; QUnit.module(module.id);

function delay(millis, val, _) { var __frame = { name: "delay", line: 3 }; return __func(_, this, arguments, delay, 2, __frame, function __$delay() {
    return setTimeout(__cb(_, __frame, 1, 1, function __$delay() {
      return _(null, val); }, true), millis); });};


asyncTest("no timeout", 1, function __1(_) { var f; var __frame = { name: "__1", line: 8 }; return __func(_, this, arguments, __1, 0, __frame, function __$__1() {
    f = delay(1, "a", false);
    return f(__cb(_, __frame, 2, 8, function ___(__0, __1) { equals(__1, "a", "no timeout");
      start(); _(); }, true)); });});
