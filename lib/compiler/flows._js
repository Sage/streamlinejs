/**
 * Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 *
 */
/// !doc
/// 
/// # Control Flow utilities
///  
/// `var flows = require('streamline/lib/util/flows')`
/// 
(function(exports) {
	"use strict";
	var globals = require('../globals');
	var dir = '../' + globals.runtime;
	var builtins = require(dir + '/builtins');
	/// !nodoc
	/// Obsolete API
	/// 
	/// This API is obsolete. Use `array.forEach_`, `array.map_`, ... instead.
	/// 
	/// * `flows.each(_, array, fn, [thisObj])`  
	///   applies `fn` sequentially to the elements of `array`.  
	///   `fn` is called as `fn(_, elt, i)`.
	exports.each = function(_, array, fn, thisObj) {
		return (array && array.length) ? array.forEach_(_, fn, thisObj) : undefined;
	}
	/// * `result = flows.map(_, array, fn, [thisObj])`  
	///   transforms `array` by applying `fn` to each element in turn.  
	///   `fn` is called as `fn(_, elt, i)`.
	exports.map = function(_, array, fn, thisObj) {
		return array ? array.map_(_, fn, thisObj) : array;
	}
	/// * `result = flows.filter(_, array, fn, [thisObj])`  
	///   generates a new array that only contains the elements that satisfy the `fn` predicate.  
	///   `fn` is called as `fn(_, elt)`.
	exports.filter = function(_, array, fn, thisObj) {
		return array ? array.filter_(_, fn, thisObj) : array;
	}
	/// * `bool = flows.every(_, array, fn, [thisObj])`  
	///   returns true if `fn` is true on every element (if `array` is empty too).  
	///   `fn` is called as `fn(_, elt)`.
	exports.every = function(_, array, fn, thisObj) {
		return array ? array.every_(_, fn, thisObj) : undefined;
	}
	/// * `bool = flows.some(_, array, fn, [thisObj])`  
	///   returns true if `fn` is true for at least one element.  
	///   `fn` is called as `fn(_, elt)`.
	exports.some = function(_, array, fn, thisObj) {
		return array ? array.some_(_, fn, thisObj) : undefined;
	}
	/// * `result = flows.reduce(_, array, fn, val, [thisObj])`  
	///   reduces by applying `fn` to each element.  
	///   `fn` is called as `val = fn(_, val, elt, i, array)`.
	exports.reduce = function(_, array, fn, v, thisObj) {
		return array ? array.reduce_(_, fn, v, thisObj) : v;
	}
	/// * `result = flows.reduceRight(_, array, fn, val, [thisObj])`  
	///   reduces from end to start by applying `fn` to each element.  
	///   `fn` is called as `val = fn(_, val, elt, i, array)`.
	exports.reduceRight = function(_, array, fn, v, thisObj) {
		return array ? array.reduceRight_(_, fn, v, thisObj) : v;
	}

	/// * `array = flows.sort(_, array, compare, [beg], [end])`  
	///   sorts the array.  
	///   `compare` is called as `cmp = compare(_, elt1, elt2)`
	///   
	///   Note: this function _changes_ the original array (and returns it)
	exports.sort = function(_, array, compare, beg, end) {
		return array ? array.sort_(_, compare, beg, end) : array;
	}
	/// 
	/// ## Object utility (obsolete)
	/// 
	/// This API is obsolete. Use `Object.keys(obj).forEach_` instead.
	/// 
	/// * `flows.eachKey(_, obj, fn)`  
	///   calls `fn(_, key, obj[key])` for every `key` in `obj`.
	exports.eachKey = function(_, obj, fn, thisObj) {
		return (obj ? Object.keys(obj) : []).forEach_(_, function(_, elt) {
			fn.call(thisObj, _, elt, obj[elt]);
		});
	}
	// deprecated -- don't document 
	exports.spray = function(fns, max) {
		return new

		function() {
			var funnel = exports.funnel(max);
			this.collect = function(_, count, trim) {
				return (function(callback) {
					if (typeof(callback) != "function") throw new Error("invalid call to collect: no callback")
					var results = trim ? [] : new Array(fns.length);
					count = count < 0 ? fns.length : Math.min(count, fns.length);
					if (count == 0) return callback(null, results);
					var collected = 0;
					for (var i = 0; i < fns.length; i++) {
						(function(i) {
							funnel(_ >> function(err, result) {
								if (err) return callback(err);
								if (trim) results.push(result);
								else results[i] = result;
								if (++collected == count) return callback(null, results);
							}, fns[i])
						})(i);
					}
				}).call(this, ~_)
			}
			this.collectOne = function(_) {
				var result = this.collect(_, 1, true);
				return result && result[0];
			}
			this.collectAll = function(_) {
				return this.collect(_, -1, false);
			}
		}

	}

	/// !doc
	/// ## funnel
	/// * `fun = flows.funnel(max)`  
	///   limits the number of concurrent executions of a given code block.
	/// 
	/// The `funnel` function is typically used with the following pattern:
	/// 
	/// ``` javascript
	/// // somewhere
	/// var myFunnel = flows.funnel(10); // create a funnel that only allows 10 concurrent executions.
	/// 
	/// // elsewhere
	/// myFunnel(_, function(_) { /* code with at most 10 concurrent executions */ });
	/// ```
	/// 
	/// The `diskUsage2.js` example demonstrates how these calls can be combined to control concurrent execution.
	/// 
	/// The `funnel` function can also be used to implement critical sections. Just set funnel's `max` parameter to 1.
	/// 
	/// If `max` is set to 0, a default number of parallel executions is allowed. 
	/// This default number can be read and set via `flows.funnel.defaultSize`.  
	/// If `max` is negative, the funnel does not limit the level of parallelism.
	/// 
	/// The funnel can be closed with `fun.close()`.  
	/// When a funnel is closed, the operations that are still in the funnel will continue but their callbacks
	/// won't be called, and no other operation will enter the funnel.
	exports.funnel = builtins.funnel;

	/// ## handshake and queue
	/// * `hs = flows.handshake()`  
	///   allocates a simple semaphore that can be used to do simple handshakes between two tasks.  
	///   The returned handshake object has two methods:  
	///   `hs.wait(_)`: waits until `hs` is notified.  
	///   `hs.notify()`: notifies `hs`.  
	///   Note: `wait` calls are not queued. An exception is thrown if wait is called while another `wait` is pending.
	exports.handshake = function() {
		var callback = null, notified = false;
		return {
			wait: _(function(cb) {
				if (callback) throw new Error("already waiting");
				if (notified) exports.setImmediate(cb);
				else callback = cb;
				notified = false;
			}, 0),
			notify: function() {
				if (!callback) notified = true;
				else exports.setImmediate(callback);
				callback = null;
			},
		};
	};

	/// * `q = flows.queue(options)`  
	///   allocates a queue which may be used to send data asynchronously between two tasks.  
	///   The returned queue has the following methods:  
	///   `data = q.read(_)`: dequeues an item from the queue. Waits if no element is available.  
	///   `q.write(_, data)`:  queues an item. Waits if the queue is full.  
	///   `ok = q.put(data)`: queues an item synchronously. Returns true if the queue accepted it, false otherwise. 
	///   `q.end()`: ends the queue. This is the synchronous equivalent of `q.write(_, undefined)`  
	///   The `max` option can be set to control the maximum queue length.  
	///   When `max` has been reached `q.put(data)` discards data and returns false.
	exports.queue = function(options) {
		options = options || {};
		var max = options.max != null ? options.max : -1;
		var callback = null, q = [], pendingWrites = [];
		return {
			read: _(function(cb) {
				if (callback) throw new Error("already getting");
				if (q.length > 0) {
					var item = q.shift();
					// recycle queue when empty to avoid maintaining arrays that have grown large and shrunk
					if (q.length === 0) q = [];
					exports.setImmediate(function() {
						cb(null, item);
					});
					if (pendingWrites.length > 0) {
						var wr = pendingWrites.shift();
						exports.setImmediate(function() {
							wr[0](null, wr[1]);
						});
					}
				} else {
					callback = cb;
				}
			}, 0),
			write: _(function(cb, item) {
				if (this.put(item)) {
					exports.setImmediate(function() {
						cb();
					});
				} else {
					pendingWrites.push([cb, item]);
				}
			}, 0),
			put: function(item, force) {
				if (!callback) {
					if (max >= 0 && q.length >= max && !force) return false;
					q.push(item);
				} else {
					var cb = callback;
					callback = null;
					exports.setImmediate(function() {
						cb(null, item);
					});
				}
				return true;
			},
			end: function() {
				this.put(undefined, true);
			},
		};
	};

	/// 
	/// ## Miscellaneous utilities
	/// * `results = flows.collect(_, futures)`  
	///   collects the results of an array of futures
	exports.collect = function(_, futures) {
		return futures && futures.map_(_, function(_, future) {
			return future(_);
		});
	}

	// Obsolete API - use require('streamline/lib/globals').context instead
	var globals = require("../globals");
	exports.setContext = function(ctx) {
		var old = globals.context;
		globals.context = ctx;
		return old;
	}
	exports.getContext = function() {
		return globals.context;
	}

	/// 
	/// * `result = flows.trampoline(_, fn, thisObj)`  
	///   Executes `fn(_)` through a trampoline.  
	///   Waits for `fn`'s result and returns it.  
	///   This is equivalent to calling `fn.call(thisObj, _)` but the current stack is unwound
	///   before calling `fn`.
	exports.trampoline = _(function(cb, fn, thisObj) {
		fn = globals.withContext(fn, globals.context);
		exports.setImmediate(function() {
			fn.call(thisObj, _ >> cb);
		});
	}, 0);

	/// 
	/// * `flows.setImmediate(fn)`  
	///   portable `setImmediate` both browser and server.  
	exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
		setTimeout(fn, 0);
	};

	/// 
	/// * `flows.nextTick(_)`  
	///   `nextTick` function for both browser and server.  
	///   Aliased to `process.nextTick` on the server side.
	var nextTick = typeof process === "object" && typeof process.nextTick === "function" ? process.nextTick : function(cb) {
		cb();
	};

	// document later
	exports.nextTick =  function(_) {
		nextTick(~_);
	};

	// document later
	// should probably cap millis instead of trying to be too smart 
	exports.setTimeout = function(fn, millis) {
		// node's setTimeout notifies immediately if millis > max!! 
		// So be safe and work around it. 
		// Gotcha: timeout cannot be cancelled beyond max.
		var max = 0x7fffffff;
		if (millis > max) {
			return setTimeout(function() {
				exports.setTimeout(fn, millis - max)
			}, max);
		} else {
			return setTimeout(function() {
				fn(!_);
			}, millis);
		}
	}

	// document later
	exports.setInterval = function(fn, millis) {
		return setInterval(function() {
			fn(!_);
		}, millis)
	}

	/// 
	/// * `flows.sleep(_, millis)`  
	///   Sleeps `millis` ms.  
	exports.sleep = function(_, millis) {
		return setTimeout(~_, millis)
	}

	exports.eventHandler = function(fn) {
		return function() {
			var that = this;
			var args = Array.prototype.slice(arguments, 0);
			return (function(_) {
				return fn.apply_(_, that, args, 0);
			})(_ >> function(err) {
				if (err) throw err;
			});
		};
	}

	//   Obsolete. Use `fn.apply_` instead.
	exports.apply = function apply(_, fn, thisObj, args, index) {
		return fn.apply_(_, thisObj, args, index);
	}

	/// 
	/// * `flows.callWithTimeout(_, fn, millis)`  
	///   Calls `fn(_)` with a timeout guard.  
	///   Throws a timeout exception if `fn` takes more than `millis` ms to complete.  
	exports.callWithTimeout = _(function(cb, fn, millis) {
			var tid = setTimeout(function() {
				if (cb) {
					var ex = new Error("timeout");
					ex.code = "ETIMEOUT";
					ex.errno = "ETIMEOUT";
					cb(ex);
					cb = null;
				}
			}, millis);
			fn(_ >> function(err, result) {
				if (cb) {
					clearTimeout(tid);
					cb(err, result);
					cb = null;
				}
			});
	}, 0);
	
})(typeof exports !== 'undefined' ? exports : (Streamline.flows = Streamline.flows || {}));
