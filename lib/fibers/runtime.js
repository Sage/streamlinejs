// Copyright 2011 Marcel Laverdet
"use strict";
var Fiber = require('../util/require')('fibers', module.parent.filename);

/**
 * container for the context that the runtime maintains across async calls
 */
var globals = this.globals = require('../globals');
globals.runtime = 'fibers';
var fut = require("../util/future");

this.create = create;
this.invoke = invoke;
this.construct = construct;
this.spin = spin;
this.streamlinify = fut.streamlinify;
this.globals = globals;

/**
 * Creates a function that builds a fiber when called and automatically returns a future.
 *
 * rewrite:
 * function foo(arg, _) {
 *	 ...
 * }
 * ->
 * var foo = create(foo(arg, _) {
 *	 ...
 * }, 1);
 */
 function Frame(fn, file, line) {
	this.prev = globals.frame;
	this.name = fn.name;
	this.file = file;
	this.line = line;
	// initialize streamline-flamegraph fields to make it monomorphic
	this.recurse = 0;
	this.yielded = 0;
	this.id = 0;
}

function pushFrame(fn, file, line) {
	var frame = globals.frame = new Frame(fn, file, line);
	globals.emitter.emit('enter', frame);
	return frame;
}

function popFrame(frame) {
	if (globals.frame !== frame) throw new Error("FRAME MISMATCH: \n\t" + JSON.stringify(frame) + '\n\t' + JSON.stringify(globals.frame));
	globals.emitter.emit('exit', frame);
	globals.frame = globals.frame.prev;
}

// special hack to preserve the arity in create.
// To avoid runtime overhead in the generated function, I generate a different creator function for each arity value
// This is the template for the create function.
// For each arity we will generate a variant of this function where F() is replaced by F(a1, a2, ...)
function createTemplate(fn, idx, file, line) {
	var callbackDefault;
	if (idx && typeof idx === "object") {
		callbackDefault = idx.callbackDefault;
		idx = idx.callbackIndex;
	}
	var emitter = globals.emitter;
	function F() {
		var cb = arguments[idx];
		if (typeof cb !== 'function') {
			if (callbackDefault) return fut.future.call(this, F, arguments, idx)(callbackDefault());
			else return fut.promise.call(this, F, arguments, idx);
		}

		// Start a new fiber
		var that = this,
			args = arguments;
		var savFrame;
		if (emitter) savFrame = globals.frame;
		var cx = globals.context, 
			frame = globals.frame;
		Fiber(function __streamline$run() {
			// copy variables from outer scope into locals and reset them
			// this avoids a serious memory leak.
			var largs = args;
			args = null;
			var lcb = cb;
			cb = null;
			var lthat = that;
			that = null;

			var val, err = null;
			var oldContext = globals.context;
			globals.context = cx;
			cx = null;
			var oldFrame = globals.frame;
			globals.frame = frame;
			frame = null;
			try {
				val = F.fstreamlineFunction.apply(lthat, largs);
			} catch (e) {
				err = e;
			} finally {			
				lcb(err, val);
				globals.frame = oldFrame;
				globals.context = oldContext;				
			}
		}).run();
		if (emitter) globals.frame = savFrame;
	};

	// Memoize the original function for fast passing later
	if (emitter) {
		F.fstreamlineFunction = function() {
			var frame = pushFrame(fn, file, line);
			try {
				return fn.apply(this, arguments);
			} finally {
				popFrame(frame);
			}
		};
	} else {
		F.fstreamlineFunction = fn;
	}
	return F;
}

var createBody = createTemplate.toString();
createBody = createBody.substring(createBody.indexOf('{'));

var creators = [];

function makeCreator(i) {
	function makeArgs(i) {
		if (i <= 0) throw new Error("bad arg count: " + i);
		return i > 1 ? makeArgs(i - 1) + ', a' + i : "a1";
	}
	return eval("(function(fn, idx, file, line)" + createBody.replace("F()", "F(" + makeArgs(i) + ")") + ")");
}

function create(fn, idx, file, line) {
	var i = fn.length;
	var creator = creators[i] || (creators[i] = makeCreator(i));
	return creator(fn, idx, file, line); 
}

/**
 * Invokes an async function and yields currently running fiber until it callsback.
 *
 * rewrite:
 * fs.readFile(file, _);
 * ->
 * invoke(fs, 'readFile', [file], 1);
 */

function invoke(that, fn, args, options) {
	var idx = (options && typeof options === 'object') ? options.callbackIndex : options; 
	// Resolve the function to be called
	if (typeof fn !== 'function') {
		if (typeof that === 'function' && that.fstreamlineFunction && fn === 'call') {
			return that.fstreamlineFunction.apply(args[0], args.slice(1));
		}
		fn = that[fn];
	}

	var emitter = globals.emitter, f;
	// If we're waiting on a fstreamline.create function we can just call it directly instead
	if (fn.fstreamlineFunction) {
		try {
			return fn.fstreamlineFunction.apply(that, args);
		} catch (e) {
			throw makeError(e, false);
		}
	}

	// Setup callback to resume fiber after it's yielded
	var fiber = Fiber.current;
	var err, val, yielded = false, cx;
	args[idx] = function(e, v) {
		if (options && options.returnArray) v = Array.prototype.slice.call(arguments, 1);
		if (!yielded) {
			yielded = true;
			err = e;
			val = v;
		} else {
			var oldContext = globals.context;
			globals.context = cx;
			var oldFrame = globals.frame;
			globals.frame = frame;
			if (emitter) {
				if (globals.yielded) emitter.emit('resume', frame);
				globals.yielded = false;
			}
			try {
				if (e) {
					fiber.throwInto(e);
				} else {
					fiber.run(v);
				}
			} finally {
				globals.frame = oldFrame;
				globals.context = oldContext;
			}
		}
	};

	// Invoke the function and yield
	var frame = globals.frame;
	fn.apply(that, args);
	if (yielded) {
		if (err) {
			throw makeError(err, true);
		}
		return val;
	}
	yielded = true;
	cx = globals.context;
	try {
		if (emitter) {
			if (!globals.yielded) emitter.emit('yield', frame);
			globals.yielded = true;
		}
		return Fiber.yield();
	} catch (e) {
		throw makeError(e, true);
	}
}

function construct(constructor, i) {
	var key = '__async' + i;
	return constructor[key] || (constructor[key] = function() {
		var that = Object.create(constructor.prototype);
		(constructor.fstreamlineFunction || constructor).apply(that, arguments);
		return that;
	});
}

function spin(fn, that, args, idx) {
	var fut = exports.create(fn, idx).apply(that, args);
	return function() {
		return exports.invoke(null, fut, arguments, 0);
	} 
}

this.then = function(promise, method, cb) {
	return exports.invoke(null, fut.then, arguments, 2);
}

// Double stack capture size because we may filter out half of them
Error.stackTraceLimit *= 2;

// Wraps an error to fix stacktrace

function makeError(e, incomplete) {
	if (!(e instanceof Error)) return e;
	var extra;
	if (incomplete) {
		extra = { message: "__streamline$extra" };
		Error.captureStackTrace(extra);
	}
	var ne = Object.create(e);
	Object.defineProperty(ne, 'stack', {
		get: function() {
			return (e.stack + (extra ? extra.stack : "")).split('\n').filter(function(frame) {
				return !/[\\\/]fibers[\\\/]runtime\.js/.test(frame) &&
					!/[\\\/]util[\\\/]future\.js/.test(frame) &&
					frame.indexOf('__streamline$') < 0;
			}).join('\n');
		},
		enumerable: true,
	});
	return ne;
}
require("../fibers/builtins");
