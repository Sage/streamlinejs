// Copyright 2011 Marcel Laverdet
"use strict";
this.create = create;
this.invoke = invoke;

require('fibers');

/**
 * Context that the runtime maintains across async calls
 */
exports.context = undefined; // not strictly necessary but let's advertise it

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
				f(err, val);
			});
			q = null;
		};

		// Start a new fiber
		var that = this, args = arguments;
		new Fiber(function() {
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
			return function(cb) {
				if (resolved) {
					cb(err, val);
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
		fn = that[fn];
	}

	// If we're waiting on a fstreamline.create function we can just call it directly instead
	if (fn.fstreamlineFunction) {
		try {
			return fn.fstreamlineFunction.apply(that, args);
		} catch (e) {
			throw makeError(e, ''); 
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
			exports.context = cx;
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
	cx = exports.context;
	try {
		return Fiber.yield();
	} catch (e) {
		var stack = {};
		Error.captureStackTrace(stack);
		throw makeError(e, '\n' + stack.stack.substring(stack.stack.indexOf('\n') + 1));
	}
}

function makeError(e, stack) {
	var ne = Object.create(e);
	Object.defineProperty(ne, 'stack', {
		get: function() {
			return (e.stack + stack).replace(/.*streamline\/lib\/fibers\/runtime.*\n/g, '');
		},
		enumerable: true,
	});
	return ne;
}
