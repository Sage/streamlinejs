/**
 * Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */
(function(exports) {
	exports.future = function(fn, args, i) {
		var err, result, done, q = [], self = this;
		args = Array.prototype.slice.call(args);
		args[i] = function(e, r) {
			err = e, result = r, done = true;
			q && q.forEach(function(f) {
				f.call(self, e, r);
			});
			q = null;
		};
		args[i].__futurecb = true;
		fn.apply(this, args);
		var ret = function F(cb) {
			if (typeof cb !== 'function') {
				if (cb !== false && !require('streamline/lib/globals').oldStyleFutures) throw new Error("no callback given (argument #0). If you're a Streamline user, more info: https://github.com/Sage/streamlinejs/blob/master/FAQ.md#no-callback-given-error");
				return F;
			}
			if (done) cb.call(self, err, result);
			else q.push(cb);
		};
		ret.__future = true;
		return ret;
	};

	exports.streamlinify = function(fn, idx) {
		return function() {
			if (!arguments[idx]) return exports.future.call(this, fn, arguments, idx);
			else return fn.apply(this, arguments);
		};
	};
})(typeof exports !== 'undefined' ? exports : (Streamline.future = Streamline.future || {}));

