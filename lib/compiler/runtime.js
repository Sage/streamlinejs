/**
 * Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */
var __g = {}; // streamline's globals
global.__streamline = __g; // standalone modules need to share our global!
exports = module.exports = function(filename){
	var __srcName = filename.replace(/\.js$/, '_.js')
	function __func(_, __this, __arguments, fn, index, frame, body){
		if (!_) {
			return __future.call(__this, fn, __arguments, index);
		}
		frame.file = __srcName;
		frame.prev = __g.frame;
		__g.frame = frame;
		try {
			body();
		} 
		catch (e) {
			__setEF(e, frame.prev);
			__propagate(_, e);
		}
		finally {
			__g.frame = frame.prev;
		}
	}
	
	return {
		__g: __g,
		__srcName: __srcName,
		__func: __func,
		__cb: __cb,
		__future: __future,
		__propagate: __propagate,
		__trap: __trap,
		__tryCatch: __tryCatch,
		__forIn: __forIn,
		__apply: __apply,
		__setEF: __setEF
	};
}

function __cb(_, frame, offset, col, fn){
	frame.offset = offset;
	frame.col = col;
	var ctx = __g.context;
	return function ___(err, result){
		var oldFrame = __g.frame;
		__g.frame = frame;
		__g.context = ctx;
		try {
			if (err) {
				__setEF(err, frame);
				return _(err);
			}
			return fn(null, result);
		} 
		catch (ex) {
			__setEF(ex, frame);
			return __propagate(_, ex);
		}
		finally {
			__g.frame = oldFrame;
		}
	}
}

// unfortunately callee is gone. So we need to pass a function
function __future(fn, args, i){
	var err, result, done, q = [];
	var args = Array.prototype.slice.call(args);
	args[i] = function(e, r){
		err = e, result = r, done = true;
		q && q.forEach(function(f){
			try {
				f(e, r);
			} 
			catch (ex) {
				__trap(ex);
			}
		});
		q = null;
	};
	fn.apply(this, args);
	return function ___(_){
		if (done) 
			_(err, result);
		else 
			q.push(_)
	}
}

function __propagate(_, err){
	try {
		_(err);
	} 
	catch (ex) {
		__trap(ex);
	}
}

function __trap(err){
	if (err) {
		if (__g.context && __g.context.errorHandler) 
			__g.context.errorHandler(err);
		else 
			console.error("UNCAUGHT EXCEPTION: " + err.message + "\\n" + err.stack);
	}
}

__tryCatch: function __tryCatch(_, fn){
	try {
		fn();
	} 
	catch (e) {
		try {
			_(e);
		} 
		catch (ex) {
			__trap(ex);
		}
	}
}

function __forIn(object){
	var array = [];
	for (var obj in object) {
		array.push(obj);
	}
	return array;
}

function __apply(cb, fn, thisObj, args, index){
	if (cb == null) 
		return __future(__apply, arguments, 0);
	args[index != null ? index : args.length] = cb;
	return fn.apply(thisObj, args);
}

function __setEF(e, f){
	function formatStack(e, raw){
		var s = raw, f, skip, skipFunc = 0;
		if (s) {
			var ff;
			s = s.split('\n').map(function(l){
				// try to map firefox format to V8 format
				// ffOffset takes care of lines difference introduced by require.js script.
				var ffOffset = __streamline.ffOffset || 0;
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
				if (f.offset >= 0) 
					s += "    at " + f.name + " (" + f.file + ":" + (f.line + f.offset) + ":" + f.col + ")\n"
			}
		}
		return s;
	};
	e.__frame = e.__frame || f;
	if (exports.stackTraceEnabled && e.__lookupGetter__("rawStack") == null) {
		var getter = e.__lookupGetter__("stack");
		if (!getter) { // FF case
			var raw = e.stack;
			getter = function(){
				return raw;
			}
		}
		e.__defineGetter__("rawStack", getter);
		e.__defineGetter__("stack", function(){
			return formatStack(e, getter());
		});
	}
}

/// * `runtime.stackTraceEnabled = true/false;`
///   If true, `err.stack` returns the reconstructed _sync_ stack trace.
///   Otherwise, it returns the _raw_ stack trace.
///   The default is true, but you must require the flows module
///   at least once to enable sync stack traces.
module.exports.stackTraceEnabled = true;
