/* eslint no-alert: 0 */
"use strict";
if (!Object.create || !Object.defineProperty || !Object.defineProperties) alert("Example will fail because your browser does not support ECMAScript 5. Try with another browser!");
var __filename = "" + window.location;

window.Streamline = { globals: {} };

function require_(str) {
	if (/^\.\.\//.test(str)) str = "streamline/lib" + str.substring(2);
	if (str === "streamline/lib/util/flows") return Streamline.flows;
	else if (str === "streamline/lib/globals") return Streamline.globals;
	else if (str === "streamline/lib/version") return Streamline.version;
	else if (str === "streamline/lib/fibers/walker") return Streamline.walker;
	else if (str === "streamline/lib/generators/runtime") return Streamline.runtime;
	else if (str === "streamline/lib/generators/transform") return Streamline;
	else if (str === "streamline/lib/generators/builtins") return Streamline.builtins;
	else if (str === "streamline/lib/util/future") return Streamline.future;
	else if (str === "galaxy") return window.galaxy;
	else if (str === "galaxy-stack") return null;
	else alert("cannot require " + str);
}
"use strict";

/// 
/// # Container for global context
/// 
/// The `globals` module is a container for the global `context` object which is maintained across
/// asynchronous calls.
/// 
/// This context is very handy to store information that all calls should be able to access
/// but that you don't want to pass explicitly via function parameters. The most obvious example is
/// the `locale` that each request may set differently and that your low level libraries should
/// be able to retrieve to format messages.
/// 
/// `var globals = require_('streamline/lib/globals')`
/// 
/// * `globals.context = ctx`
/// * `ctx = globals.context`  
///   sets and gets the context
/// 
/// Note: an empty context (`{}`) is automatically set by the server wrappers of the `streams` module,
/// before they dispatch a request. So, with these wrappers, each request starts with a fresh empty context.
// This module may be loaded several times so we need a true global (with a secret name!).
// This implementation also allows us to share the context between modules compiled in callback and fibers mode.
(function() {
	var glob = typeof global === "object" ? global : window;
	var secret = "_20c7abceb95c4eb88b7ca1895b1170d1";
	var g = glob[secret] || (glob[secret] = { context: {} });
	if (typeof exports !== 'undefined') {
		module.exports = g;
	} else {
		Streamline.globals = g;
	}
	// Internal call to manage runtimes
	g.runtime || Object.defineProperty(g, 'runtime', {
		get: function() { return g.__runtime__; },
		set: function(value) {
			if (g.__runtime__ !== value) {
				if (g.__runtime__) {
					if (/-fast$/.test(g.__runtime__) ||
						/-fast$/.test(value)) throw new Error("cannot mix streamline runtimes: " + g.__runtime__ + " and " + value);
					console.log("warning: mixing streamline runtimes: " + g.__runtime__ + " and " + value);
				}
				g.__runtime__ = value;
			}
		}
	});

	/// 
	/// * `fn = globals.withContext(fn, cx)`  
	///   wraps a function so that it executes with context `cx` (or a wrapper around current context if `cx` is falsy).
	///   The previous context will be restored when the function returns (or throws).  
	///   returns the wrapped function.
	g.withContext = function(fn, cx) {
		if (Object.prototype.toString.call(fn) === "[object GeneratorFunction]") throw new Error("async function not allowed in globals.withContext")
		return function() {
			var oldContext = g.context;
			g.context = cx || Object.create(oldContext);
			try {
				return fn.apply(this, arguments);
			} finally {
				g.context = oldContext;
			}
		};
	};

	g.setPromise = function(name) {
		if (g.Promise) return; // first caller wins
		var req = require_; // defeat streamline-require dependencies
		if (name === true) g.Promise = typeof Promise === "function" ? Promise : req('es6-promise');
		else g.Promise = require_(name);
	};
})();

"use strict";
/**
 * Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */
(function(exports) {
	var globals = require_("../globals");

	exports.future = function(fn, args, i) {
		var err, result, done, q = [], self = this;
		args = Array.prototype.slice.call(args);
		args[i] = function(e, r) {
			err = e;
			result = r;
			done = true;
			q && q.forEach(function(f) {
				f.call(self, e, r);
			});
			q = null;
		};
		args[i].__futurecb = true;
		fn.apply(this, args);
		var ret = function F(cb) {
			if (typeof cb !== 'function') {
				var globals = require_('../globals');
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
		if (args[i] != null) throw new Error("invalid callback: " + typeof args[i]);
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

"use strict";
(function(exports) {
	var globals = exports.globals = require_('../globals');
	exports.globals.runtime = 'generators';
	require_("../generators/builtins");
	var fut = require_("../util/future");
	exports.streamlinify = fut.streamlinify;

	var unstar = exports.unstar;

	exports.unstar = function(fn, options, entering) {
		if (typeof options === "number") options = {
			callbackIndex: options,
		};
		else options = options || {};
		options.promise = options.callbackDefault ? function(fn, args, i) {
			return fut.future.call(this, fn, args, i)(options.callbackDefault());
		} : fut.promise;
		return unstar(fn, options, entering);
	};

	exports.then = exports.star(fut.then, 2);
})(typeof exports !== 'undefined' ? module.exports = Object.create(require_('galaxy')) : Streamline.runtime = Streamline.runtime || Object.create(require_('galaxy')));
/*** Generated by streamline 0.12.1 (generators) - DO NOT EDIT ***/var galaxy = require_("../generators/runtime");(function(){})();(galaxy.unstar(function*(_) { /**
 * Copyright (c) 2012 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */

/// 
/// # Streamline built-ins
///  
(function(exports) {
	"use strict";
	var VERSION = 3;



	var future = function(fn, args, i) {
			var err, result, done, q = [],
				self = this;
			args = Array.prototype.slice.call(args);
			args[i] = function(e, r) {
				err = e;
				result = r;
				done = true;
				q && q.forEach(function(f) {
					f.call(self, e, r);
				});
				q = null;
			};
			fn.apply(this, args);
			return function F(cb) {
				if (!cb) return F;
				if (done) cb.call(self, err, result);
				else q.push(cb);
			};
		};

	// Do not use this one directly, require it through the flows module.
	exports.funnel = function(max) {
		max = max == null ? -1 : max;
		if (max === 0) max = funnel.defaultSize;
		if (typeof max !== "number") throw new Error("bad max number: " + max);
		var queue = [],
			active = 0,
			closed = false;

		var funCb = function(callback, fn) {
				if (callback == null) return future(funCb, arguments, 0);
				//console.log("FUNNEL: active=" + active + ", queued=" + queue.length);
				if (max < 0 || max === Infinity) return fn(  callback);

				queue.push({
					fn: fn,
					cb: callback
				});

				function _doOne() {
					var current = queue.splice(0, 1)[0];
					if (!current.cb) return current.fn();
					active++;
					current.fn(  function(err, result) {
						active--;
						if (!closed) {
							current.cb(err, result);
							while (active < max && queue.length > 0) _doOne();
						}
					});
				}

				while (active < max && queue.length > 0) _doOne();
			};	
		var fun = galaxy.streamlinify(funCb, 0);

		fun.close = function() {
			queue = [];
			closed = true;
		};
		return fun;
	};
	var funnel = exports.funnel;
	funnel.defaultSize = 4;

	function _parallel(options) {
		if (typeof options === "number") return options;
		if (typeof options.parallel === "number") return options.parallel;
		return options.parallel ? -1 : 1;
	}

	if (Array.prototype.forEach_ && Array.prototype.forEach_.version_ >= VERSION) return;

	// bail out (silently) if JS does not support defineProperty (IE 8).
	try {
		Object.defineProperty({}, 'x', {});
	} catch (e) {
		return;
	}

	var has = Object.prototype.hasOwnProperty;

	/* eslint-disable no-extend-native */

	/// ## Array functions  
	/// 
	/// These functions are asynchronous variants of the EcmaScript 5 Array functions.
	/// 
	/// Common Rules: 
	/// 
	/// These variants are postfixed by an underscore.  
	/// They take the `_` callback as first parameter.  
	/// They pass the `_` callback as first argument to their `fn` callback.  
	/// Most of them have an optional `options` second parameter which controls the level of 
	/// parallelism. This `options` parameter may be specified either as `{ parallel: par }` 
	/// where `par` is an integer, or directly as a `par` integer value.  
	/// The `par` values are interpreted as follows:
	/// 
	/// * If absent or equal to 1, execution is sequential.
	/// * If > 1, at most `par` operations are parallelized.
	/// * if 0, a default number of operations are parallelized. 
	///   This default is defined by `flows.funnel.defaultSize` (4 by default - see `flows` module).
	/// * If < 0 or Infinity, operations are fully parallelized (no limit).
	/// 
	/// Functions:
	/// 
	/// * `array.forEach_(_[, options], fn[, thisObj])`  
	///   `fn` is called as `fn(_, elt, i, array)`.
	delete Array.prototype.forEach_;
	Object.defineProperty(Array.prototype, 'forEach_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: galaxy.unstar(function*(_, options, fn, thisObj) {
			if (typeof options === "function") {
				thisObj = fn;
				fn = options;
				options = 1;
			}
			var par = _parallel(options);
			thisObj = thisObj !== undefined ? thisObj : this;
			var len = this.length;
			if (par === 1 || len <= 1) {
				for (var i = 0; i < len; i++) {
					if (has.call(this, i)) (yield galaxy.invoke(fn, "call", [thisObj , _ , this[i] , i , this], 1));
				}
			} else {
				(yield galaxy.invoke(this, "map_", [_ , par , fn , thisObj], 0));
			}
			return this;
		}, 0)
	});
	Array.prototype.forEach_.version_ = VERSION;
	/// * `result = array.map_(_[, options], fn[, thisObj])`  
	///   `fn` is called as `fn(_, elt, i, array)`.
	delete Array.prototype.map_;
	Object.defineProperty(Array.prototype, 'map_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: galaxy.unstar(function*(_, options, fn, thisObj) {
			if (typeof options === "function") {
				thisObj = fn;
				fn = options;
				options = 1;
			}
			var par = _parallel(options);
			thisObj = thisObj !== undefined ? thisObj : this;
			var len = this.length;
			var result, i;
			if (par === 1 || len <= 1) {
				result = new Array(len);
				for (i = 0; i < len; i++) {
					if (has.call(this, i)) result[i] = (yield galaxy.invoke(fn, "call", [thisObj , _ , this[i] , i , this], 1));
				}
			} else {
				var fun = funnel(par);
				result = this.map(function(elt, i, arr) {
					return fun(false, galaxy.unstar(function*(_) {
						return (yield galaxy.invoke(fn, "call", [thisObj , _ , elt , i , arr], 1));
					}, 0));
				});
				for (i = 0; i < len; i++) {
					if (has.call(this, i)) result[i] = (yield galaxy.invoke(result, i, [_], 0));
				}
			}
			return result;
		}, 0)
	});
	/// * `result = array.filter_(_[, options], fn[, thisObj])`  
	///   `fn` is called as `fn(_, elt, i, array)`.
	delete Array.prototype.filter_;
	Object.defineProperty(Array.prototype, 'filter_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: galaxy.unstar(function*(_, options, fn, thisObj) {
			if (typeof options === "function") {
				thisObj = fn;
				fn = options;
				options = 1;
			}
			var par = _parallel(options);
			thisObj = thisObj !== undefined ? thisObj : this;
			var result = [];
			var len = this.length;
			if (par === 1 || len <= 1) {
				for (var i = 0; i < len; i++) {
					if (has.call(this, i)) {
						var elt = this[i];
						if ((yield galaxy.invoke(fn, "call", [thisObj , _ , elt , i , this], 1))) result.push(elt);
					}
				}
			} else {
				(yield galaxy.invoke(this, "map_", [_ , par , galaxy.unstar(function*(_, elt, i, arr) {
					if ((yield galaxy.invoke(fn, "call", [thisObj , _ , elt , i , arr], 1))) result.push(elt);
				}, 0) , thisObj], 0));
			}
			return result;
		}, 0)
	});
	/// * `bool = array.every_(_[, options], fn[, thisObj])`  
	///   `fn` is called as `fn(_, elt, i, array)`.
	delete Array.prototype.every_;
	Object.defineProperty(Array.prototype, 'every_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: galaxy.unstar(function*(_, options, fn, thisObj) {
			if (typeof options === "function") {
				thisObj = fn;
				fn = options;
				options = 1;
			}
			var par = _parallel(options);
			thisObj = thisObj !== undefined ? thisObj : this;
			var len = this.length, i;
			if (par === 1 || len <= 1) {
				for (i = 0; i < len; i++) {

					if (has.call(this, i) && !(yield galaxy.invoke(fn, "call", [thisObj , _ , this[i] , i , this], 1))) return false;
				}
			} else {
				var fun = funnel(par);
				var futures = this.map(function(elt, i, arr) {
					return fun(false, galaxy.unstar(function*(_) {
						return (yield galaxy.invoke(fn, "call", [thisObj , _ , elt , i , arr], 1));
					}, 0));
				});
				for (i = 0; i < len; i++) {
					if (has.call(this, i) && !(yield galaxy.invoke(futures, i, [_], 0))) {
						fun.close();
						return false;
					}
				}
			}
			return true;
		}, 0)
	});
	/// * `bool = array.some_(_[, options], fn[, thisObj])`  
	///   `fn` is called as `fn(_, elt, i, array)`.
	delete Array.prototype.some_;
	Object.defineProperty(Array.prototype, 'some_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: galaxy.unstar(function*(_, options, fn, thisObj) {
			if (typeof options === "function") {
				thisObj = fn;
				fn = options;
				options = 1;
			}
			var par = _parallel(options);
			thisObj = thisObj !== undefined ? thisObj : this;
			var len = this.length, i;
			if (par === 1 || len <= 1) {
				for (i = 0; i < len; i++) {
					if (has.call(this, i) && (yield galaxy.invoke(fn, "call", [thisObj , _ , this[i] , i , this], 1))) return true;
				}
			} else {
				var fun = funnel(par);
				var futures = this.map(function(elt, i, arr) {
					return fun(false, galaxy.unstar(function*(_) {
						return (yield galaxy.invoke(fn, "call", [thisObj , _ , elt , i , arr], 1));
					}, 0));
				});
				for (i = 0; i < len; i++) {
					if (has.call(this, i) && (yield galaxy.invoke(futures, i, [_], 0))) {
						fun.close();
						return true;
					}
				}
			}
			return false;
		}, 0)
	});
	/// * `result = array.reduce_(_, fn, val[, thisObj])`  
	///   `fn` is called as `val = fn(_, val, elt, i, array)`.
	delete Array.prototype.reduce_;
	Object.defineProperty(Array.prototype, 'reduce_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: galaxy.unstar(function*(_, fn, v, thisObj) {
			thisObj = thisObj !== undefined ? thisObj : this;
			var len = this.length;
			for (var i = 0; i < len; i++) {
				if (has.call(this, i)) v = (yield galaxy.invoke(fn, "call", [thisObj , _ , v , this[i] , i , this], 1));
			}
			return v;
		}, 0)
	});
	/// * `result = array.reduceRight_(_, fn, val[, thisObj])`  
	///   `fn` is called as `val = fn(_, val, elt, i, array)`.
	delete Array.prototype.reduceRight_;
	Object.defineProperty(Array.prototype, 'reduceRight_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: galaxy.unstar(function*(_, fn, v, thisObj) {
			thisObj = thisObj !== undefined ? thisObj : this;
			var len = this.length;
			for (var i = len - 1; i >= 0; i--) {
				if (has.call(this, i)) v = (yield galaxy.invoke(fn, "call", [thisObj , _ , v , this[i] , i , this], 1));
			}
			return v;
		}, 0)
	});

	/// * `array = array.sort_(_, compare [, beg [, end]])`  
	///   `compare` is called as `cmp = compare(_, elt1, elt2)`.  
	///   Note: this function _changes_ the original array (and returns it).
	delete Array.prototype.sort_;
	Object.defineProperty(Array.prototype, 'sort_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: galaxy.unstar(function*(_, compare, beg, end) {var _qsort_ = galaxy.unstar(_qsort, 0);
			var array = this;
			beg = beg || 0;
			end = end == null ? array.length - 1 : end;

			function* _qsort(_, beg, end) {
				if (beg >= end) return;

				var tmp;
				if (end === beg + 1) {
					if ((yield galaxy.invoke(null, compare, [_ , array[beg] , array[end]], 0)) > 0) {
						tmp = array[beg];
						array[beg] = array[end];
						array[end] = tmp;
					}
					return;
				}

				var mid = Math.floor((beg + end) / 2);
				var o = array[mid];
				var nbeg = beg;
				var nend = end;

				while (nbeg <= nend) {
					while (nbeg < end && (yield galaxy.invoke(null, compare, [_ , array[nbeg] , o], 0)) < 0) nbeg++;
					while (beg < nend && (yield galaxy.invoke(null, compare, [_ , o , array[nend]], 0)) < 0) nend--;

					if (nbeg <= nend) {
						tmp = array[nbeg];
						array[nbeg] = array[nend];
						array[nend] = tmp;
						nbeg++;
						nend--;
					}
				}

				if (nbeg < end) (yield _qsort(_ , nbeg , end));
				if (beg < nend) (yield _qsort(_ , beg , nend));
			}
			(yield _qsort(_ , beg , end));
			return array;
		}, 0)
	});

	/// 
	/// ## Function functions  
	/// 
	/// * `result = fn.apply_(_, thisObj, args[, index])`  
	///   Helper to use `Function.prototype.apply` inside streamlined functions.  
	///   Equivalent to `result = fn.apply(thisObj, argsWith_)` where `argsWith_` is 
	///   a modified `args` in which the callback has been inserted at `index` 
	///   (at the end of the argument list if `index` is omitted or negative).
	delete Function.prototype.apply_;
	Object.defineProperty(Function.prototype, 'apply_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: function(callback, thisObj, args, index) {
			args = Array.prototype.slice.call(args, 0);
			args.splice(index != null && index >= 0 ? index : args.length, 0, callback);
			return this.apply(thisObj, args);
		}
	});
})(typeof exports !== 'undefined' ? exports : (Streamline.builtins = Streamline.builtins || {}));
}, 0).call(this, function(err) {
  if (err) throw err;
}));
