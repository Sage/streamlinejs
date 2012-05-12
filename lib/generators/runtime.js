/**
 * Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */
if (typeof console === 'undefined') global.console = {
	log: print,
	error: print
};

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

	function isGenerator(val) {
		return typeof val === 'object' && Object.getPrototypeOf(val) === GENERATOR_PROTO;
	}

	var yieldMarker = {};

	function run(fn, args, idx) {
		var cb = args[idx],
			g;

		function resume(err, val) {
			while (g) {
				if (isGenerator(val)) {
					val.prev = g;
					g = val;
					val = undefined;
					//val = g.next();
				} else {
					try {
						val = g.send(val);
						if (val == yieldMarker) return;
						if (!isGenerator(val)) {
							g.close();
							g = g.prev;
						}
					} catch (ex) {
						g.close();
						g = g.prev;
						if (g) {
							val = g.throw(ex);
						} else {
							return cb(ex);

						}
					}
				}
			}
			return cb(null, val);
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
			if (arguments[idx] == null) return future.call(this, F, arguments, idx);
			return run.call(this, fn, arguments, idx);
		};
		// Memoize the original function for fast passing later
		F.gstreamlineFunction = fn;
		return F;
	}

	exports.invoke = function(that, fn, args, idx) {
		try {
			// Resolve the function to be called
			if (typeof fn !== 'function') {
				if (typeof that === 'function' && that.gstreamlineFunction && fn === 'call') {
					return that.gstreamlineFunction.apply(args[0], args.slice(1));
				}
				fn = that[fn];
			}

			// If we're waiting on a fstreamline.create function we can just call it directly instead
			if (fn.gstreamlineFunction) return fn.gstreamlineFunction.apply(that, args);

			fn.apply(that, args);
			//console.log("RETURNING YIELD MARKER")
			return yieldMarker;
		} catch (ex) {
			console.log("INVOKE CAUGHT " + ex + '\n' + ex.stack);
			if (args[idx]) return args[idx](ex);
			else throw ex; //makeError(e, false);
		}
	}
})(typeof exports !== 'undefined' ? exports : (window.StreamlineRuntime = window.StreamlineRuntime || {
	globals: {}
}));
//require && require("streamline/lib/callbacks/builtins");