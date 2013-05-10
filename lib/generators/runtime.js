/**
 * Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */
if (typeof console === 'undefined') global.console = {
	log: print,
	error: print
};

//  container for the context that the runtime maintains across async calls
var globals = require('streamline/lib/globals');

(function(exports) {
	function trap(ex) {
		if (globals.context && globals.context.errorHandler) globals.context.errorHandler(ex);
		else throw ex;
	}

	function future(fn, args, i) {
		var err, result, done, q = [];
		args = Array.prototype.slice.call(args);
		args[i] = function(e, r) {
			err = e, result = r, done = true;
			q && q.forEach(function(f) {
				try {
					f(e, r);
				} catch (ex) {
					trap(ex);
				}
			});
			q = null;
		};
		fn.apply(this, args);
		return function memoize(cb) {
			if (!cb) return memoize;
			if (done) cb(err, result);
			else q.push(cb)
		}
	}

	function isGenerator(val) {
		return Object.prototype.toString.call(val) === "[object Generator]";
	}

	var PENDING = {};

	function run(fn, args, idx) {
		var cb = args[idx],
			g, cx = globals.context;

		function resume(err, val) {
			globals.context = cx;
			while (g) {
				try {
					val = err ? g.throw(err) : g.send(val);
					val = val.done ? undefined : val.value;
					err = null;
					// if we get PENDING, the current call completed with a pending I/O
					// resume will be called again when the I/O completes. So just save the context and return here.
					if (val === PENDING) {
						cx = globals.context;
						return;
					}
					// if we get [PENDING, e, r], the current call invoked its callback synchronously
					// we just loop to send/throw what the callback gave us.
					if (val && val[0] === PENDING) {
						err = val[1];
						val = val[2];
					}
					// else, if g yielded a value which is not a generator, g is done. 
					// so we unwind it we send val to the parent generator (or through cb if we are at the top)
					else if (!isGenerator(val)) {
						//g.close();
						g = g.prev;
					}
					// else, we got a new generator which means that g called another generator function
					// the new generator become current and we loop with g.send(undefined) (equiv to g.next()) 
					else {
						val.prev = g;
						g = val;
						val = undefined;
					}
				} catch (ex) {
					// the send/throw call failed.
					// we unwind the current generator and we rethrow into the parent generator (or through cb if at the top)
					//g.close();
					g = g.prev;
					err = makeError(ex);
					val = undefined;
				}
			}
			// we have exhausted the stack of generators. 
			// return the result or error through the callback.
			try {
				cb(err, val);
			} catch (ex) {
				trap(ex);
			}
		}
		// set resume as the new callback
		args[idx] = resume;
		// call fn to get the initial generator
		g = fn.apply(this, args);
		// start the resume loop
		resume();
	}

	exports.create = function(fn, idx) {
		function F() {
			if (arguments[idx] == null) return future.call(this, F, arguments, idx);
			return run.call(this, fn, arguments, idx);
		};
		// Memoize the original function for fast passing later
		F.gstreamlineFunction = fn;
		return F;
	}

	exports.invoke = function(that, fn, args, idx) {
		// Resolve the function to be called
		if (typeof fn !== 'function') {
			if (typeof that === 'function' && that.gstreamlineFunction && fn === 'call') {
				return that.gstreamlineFunction.apply(args[0], args.slice(1));
			}
			fn = that[fn];
		}

		// If we're waiting on a fstreamline.create function we can just call it directly instead
		if (fn.gstreamlineFunction) return fn.gstreamlineFunction.apply(that, args);

		// Set things up so that call returns:
		// * PENDING if it completes with a pending I/O (and cb will be called later)
		// * [PENDING, e, r] if the callback is called synchronously.
		var result = PENDING,
			sync = true;
		var cb = args[idx];
		args[idx] = function(e, r) {
			if (sync) {
				result = [PENDING, e, r];
			} else {
				cb(e, r);
			}
		}
		fn.apply(that, args);
		sync = false;
		return result;
	}

	exports.construct = function(constructor, i) {
		if (!constructor.gstreamlineFunction) throw new Error("async constructor only allowed on streamlined functions")
		var key = '__async' + i;
		return constructor[key] || (constructor[key] = function*() {
			var that = Object.create(constructor.prototype);
			yield constructor.gstreamlineFunction.apply(that, arguments);
			yield that;
		});
	}

	// Wraps an error to fix stacktrace

	function makeError(e) {
		if (e.streamlined) return e;
		if (!(e instanceof Error)) return e;
		var ne = Object.create(e);
		ne.streamlined = e;
		Object.defineProperty(ne, 'stack', {
			get: function() {
				return e.stack && "Error: " + e.message + '\n' + e.stack.split('\n').filter(function(frame) {
					return frame.indexOf('streamline/lib/generators/runtime.js') < 0;
				}).map(function(line) {
					return "\tat " + line + ':0';
				}).join('\n');
			},
			enumerable: true,
		});
		return ne;
	}

})(typeof exports !== 'undefined' ? exports : (window.StreamlineRuntime = window.StreamlineRuntime || {
	globals: {}
}));
//require && require("streamline/lib/callbacks/builtins");