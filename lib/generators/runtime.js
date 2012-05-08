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

	var GENERATOR_PROTO = Object.getPrototypeOf((function() {
		yield;
	})());
	if (typeof console === 'undefined') global.console = {
		log: print
	};

	var yieldMarker = {};

	function run(fn, args, idx) {
		var cb = args[idx],
			g;
		function resume(err, val) {
			try {
				while (g) {
					val = g.send(val);
					if (val === yieldMarker) return;
					if (typeof val === 'object' && Object.getPrototypeOf(val) === GENERATOR_PROTO) break;
					g.close();
					g = g.prev;
				}
				while (typeof val === 'object' && Object.getPrototypeOf(val) === GENERATOR_PROTO) {
					val.prev = g;
					g = val;
					val = val.next();
				}
				if (!g) {
					return cb(null, val);
				}
			} catch (ex) {
				while (g) {
					g.close();
					g = g.prev;
				}
				return cb(ex);
			}
		}
		args[idx] = resume;
		try {
			g = fn.apply(this, args);
		} catch (ex) {
			return cb(ex);
		}
		return resume();
	}

	exports.create = function(fn, idx) {
		function F() {
			if (arguments[idx] == null) return future(fn, arguments, idx);
			return run(fn, arguments, idx);
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
		fn.apply(that, args);
		return yieldMarker;
	}
})(typeof exports !== 'undefined' ? exports : (window.StreamlineRuntime = window.StreamlineRuntime || {
	globals: {}
}));
//require && require("streamline/lib/callbacks/builtins");