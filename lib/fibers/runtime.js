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
		// If there was no callback passed then this function needs to return a future, so setup the
		// bookkeeping for that.
		var cb = arguments[idx];
		var err, val, q, resolved = false;
		var memoize = cb || function(e, v) {
			err = e;
			val = v;
			resolved = true;
			q && q.forEach(function(f) {
				try {
					f(err, val);
				} catch (ex) {
					if (globals.context && globals.context.errorHandler) globals.context.errorHandler(ex);
					else throw ex;
				}
			});
			q = null;
		};

		// Start a new fiber
		var that = this,
			args = arguments;
		Fiber(function() {
			var val;
			try {
				val = fn.apply(that, args);
			} catch (err) {
				memoize(err);
				return;
			}
			memoize(null, val);
		}).run();

		// Return a future if no callback
		if (!cb) {
			return function future(cb) {
				if (!cb) return future;
				if (resolved) {
					cb(err && makeError(err, true), val);
				} else if (q) {
					q.push(cb);
				} else {
					q = [cb];
				}
			};
		}
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
	var err, val, yielded = false, cx;
	args[idx] = function(e, v) {
		if (!yielded) {
			yielded = true;
			err = e;
			val = v;
		} else {
			globals.context = cx;
			if (e) {
				fiber.throwInto(e);
			} else {
				fiber.run(v);
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
	try {
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


// Double stack capture size because we may filter out half of them
Error.stackTraceLimit *= 2;

// Wraps an error to fix stacktrace
function makeError(e, incomplete) {
	if (!(e instanceof Error) || e.streamlined) return e;
	var extra;
	if (incomplete) {
		extra = {};
		Error.captureStackTrace(extra);
	}
	var ne = Object.create(e);
	ne.streamlined = e;
	Object.defineProperty(ne, 'stack', {
		get: function() {
			return e.stack && e.stack.split('\n').concat(extra ? extra.stack.split('\n').slice(2) : []).filter(function(frame) {
				return frame.indexOf('streamline/lib/fibers/runtime.js') < 0;
			}).join('\n');
		},
		enumerable: true,
	});
	return ne;
}
require("streamline/lib/fibers/builtins");
