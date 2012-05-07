/**
 * Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */
(function(exports) {
	function future(fn, args, i) {
		var err, result, done, q = [];
		args = Array.prototype.slice.call(args);
		args[i] = function(e, r) {
			err = e, result = r, done = true;
			q && q.forEach(function(f) {
				//try {
				f(e, r);
				//} catch (ex) { __trap(ex); }
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

	var GENERATOR_PROTO = Object.getPrototypeOf((function() { yield; })());

	function run(fn, args, idx) {
		var cb = args[idx],
			stack = [];
		var resume = function(err, val) {
				try {
					var g = stack.pop();
					val = g.send(val);
					while ((!val || !val.next) && stack.length > 0) {
						g.close();
						g = stack.pop();
						val = g.send(val);
					}
					stack.push(g);
					while (val && Object.getPrototypeOf(val) === GENERATOR_PROTO) {
						stack.push(val);
						val = val.next();
					}
					if (stack.length == 1) {
						stack.pop().close();
						cb(null, val);
					}
				} catch (ex) {
					while (stack.length > 0) stack.pop().close();
					cb(ex);
				}
			}
		args[idx] = resume;
		try {
			stack.push(fn.apply(this, args));
		} catch (ex) {
			cb(ex);
		}
		resume();
	}

	exports.create = function(fn, idx) {
		function F() {
			if (arguments[idx] == null) return future(fn, arguments, idx);
			run(fn, arguments, idx);
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
		if (fn.gstreamlineFunction) {
			try {
				return fn.gstreamlineFunction.apply(that, args);
			} catch (e) {
				throw e; //makeError(e, false);
			}
		}
		return fn.apply(that, args);
	}
})(typeof exports !== 'undefined' ? exports : (window.StreamlineRuntime = window.StreamlineRuntime || {
	globals: {}
}));
//require && require("streamline/lib/callbacks/builtins");