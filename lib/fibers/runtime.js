// Copyright 2011 Marcel Laverdet
"use strict";
this.create = create;
this.invoke = invoke;
this.construct = construct;

var Fiber = require('../util/require')('fibers', module.parent.filename);

/**
 * container for the context that the runtime maintains across async calls
 */
var globals = require('../globals');
var future = require("streamline/lib/util/future").future;

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

function create(fn, idx) {
	function F() {
		var cb = arguments[idx];
		if (!cb) return future.call(this, F, arguments, idx);

		// Start a new fiber
		var that = this,
			args = arguments;
		Fiber(function() {
			var val;
			try {
				val = fn.apply(that, args);
			} catch (err) {
				return cb(err);
			}
			cb(null, val);
		}).run();
	};

	// Memoize the original function for fast passing later
	F.fstreamlineFunction = fn;
	return F;
}

/**
 * Invokes an async function and yields currently running fiber until it callsback.
 *
 * rewrite:
 * fs.readFile(file, _);
 * ->
 * invoke(fs, 'readFile', [file], 1);
 */

function invoke(that, fn, args, idx) {
	// Resolve the function to be called
	if (typeof fn !== 'function') {
		if (typeof that === 'function' && that.fstreamlineFunction && fn === 'call') {
			return that.fstreamlineFunction.apply(args[0], args.slice(1));
		}
		fn = that[fn];
	}

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
	var err, val, yielded = false,
		cx, fut;
	args[idx] = function(e, v) {
		for (var f = fut; f; f = f.prev) {
			if (f.cancelled) e = new Error("cancelled");
		}
		if (!yielded) {
			yielded = true;
			err = e;
			val = v;
		} else {
			globals.context = cx;
			var oldFut = globals.future;
			globals.future = fut;
			try {
				if (e) {
					fiber.throwInto(e);
				} else {
					fiber.run(v);
				}
			} finally {
				globals.future = oldFut;
			}
		}
	};

	// Invoke the function and yield
	fn.apply(that, args);
	if (yielded) {
		if (err) {
			throw err;
		}
		return val;
	}
	yielded = true;
	cx = globals.context;
	fut = globals.future;
	try {
		return Fiber.yield();
	} catch (e) {
		throw makeError(e, true);
	}
}

function construct(constructor, i) {
	if (!constructor.fstreamlineFunction) throw new Error("async constructor only allowed on streamlined functions")
	var key = '__async' + i;
	return constructor[key] || (constructor[key] = function() {
		var that = Object.create(constructor.prototype);
		constructor.fstreamlineFunction.apply(that, arguments);
		return that;
	});
}


// Double stack capture size because we may filter out half of them
Error.stackTraceLimit *= 2;

// Wraps an error to fix stacktrace

function makeError(e, incomplete) {
	if (!(e instanceof Error)) return e;
	var extra;
	if (incomplete) {
		extra = {};
		Error.captureStackTrace(extra);
	} else if (e.streamlined) {
		return e;
	}
	var ne = Object.create(e);
	ne.streamlined = e;
	Object.defineProperty(ne, 'stack', {
		get: function() {
			return e.stack && e.stack.split('\n').concat(extra ? extra.stack.split('\n').slice(2) : []).filter(function(frame) {
				return frame.indexOf('streamline/lib/fibers/runtime.js') < 0 &&
					frame.indexOf('streamline/lib/util/future.js') < 0;
			}).join('\n');
		},
		enumerable: true,
	});
	return ne;
}
require("streamline/lib/fibers/builtins");
