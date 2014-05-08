/**
 * Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */
(function(exports) {
	var globals = require("../globals");

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
				var globals = require('../globals');
				if (cb == null && globals.Promise) return exports.promise.call(this, F, [], 0);
				if (cb !== false && !globals.oldStyleFutures) throw new Error("callback missing (argument #0). See https://github.com/Sage/streamlinejs/blob/master/FAQ.md#no-callback-given-error");
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

	exports.promise = function(fn, args, i) {
		if (args[i] === false) return exports.future.call(this, fn, args, i);
		if (args[i] != null) throw new Error("invalid callback: " + typeof(args[i]));
		if (globals.oldStyleFutures) return exports.future.call(this, fn, args, i);
		if (!globals.Promise) throw new Error("callback missing (argument #" + i + "). See https://github.com/Sage/streamlinejs/blob/master/FAQ.md#no-callback-given-error");

		var self = this;
		args = Array.prototype.slice.call(args);
		return new globals.Promise(function(resolve, reject) {
			args[i] = function(e, r) {
				if (e) reject(e);
				else resolve(r);
			};
			fn.apply(self, args);
		});
	};

	exports.then = function(promise, method, cb) {
		promise[method](function(r) {
			cb && cb(null, r);
			cb = null;
		}, function(e) {
			cb && cb(e);
			cb = null;
		});
	};
})(typeof exports !== 'undefined' ? exports : (Streamline.future = Streamline.future || {}));

