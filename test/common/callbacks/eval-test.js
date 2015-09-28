(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
(function (process,global){
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
 * additional grant of patent rights can be found in the PATENTS file in
 * the same directory.
 */

!(function(global) {
  "use strict";

  var hasOwn = Object.prototype.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var iteratorSymbol =
    typeof Symbol === "function" && Symbol.iterator || "@@iterator";

  var inModule = typeof module === "object";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    if (inModule) {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = inModule ? module.exports : {};

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided, then outerFn.prototype instanceof Generator.
    var generator = Object.create((outerFn || Generator).prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype;
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  runtime.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  runtime.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `value instanceof AwaitArgument` to determine if the yielded value is
  // meant to be awaited. Some may consider the name of this method too
  // cutesy, but they are curmudgeons.
  runtime.awrap = function(arg) {
    return new AwaitArgument(arg);
  };

  function AwaitArgument(arg) {
    this.arg = arg;
  }

  function AsyncIterator(generator) {
    // This invoke function is written in a style that assumes some
    // calling function (or Promise) will handle exceptions.
    function invoke(method, arg) {
      var result = generator[method](arg);
      var value = result.value;
      return value instanceof AwaitArgument
        ? Promise.resolve(value.arg).then(invokeNext, invokeThrow)
        : Promise.resolve(value).then(function(unwrapped) {
            // When a yielded Promise is resolved, its final value becomes
            // the .value of the Promise<{value,done}> result for the
            // current iteration. If the Promise is rejected, however, the
            // result for this iteration will be rejected with the same
            // reason. Note that rejections of yielded Promises are not
            // thrown back into the generator function, as is the case
            // when an awaited Promise is rejected. This difference in
            // behavior between yield and await is important, because it
            // allows the consumer to decide what to do with the yielded
            // rejection (swallow it and continue, manually .throw it back
            // into the generator, abandon iteration, whatever). With
            // await, by contrast, there is no opportunity to examine the
            // rejection reason outside the generator function, so the
            // only option is to throw it from the await expression, and
            // let the generator function handle the exception.
            result.value = unwrapped;
            return result;
          });
    }

    if (typeof process === "object" && process.domain) {
      invoke = process.domain.bind(invoke);
    }

    var invokeNext = invoke.bind(generator, "next");
    var invokeThrow = invoke.bind(generator, "throw");
    var invokeReturn = invoke.bind(generator, "return");
    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return invoke(method, arg);
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : new Promise(function (resolve) {
          resolve(callInvokeWithMethodAndArg());
        });
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
    );

    return runtime.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          if (method === "return" ||
              (method === "throw" && delegate.iterator[method] === undefined)) {
            // A return or throw (when the delegate iterator has no throw
            // method) always terminates the yield* loop.
            context.delegate = null;

            // If the delegate iterator has a return method, give it a
            // chance to clean up.
            var returnMethod = delegate.iterator["return"];
            if (returnMethod) {
              var record = tryCatch(returnMethod, delegate.iterator, arg);
              if (record.type === "throw") {
                // If the return method threw an exception, let that
                // exception prevail over the original return or throw.
                method = "throw";
                arg = record.arg;
                continue;
              }
            }

            if (method === "return") {
              // Continue with the outer return, now that the delegate
              // iterator has been terminated.
              continue;
            }
          }

          var record = tryCatch(
            delegate.iterator[method],
            delegate.iterator,
            arg
          );

          if (record.type === "throw") {
            context.delegate = null;

            // Like returning generator.throw(uncaught), but without the
            // overhead of an extra function call.
            method = "throw";
            arg = record.arg;
            continue;
          }

          // Delegate generator ran and handled its own exceptions so
          // regardless of what the method was, we continue as if it is
          // "next" with an undefined arg.
          method = "next";
          arg = undefined;

          var info = record.arg;
          if (info.done) {
            context[delegate.resultName] = info.value;
            context.next = delegate.nextLoc;
          } else {
            state = GenStateSuspendedYield;
            return info;
          }

          context.delegate = null;
        }

        if (method === "next") {
          if (state === GenStateSuspendedYield) {
            context.sent = arg;
          } else {
            context.sent = undefined;
          }

        } else if (method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw arg;
          }

          if (context.dispatchException(arg)) {
            // If the dispatched exception was caught by a catch block,
            // then let that catch block handle the exception normally.
            method = "next";
            arg = undefined;
          }

        } else if (method === "return") {
          context.abrupt("return", arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          var info = {
            value: record.arg,
            done: context.done
          };

          if (record.arg === ContinueSentinel) {
            if (context.delegate && method === "next") {
              // Deliberately forget the last sent value so that we don't
              // accidentally pass it on to the delegate.
              arg = undefined;
            }
          } else {
            return info;
          }

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(arg) call above.
          method = "throw";
          arg = record.arg;
        }
      }
    };
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  runtime.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      this.sent = undefined;
      this.done = false;
      this.delegate = null;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;
        return !!caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.next = finallyEntry.finallyLoc;
      } else {
        this.complete(record);
      }

      return ContinueSentinel;
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = record.arg;
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      return ContinueSentinel;
    }
  };
})(
  // Among the various tricks for obtaining a reference to the global
  // object, this seems to be the most reliable technique that does not
  // use indirect eval (which violates Content Security Policy).
  typeof global === "object" ? global :
  typeof window === "object" ? window :
  typeof self === "object" ? self : this
);

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":1}],3:[function(require,module,exports){
var regeneratorRuntime = require("regenerator/runtime");

var _streamline = require("streamline-runtime/lib/runtime-callbacks");

var _filename = "builtins._js";

require("streamline-runtime/lib/builtins-callbacks");

/**
 * Copyright (c) 2012 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */
/// !doc
///
/// # Streamline built-ins

(function (exports) {
	var _parallel = function _parallel(options) {
		if (typeof options === "number") return options;
		if (typeof options.parallel === "number") return options.parallel;
		return options.parallel ? -1 : 1;
	};

	"use strict";
	var VERSION = 3;

	var future = function (fn, args, i) {
		var err,
		    result,
		    done,
		    q = [],
		    self = this;
		args = Array.prototype.slice.call(args);
		args[i] = function (e, r) {
			err = e;
			result = r;
			done = true;
			q && q.forEach(function (f) {
				f.call(self, e, r);
			});
			q = null;
		};
		fn.apply(this, args);
		return function F(cb) {
			if (!cb) return F;
			if (done) cb.call(self, err, result);else q.push(cb);
		};
	};

	// Do not use this one directly, require it through the flows module.
	exports.funnel = function (max) {
		max = max == null ? -1 : max;
		if (max === 0) max = funnel.defaultSize;
		if (typeof max !== "number") throw new Error("bad max number: " + max);
		var queue = [],
		    active = 0,
		    closed = false;

		var fun = function (callback, fn) {
			var _doOne = function _doOne() {
				var current = queue.splice(0, 1)[0];
				if (!current.cb) return current.fn();
				active++;
				current.fn(function (err, result) {
					active--;
					if (!closed) {
							current.cb(err, result);
							while (active < max && queue.length > 0) _doOne();
						}
				});
			};

			if (callback == null) return future(fun, arguments, 0);
			//console.log("FUNNEL: active=" + active + ", queued=" + queue.length);
			if (max < 0 || max === Infinity) return fn(callback);

			queue.push({
				fn: fn,
				cb: callback
			});

			while (active < max && queue.length > 0) _doOne();
		};

		fun.close = function () {
			queue = [];
			closed = true;
		};
		return fun;
	};
	var funnel = exports.funnel;
	funnel.defaultSize = 4;

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
		value: _streamline.async(regeneratorRuntime.mark(function _$$value$$(_, options, fn, thisObj) {
			var par, len, i;
			return regeneratorRuntime.wrap(function _$$value$$$(context$2$0) {
				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						if (typeof options === "function") {
								thisObj = fn;
								fn = options;
								options = 1;
							}
						par = _parallel(options);

						thisObj = thisObj !== undefined ? thisObj : this;
						len = this.length;

						if (!(par === 1 || len <= 1)) {
							context$2$0.next = 15;
							break;
						}

						i = 0;

					case 6:
						if (!(i < len)) {
							context$2$0.next = 13;
							break;
						}

						if (!has.call(this, i)) {
							context$2$0.next = 10;
							break;
						}

						context$2$0.next = 10;
						return _streamline.await(_filename, 137, fn, "call", 1, null, false)(thisObj, true, this[i], i, this);

					case 10:
						i++;
						context$2$0.next = 6;
						break;

					case 13:
						context$2$0.next = 17;
						break;

					case 15:
						context$2$0.next = 17;
						return _streamline.await(_filename, 140, this, "map_", 0, null, false)(true, par, fn, thisObj);

					case 17:
						return context$2$0.abrupt("return", this);

					case 18:
					case "end":
						return context$2$0.stop();
				}
			}, _$$value$$, this);
		}), 0, 4)
	});
	Array.prototype.forEach_.version_ = VERSION;
	/// * `result = array.map_(_[, options], fn[, thisObj])` 
	///   `fn` is called as `fn(_, elt, i, array)`.
	delete Array.prototype.map_;
	Object.defineProperty(Array.prototype, 'map_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: _streamline.async(regeneratorRuntime.mark(function _$$value$$2(_, options, fn, thisObj) {
			var par, len, result, i, fun;
			return regeneratorRuntime.wrap(function _$$value$$2$(context$2$0) {
				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						if (typeof options === "function") {
								thisObj = fn;
								fn = options;
								options = 1;
							}
						par = _parallel(options);

						thisObj = thisObj !== undefined ? thisObj : this;
						len = this.length;

						if (!(par === 1 || len <= 1)) {
							context$2$0.next = 17;
							break;
						}

						result = new Array(len);
						i = 0;

					case 7:
						if (!(i < len)) {
							context$2$0.next = 15;
							break;
						}

						if (!has.call(this, i)) {
							context$2$0.next = 12;
							break;
						}

						context$2$0.next = 11;
						return _streamline.await(_filename, 166, fn, "call", 1, null, false)(thisObj, true, this[i], i, this);

					case 11:
						result[i] = context$2$0.sent;

					case 12:
						i++;
						context$2$0.next = 7;
						break;

					case 15:
						context$2$0.next = 28;
						break;

					case 17:
						fun = funnel(par);

						result = this.map(function (elt, i, arr) {
							return _streamline.future(_filename, 171, null, fun, 0, null, false)(false, _streamline.async(regeneratorRuntime.mark(function _$$$$(_) {
								return regeneratorRuntime.wrap(function _$$$$$(context$4$0) {
									while (1) switch (context$4$0.prev = context$4$0.next) {
										case 0:
											context$4$0.next = 2;
											return _streamline.await(_filename, null, fn, "call", 1, null, false)(thisObj, true, elt, i, arr);

										case 2:
											return context$4$0.abrupt("return", context$4$0.sent);

										case 3:
										case "end":
											return context$4$0.stop();
									}
								}, _$$$$, this);
							}), 0, 1));
						});
						i = 0;

					case 20:
						if (!(i < len)) {
							context$2$0.next = 28;
							break;
						}

						if (!has.call(this, i)) {
							context$2$0.next = 25;
							break;
						}

						context$2$0.next = 24;
						return _streamline.await(_filename, 176, result, i, 0, null, false)(true);

					case 24:
						result[i] = context$2$0.sent;

					case 25:
						i++;
						context$2$0.next = 20;
						break;

					case 28:
						return context$2$0.abrupt("return", result);

					case 29:
					case "end":
						return context$2$0.stop();
				}
			}, _$$value$$2, this);
		}), 0, 4)
	});
	/// * `result = array.filter_(_[, options], fn[, thisObj])` 
	///   `fn` is called as `fn(_, elt, i, array)`.
	delete Array.prototype.filter_;
	Object.defineProperty(Array.prototype, 'filter_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: _streamline.async(regeneratorRuntime.mark(function _$$value$$3(_, options, fn, thisObj) {
			var par, result, len, i, elt;
			return regeneratorRuntime.wrap(function _$$value$$3$(context$2$0) {
				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						if (typeof options === "function") {
								thisObj = fn;
								fn = options;
								options = 1;
							}
						par = _parallel(options);

						thisObj = thisObj !== undefined ? thisObj : this;
						result = [];
						len = this.length;

						if (!(par === 1 || len <= 1)) {
							context$2$0.next = 19;
							break;
						}

						i = 0;

					case 7:
						if (!(i < len)) {
							context$2$0.next = 17;
							break;
						}

						if (!has.call(this, i)) {
							context$2$0.next = 14;
							break;
						}

						elt = this[i];
						context$2$0.next = 12;
						return _streamline.await(_filename, 203, fn, "call", 1, null, false)(thisObj, true, elt, i, this);

					case 12:
						if (!context$2$0.sent) {
							context$2$0.next = 14;
							break;
						}

						result.push(elt);

					case 14:
						i++;
						context$2$0.next = 7;
						break;

					case 17:
						context$2$0.next = 21;
						break;

					case 19:
						context$2$0.next = 21;
						return _streamline.await(_filename, 207, this, "map_", 0, null, false)(true, par, _streamline.async(regeneratorRuntime.mark(function _$$$$2(_, elt, i, arr) {
							return regeneratorRuntime.wrap(function _$$$$2$(context$3$0) {
								while (1) switch (context$3$0.prev = context$3$0.next) {
									case 0:
										context$3$0.next = 2;
										return _streamline.await(_filename, null, fn, "call", 1, null, false)(thisObj, true, elt, i, arr);

									case 2:
										if (!context$3$0.sent) {
											context$3$0.next = 4;
											break;
										}

										result.push(elt);

									case 4:
									case "end":
										return context$3$0.stop();
								}
							}, _$$$$2, this);
						}), 0, 4), thisObj);

					case 21:
						return context$2$0.abrupt("return", result);

					case 22:
					case "end":
						return context$2$0.stop();
				}
			}, _$$value$$3, this);
		}), 0, 4)
	});
	/// * `bool = array.every_(_[, options], fn[, thisObj])` 
	///   `fn` is called as `fn(_, elt, i, array)`.
	delete Array.prototype.every_;
	Object.defineProperty(Array.prototype, 'every_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: _streamline.async(regeneratorRuntime.mark(function _$$value$$4(_, options, fn, thisObj) {
			var par, len, i, fun, futures;
			return regeneratorRuntime.wrap(function _$$value$$4$(context$2$0) {
				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						if (typeof options === "function") {
								thisObj = fn;
								fn = options;
								options = 1;
							}
						par = _parallel(options);

						thisObj = thisObj !== undefined ? thisObj : this;
						len = this.length;

						if (!(par === 1 || len <= 1)) {
							context$2$0.next = 19;
							break;
						}

						i = 0;

					case 6:
						if (!(i < len)) {
							context$2$0.next = 17;
							break;
						}

						context$2$0.t0 = has.call(this, i);

						if (!context$2$0.t0) {
							context$2$0.next = 12;
							break;
						}

						context$2$0.next = 11;
						return _streamline.await(_filename, 233, fn, "call", 1, null, false)(thisObj, true, this[i], i, this);

					case 11:
						context$2$0.t0 = !context$2$0.sent;

					case 12:
						if (!context$2$0.t0) {
							context$2$0.next = 14;
							break;
						}

						return context$2$0.abrupt("return", false);

					case 14:
						i++;
						context$2$0.next = 6;
						break;

					case 17:
						context$2$0.next = 34;
						break;

					case 19:
						fun = funnel(par);
						futures = this.map(function (elt, i, arr) {
							return _streamline.future(_filename, 238, null, fun, 0, null, false)(false, _streamline.async(regeneratorRuntime.mark(function _$$$$3(_) {
								return regeneratorRuntime.wrap(function _$$$$3$(context$4$0) {
									while (1) switch (context$4$0.prev = context$4$0.next) {
										case 0:
											context$4$0.next = 2;
											return _streamline.await(_filename, null, fn, "call", 1, null, false)(thisObj, true, elt, i, arr);

										case 2:
											return context$4$0.abrupt("return", context$4$0.sent);

										case 3:
										case "end":
											return context$4$0.stop();
									}
								}, _$$$$3, this);
							}), 0, 1));
						});
						i = 0;

					case 22:
						if (!(i < len)) {
							context$2$0.next = 34;
							break;
						}

						context$2$0.t1 = has.call(this, i);

						if (!context$2$0.t1) {
							context$2$0.next = 28;
							break;
						}

						context$2$0.next = 27;
						return _streamline.await(_filename, 243, futures, i, 0, null, false)(true);

					case 27:
						context$2$0.t1 = !context$2$0.sent;

					case 28:
						if (!context$2$0.t1) {
							context$2$0.next = 31;
							break;
						}

						fun.close();
						return context$2$0.abrupt("return", false);

					case 31:
						i++;
						context$2$0.next = 22;
						break;

					case 34:
						return context$2$0.abrupt("return", true);

					case 35:
					case "end":
						return context$2$0.stop();
				}
			}, _$$value$$4, this);
		}), 0, 4)
	});
	/// * `bool = array.some_(_[, options], fn[, thisObj])` 
	///   `fn` is called as `fn(_, elt, i, array)`.
	delete Array.prototype.some_;
	Object.defineProperty(Array.prototype, 'some_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: _streamline.async(regeneratorRuntime.mark(function _$$value$$5(_, options, fn, thisObj) {
			var par, len, i, fun, futures;
			return regeneratorRuntime.wrap(function _$$value$$5$(context$2$0) {
				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						if (typeof options === "function") {
								thisObj = fn;
								fn = options;
								options = 1;
							}
						par = _parallel(options);

						thisObj = thisObj !== undefined ? thisObj : this;
						len = this.length;

						if (!(par === 1 || len <= 1)) {
							context$2$0.next = 19;
							break;
						}

						i = 0;

					case 6:
						if (!(i < len)) {
							context$2$0.next = 17;
							break;
						}

						context$2$0.t0 = has.call(this, i);

						if (!context$2$0.t0) {
							context$2$0.next = 12;
							break;
						}

						context$2$0.next = 11;
						return _streamline.await(_filename, 270, fn, "call", 1, null, false)(thisObj, true, this[i], i, this);

					case 11:
						context$2$0.t0 = context$2$0.sent;

					case 12:
						if (!context$2$0.t0) {
							context$2$0.next = 14;
							break;
						}

						return context$2$0.abrupt("return", true);

					case 14:
						i++;
						context$2$0.next = 6;
						break;

					case 17:
						context$2$0.next = 34;
						break;

					case 19:
						fun = funnel(par);
						futures = this.map(function (elt, i, arr) {
							return _streamline.future(_filename, 275, null, fun, 0, null, false)(false, _streamline.async(regeneratorRuntime.mark(function _$$$$4(_) {
								return regeneratorRuntime.wrap(function _$$$$4$(context$4$0) {
									while (1) switch (context$4$0.prev = context$4$0.next) {
										case 0:
											context$4$0.next = 2;
											return _streamline.await(_filename, null, fn, "call", 1, null, false)(thisObj, true, elt, i, arr);

										case 2:
											return context$4$0.abrupt("return", context$4$0.sent);

										case 3:
										case "end":
											return context$4$0.stop();
									}
								}, _$$$$4, this);
							}), 0, 1));
						});
						i = 0;

					case 22:
						if (!(i < len)) {
							context$2$0.next = 34;
							break;
						}

						context$2$0.t1 = has.call(this, i);

						if (!context$2$0.t1) {
							context$2$0.next = 28;
							break;
						}

						context$2$0.next = 27;
						return _streamline.await(_filename, 280, futures, i, 0, null, false)(true);

					case 27:
						context$2$0.t1 = context$2$0.sent;

					case 28:
						if (!context$2$0.t1) {
							context$2$0.next = 31;
							break;
						}

						fun.close();
						return context$2$0.abrupt("return", true);

					case 31:
						i++;
						context$2$0.next = 22;
						break;

					case 34:
						return context$2$0.abrupt("return", false);

					case 35:
					case "end":
						return context$2$0.stop();
				}
			}, _$$value$$5, this);
		}), 0, 4)
	});
	/// * `result = array.reduce_(_, fn, val[, thisObj])` 
	///   `fn` is called as `val = fn(_, val, elt, i, array)`.
	delete Array.prototype.reduce_;
	Object.defineProperty(Array.prototype, 'reduce_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: _streamline.async(regeneratorRuntime.mark(function _$$value$$6(_, fn, v, thisObj) {
			var len, i;
			return regeneratorRuntime.wrap(function _$$value$$6$(context$2$0) {
				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						thisObj = thisObj !== undefined ? thisObj : this;
						len = this.length;
						i = 0;

					case 3:
						if (!(i < len)) {
							context$2$0.next = 11;
							break;
						}

						if (!has.call(this, i)) {
							context$2$0.next = 8;
							break;
						}

						context$2$0.next = 7;
						return _streamline.await(_filename, 300, fn, "call", 1, null, false)(thisObj, true, v, this[i], i, this);

					case 7:
						v = context$2$0.sent;

					case 8:
						i++;
						context$2$0.next = 3;
						break;

					case 11:
						return context$2$0.abrupt("return", v);

					case 12:
					case "end":
						return context$2$0.stop();
				}
			}, _$$value$$6, this);
		}), 0, 4)
	});
	/// * `result = array.reduceRight_(_, fn, val[, thisObj])` 
	///   `fn` is called as `val = fn(_, val, elt, i, array)`.
	delete Array.prototype.reduceRight_;
	Object.defineProperty(Array.prototype, 'reduceRight_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: _streamline.async(regeneratorRuntime.mark(function _$$value$$7(_, fn, v, thisObj) {
			var len, i;
			return regeneratorRuntime.wrap(function _$$value$$7$(context$2$0) {
				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						thisObj = thisObj !== undefined ? thisObj : this;
						len = this.length;
						i = len - 1;

					case 3:
						if (!(i >= 0)) {
							context$2$0.next = 11;
							break;
						}

						if (!has.call(this, i)) {
							context$2$0.next = 8;
							break;
						}

						context$2$0.next = 7;
						return _streamline.await(_filename, 316, fn, "call", 1, null, false)(thisObj, true, v, this[i], i, this);

					case 7:
						v = context$2$0.sent;

					case 8:
						i--;
						context$2$0.next = 3;
						break;

					case 11:
						return context$2$0.abrupt("return", v);

					case 12:
					case "end":
						return context$2$0.stop();
				}
			}, _$$value$$7, this);
		}), 0, 4)
	});

	/// * `array = array.sort_(_, compare [, beg [, end]])` 
	///   `compare` is called as `cmp = compare(_, elt1, elt2)`. 
	///   Note: this function _changes_ the original array (and returns it).
	delete Array.prototype.sort_;
	Object.defineProperty(Array.prototype, 'sort_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: _streamline.async(regeneratorRuntime.mark(function _$$value$$8(_, compare, beg, end) {
			var _qsort, array;

			return regeneratorRuntime.wrap(function _$$value$$8$(context$2$0) {
				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						_qsort = _streamline.async(regeneratorRuntime.mark(function _$$_qsort$$(_, beg, end) {
							var tmp, mid, o, nbeg, nend;
							return regeneratorRuntime.wrap(function _$$_qsort$$$(context$3$0) {
								while (1) switch (context$3$0.prev = context$3$0.next) {
									case 0:
										if (!(beg >= end)) {
											context$3$0.next = 2;
											break;
										}

										return context$3$0.abrupt("return");

									case 2:
										if (!(end === beg + 1)) {
											context$3$0.next = 11;
											break;
										}

										context$3$0.next = 5;
										return _streamline.await(_filename, 340, null, compare, 0, null, false)(true, array[beg], array[end]);

									case 5:
										context$3$0.t0 = context$3$0.sent;

										if (!(context$3$0.t0 > 0)) {
											context$3$0.next = 10;
											break;
										}

										tmp = array[beg];
										array[beg] = array[end];
										array[end] = tmp;

									case 10:
										return context$3$0.abrupt("return");

									case 11:
										mid = Math.floor((beg + end) / 2);
										o = array[mid];
										nbeg = beg;
										nend = end;

									case 15:
										if (!(nbeg <= nend)) {
											context$3$0.next = 39;
											break;
										}

									case 16:
										context$3$0.t1 = nbeg < end;

										if (!context$3$0.t1) {
											context$3$0.next = 22;
											break;
										}

										context$3$0.next = 20;
										return _streamline.await(_filename, 354, null, compare, 0, null, false)(true, array[nbeg], o);

									case 20:
										context$3$0.t2 = context$3$0.sent;
										context$3$0.t1 = context$3$0.t2 < 0;

									case 22:
										if (!context$3$0.t1) {
											context$3$0.next = 26;
											break;
										}

										nbeg++;
										context$3$0.next = 16;
										break;

									case 26:
										context$3$0.t3 = beg < nend;

										if (!context$3$0.t3) {
											context$3$0.next = 32;
											break;
										}

										context$3$0.next = 30;
										return _streamline.await(_filename, 355, null, compare, 0, null, false)(true, o, array[nend]);

									case 30:
										context$3$0.t4 = context$3$0.sent;
										context$3$0.t3 = context$3$0.t4 < 0;

									case 32:
										if (!context$3$0.t3) {
											context$3$0.next = 36;
											break;
										}

										nend--;

										context$3$0.next = 26;
										break;

									case 36:
										if (nbeg <= nend) {
												tmp = array[nbeg];
												array[nbeg] = array[nend];
												array[nend] = tmp;
												nbeg++;
												nend--;
											}
										context$3$0.next = 15;
										break;

									case 39:
										if (!(nbeg < end)) {
											context$3$0.next = 42;
											break;
										}

										context$3$0.next = 42;
										return _streamline.await(_filename, 366, null, _qsort, 0, null, false)(true, nbeg, end);

									case 42:
										if (!(beg < nend)) {
											context$3$0.next = 45;
											break;
										}

										context$3$0.next = 45;
										return _streamline.await(_filename, 367, null, _qsort, 0, null, false)(true, beg, nend);

									case 45:
									case "end":
										return context$3$0.stop();
								}
							}, _$$_qsort$$, this);
						}), 0, 3);
						array = this;

						beg = beg || 0;
						end = end == null ? array.length - 1 : end;

						context$2$0.next = 6;
						return _streamline.await(_filename, 369, null, _qsort, 0, null, false)(true, beg, end);

					case 6:
						return context$2$0.abrupt("return", array);

					case 7:
					case "end":
						return context$2$0.stop();
				}
			}, _$$value$$8, this);
		}), 0, 4)
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
		value: function (callback, thisObj, args, index) {
			args = Array.prototype.slice.call(args, 0);
			args.splice(index != null && index >= 0 ? index : args.length, 0, callback);
			return this.apply(thisObj, args);
		}
	});
})(typeof exports !== 'undefined' ? exports : Streamline.builtins = Streamline.builtins || {});
///
},{"regenerator/runtime":2,"streamline-runtime/lib/builtins-callbacks":3,"streamline-runtime/lib/runtime-callbacks":5}],4:[function(require,module,exports){
"use strict";

var util = require('./util');

module.exports = function(file, line, object, property, index) {
	var bound = typeof property !== "function";
	var fn = bound ? object[property] : property;
	var self = bound ? object : this;
	if (typeof fn !== "function") throw new Error("cannot create future", "function", fn);
	return function futured() {
		var err, result, done, q = [];
		var args = Array.prototype.slice.call(arguments);
		var callback = function(e, r) {
			//if (e) console.error(e);
			err = e;
			result = r;
			done = true;
			q && q.forEach(function(f) {
				if (sync) {
					setImmediate(function() {
						f.call(self, e, r);
					});
				} else {
					f.call(self, e, r);					
				}
			});
			q = null;
		};
		args[index] = callback; 
		var sync = true;
		fn.apply(self, args);
		sync = false;
		var future = function(cb) {
			if (typeof cb !== "function") throw argError(fn.name, index, "function", cb);
			if (done) {
				cb.call(self, err, result);
			}
			else q.push(cb);
		};
		// computed property so that we don't allocate promise if we don't need to
		Object.defineProperty(future, 'promise', {
			get: function() {
				return new Promise(function(resolve, reject) {
					if (done) {
						if (err) reject(err);
						else resolve(result);
					} else {
						q.push(function(e, r) {
							if (e) reject(e);
							else resolve(r);
						})
					}
				});
			}
		});
		return future;
	};
}

},{"./util":6}],5:[function(require,module,exports){
var regeneratorRuntime = require('regenerator/runtime');

var link = function link(src, name, dst) {
	Object.defineProperty(src, name, {
		configurable: false,
		writable: true,
		enumerable: false,
		value: dst
	});
	return dst;
};

var makeArgs = function makeArgs(i) {
	if (i <= 0) return "";
	return i > 1 ? makeArgs(i - 1) + ', a' + i : "a1";
};

var isGenerator = function isGenerator(val) {
	return val && (Object.prototype.toString.call(val) === "[object Generator]" || val.toString() === "[object Generator]");
};

var Frame = function Frame(g) {
	this.g = g;
	this.prev = glob.frame;
	g.frame = this;
	this.name = glob.calling || "unknown";
	this.file = "unknown";
	this.line = 0;
	this.recurse = 0;
	this.yielded = 0;
};

var pushFrame = function pushFrame(g) {
	glob.frame = g.frame || new Frame(g);
	if (glob.emitter) glob.emitter.emit('enter', g.frame);
};

var popFrame = function popFrame(g) {
	if (!glob.frame) return;
	if (glob.emitter) glob.emitter.emit('exit', g.frame);
	glob.frame = glob.frame.prev;
};

var run = function run(g, cb, options) {
	var rsm = glob.resume;
	var emit = function (ev, g) {
		g.frame = g.frame || new Frame(g);
		if (glob.emitter) glob.emitter.emit(ev, g.frame);
	};

	try {
		glob.resume = function (err, val) {
			if (glob.yielded) {
					emit("resume", g);
					glob.yielded = false;
				}
			while (g) {
				if (options && options.interrupt && options.interrupt()) return;
				try {
					// ES6 is deprecating send in favor of next. Following line makes us compatible with both.
					var send = g.send || g.next;
					var v = err ? g.throw(err) : send.call(g, val);
					val = v.value;
					err = null;
					// if we get PENDING, the current call completed with a pending I/O
					// resume will be called again when the I/O completes. So just save the context and return here.
					if (val === glob.PENDING) {
							if (!glob.yielded) {
									emit("yield", g);
									glob.yielded = true;
								}
							return;
						}
					// if we get [PENDING, e, r], the current call invoked its callback synchronously
					// we just loop to send/throw what the callback gave us.
					if (val && val[0] === glob.PENDING) {
							err = val[1];
							val = val[2];
							if (err) err = wrapError(err, g, glob.resume);
						}
						// else, if g is done we unwind it we send val to the parent generator (or through cb if we are at the top)
					else if (v.done) {
								//g.close();
								popFrame(g);
								g = g.prev;
							}
							// else if val is not a generator we have an error. Yield was not applied to a generators
						else {
								if (!isGenerator(val)) {
										throw new Error("invalid value was yielded. Expected a generator, got " + val);
									}
								// we got a new generator which means that g called another generator function
								// the new generator become current and we loop with g.send(undefined) (equiv to g.next())
								val.prev = g;
								g = val;
								pushFrame(g);
								val = undefined;
							}
				} catch (ex) {
					// the send/throw call failed.
					// we unwind the current generator and we rethrow into the parent generator (or through cb if at the top)
					//g.close();
					err = wrapError(ex, g, glob.resume);
					popFrame(g);
					g = g.prev;
					val = undefined;
				}
			}
			// we have exhausted the stack of generators.
			// return the result or error through the callback.
			cb(err, val);
		};

		// start the resume loop
		glob.resume();
	} finally {
		// restore resume global
		glob.resume = rsm;
	}
};

var mapResults = function mapResults(options, args) {
	if (options && typeof options === "object") {
			if (options.returnArray) return args;
			if (options.returnObject) return options.returnObject.reduce(function (res, key, i) {
				res[key] = args[i];
				return res;
			}, {});
		}
	return args[0];
};

var getTag = function getTag(options, idx) {
	if (options && typeof options === "object") {
			if (options.returnArray) return "A" + idx;
			if (options.returnObject) return "O" + options.returnObject.join('/') + idx;
		}
	return idx;
};

var invoke = function invoke(that, fn, args, idx, options) {
	if (fn['__unstarred__' + idx]) throw new Error("cannot invoke starred function: " + fn['__unstarred__' + idx]);
	// Set things up so that call returns:
	// * PENDING if it completes with a pending I/O (and cb will be called later)
	// * [PENDING, e, r] if the callback is called synchronously.
	var result = glob.PENDING,
	    sync = true;
	var rsm = glob.resume;

	// convert args to array so that args.length gets correctly set if idx is args.length
	args = Array.prototype.slice.call(args, 0);
	var cx = glob.context;
	var callback = function (e, r) {
		var oldContext = glob.context;
		var oldResume = glob.resume;
		try {
			if (options) r = mapResults(options, Array.prototype.slice.call(arguments, 1));
			glob.context = cx;
			glob.resume = rsm;
			if (sync) {
					result = [glob.PENDING, e, r];
				} else {
					glob.resume(e, r);
				}
		} finally {
			glob.context = oldContext;
			glob.resume = oldResume;
		}
	};
	if (options.errbackIndex != null) {
			args[idx] = function (r) {
				callback(null, r);
			};
			args[options.errbackIndex] = function (e) {
				callback(e);
			};
		} else {
			args[idx == null ? args.length : idx] = callback;
		}
	fn.apply(that, args);
	sync = false;
	return result;
};

var makeStarror = function makeStarror(i) {
	return eval("(function(fn, options)" + starBody.replace(/function\s*\*\s*\(\)/, "function*(" + makeArgs(i) + ")") + ")");
};

var star = function star(fn, idx, arity) {
	var i = arity != null ? arity : fn.length;
	var starror = starrors[i] || (starrors[i] = makeStarror(i));
	return starror(fn, idx);
};

var makeUnstarror = function makeUnstarror(i) {
	return eval("(function(fn, options)" + unstarBody.replace(/function\s*F\(\)/, "function F(" + makeArgs(i) + ")") + ")");
};

var unstar = function unstar(fn, idx, arity) {
	var i = arity != null ? arity : idx == null ? fn.length + 1 : fn.length;
	var unstarror = unstarrors[i] || (unstarrors[i] = makeUnstarror(i));
	return unstarror(fn, idx);
};

var wrapError = function wrapError(err, g, resume) {
	if (!(err instanceof Error)) return err; // handle throw "some string";
	if (err.__frame__) return err;
	err = Object.create(err);
	err.__frame__ = glob.frame;
	Object.defineProperty(err, 'stack', {
		get: function () {
			return stackTrace(this);
		}
	});
	return err;
};

var stackTrace = function stackTrace(err) {
	var extra;
	var starredStack = "";
	var frame;
	while (frame = err.__frame__) {
		for (frame = frame.prev; frame; frame = frame.prev) {
			var m = /\$\$(.*)\$\$/.exec(frame.name);
			var fname = m && m[1] || "unknown";
			starredStack += '    at ' + fname + ' (' + frame.file + ':' + frame.line + ')\n';
		}
		err = Object.getPrototypeOf(err);
	}
	var rawStack = Object.getOwnPropertyDescriptor(new Error(), 'stack').get.call(err);
	var cut = rawStack.indexOf('    at GeneratorFunctionPrototype');
	if (cut < 0) cut = rawStack.indexOf('\n') + 1;
	var result = rawStack.substring(0, cut).replace(/\n.*regenerator.runtime.*/g, '') + //
	'    <<< yield stack >>>\n' + starredStack + //
	'    <<< raw stack >>>\n' + rawStack.substring(cut);
	return result;
};

"use strict";
/**
 * Copyright (c) 2013 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */
var util = require('./util');
var glob = util.getGlobals('generators');

if (typeof glob.yielded === "undefined") glob.yielded = true;
glob.PENDING = glob.PENDING || {};

Object.defineProperty(Frame.prototype, "info", {
	get: function () {
		return this;
	}
});

var starTemplate = function (fn, options) {
	var idx = options && typeof options === 'object' ? options.callbackIndex : options;
	var idx2 = idx < 0 ? -(idx + 1) : idx;
	var tag = getTag(options, idx);

	if (options && options.file) {
			var frame = glob.frame;
			if (frame) {
					frame.file = options.file;
					frame.line = options.line;
				}
			// we pass the name of the function via a global - would be great if JS had an API to get generator function from generator
			glob.calling = fn.__name__ || fn.name;
		}
	var key = '__starred__' + tag;
	if (fn[key]) return fn[key];

	//if (idx == null) idx = fn.length - 1;
	var F = regeneratorRuntime.mark(function callee$1$0() {
		var args$2$0 = arguments;
		return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					if (idx < 0) Array.prototype.splice.call(args$2$0, idx2, 0, null);
					context$2$0.next = 3;
					return invoke(this, fn, args$2$0, idx2, options);

				case 3:
					return context$2$0.abrupt('return', context$2$0.sent);

				case 4:
				case 'end':
					return context$2$0.stop();
			}
		}, callee$1$0, this);
	});
	link(F, '__unstarred__' + tag, fn);
	link(fn, key, F);
	return F;
};

var starBody = starTemplate.toString();
starBody = starBody.substring(starBody.indexOf('{'));
var starrors = [];

var unstarTemplate = function (fn, options) {
	var idx = options && typeof options === 'object' ? options.callbackIndex : options;
	if (idx == null) idx = fn.length;
	var idx2 = idx < 0 ? -(idx + 1) : idx;

	var key = '__unstarred__' + idx;
	if (fn[key]) return fn[key];

	var F = function F() {
		var cb = arguments[idx2];
		if (idx < 0) Array.prototype.splice.call(arguments, idx2, 1);
		if (typeof cb !== "function") {
				// if cb is false, return a future
				if (cb === false) return exports.future("(future)", 0, null, F, idx2)(arguments);
				throw util.argError(fn.name, idx, "function", typeof cb);
			}
		var g = fn.apply(this, arguments);
		run.call(this, g, cb);
	};
	link(F, '__starred__' + idx, fn);
	link(fn, key, F);
	// track the original name for stack frames
	F.__name__ = fn.name;
	return F;
};

var unstarBody = unstarTemplate.toString();
unstarBody = unstarBody.substring(unstarBody.indexOf('{'));
var unstarrors = [];

exports.await = function (file, line, object, property, index1, index2, returnArray) {
	var bound = typeof property !== "function";
	var that = bound ? object : null;
	var fn = bound ? object[property] : property;
	if (typeof fn !== "function") throw util.typeError("cannot call", "function", fn);
	return star(fn, {
		file: file,
		line: line,
		callbackIndex: index1,
		errbackIndex: index2,
		returnArray: returnArray
	}).bind(that);
};

exports.async = function (fn, index, arity) {
	if (typeof fn !== "function") throw util.typeError("cannot wrap function", "function", fn);
	var unstarred = unstar(fn, index, arity);
	unstarred["awaitWrapper-" + index + "-null-false"] = fn;
	return unstarred;
};

exports.new = function (file, line, constructor, index) {
	if (typeof constructor !== "function") throw util.typeError("cannot instantiate", "function", constructor);
	var starred = star(constructor, index);
	var key = '__new__' + index;
	if (starred[key]) return starred[key];

	var F = regeneratorRuntime.mark(function callee$1$0() {
		var that,
		    args$2$0 = arguments;
		return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					that = Object.create((index != null ? starred['__unstarred__' + index] : starred).prototype);
					context$2$0.next = 3;
					return starred.apply(that, args$2$0);

				case 3:
					return context$2$0.abrupt('return', that);

				case 4:
				case 'end':
					return context$2$0.stop();
			}
		}, callee$1$0, this);
	});
	link(starred, key, F);
	return F;
};

exports.future = require('./future');
},{"./future":4,"./util":6,"regenerator/runtime":2}],6:[function(require,module,exports){
(function (process,global){
"use strict";
// colors package does not work in browser - fails on reference to node's `process` global
var idem = function(x) { return x; };
var colors = (typeof(process) === 'undefined' || process.browser) ? 
	['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray'].reduce(function(r, c) {
		r[c] = idem;
		return r;
	}, {}) : require(idem('colors'));

function log(message) {
	console.error(colors.gray("[STREAMLINE-RUNTIME] " + message));
}
function warn(message) {
	console.error(colors.magenta("[STREAMLINE-RUNTIME] " + message));
}
function error(message) {
	console.error(colors.red("[STREAMLINE-RUNTIME] " + message));
}

function trace(obj) {
	if (obj instanceof TypeError) util.error(obj.stack);
	//else console.error(obj);
};

function typeName(val) {
	return val === null ? "null" : typeof val;
}

function typeError(message, expected, got) {
	var err = new TypeError(message + ": expected " + expected + ", got " + typeName(got));
	console.error(err.stack);
	throw err;
}

function argError(fname, index, expected, got) {
	return typeError("invalid argument " + index + " to function `" + fname + "`", expected, got);
}

function getGlobals(runtime) {
	var glob = typeof global === "object" ? global : window;
	var secret = "_20c7abceb95c4eb88b7ca1895b1170d1";
	var g = (glob[secret] = (glob[secret] || { context: {} }));
	if (runtime && g.runtime && g.runtime !== runtime) {
		console.warn("[STREAMLINE-RUNTIME] " + runtime + " runtime loaded on top of " + g.runtime);
		g.runtime = runtime;
	}
	return g;
}

// fix names in stack traces
var origPrepareStackTrace = Error.prepareStackTrace;
if (origPrepareStackTrace) Error.prepareStackTrace = function (_, stack) { 
	var result = origPrepareStackTrace.apply(this, arguments);
	result = result.replace(/_\$\$(.*)\$\$\d*/g, function(all, x) { return x; })
		.replace(/Function\.(.*) \[as awaitWrapper-0-null-false\]/g, function(all, x) { return x; });
	return result;
};

module.exports = {
	log: log,
	warn: warn,
	error: error,
	trace: trace,
	typeName: typeName,
	typeError: typeError,
	argError: argError,
	getGlobals: getGlobals,
};
var util = module.exports;

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":1}],7:[function(require,module,exports){
"use strict";

var regeneratorRuntime = typeof require === "function" ? require("regenerator/runtime") : Streamline.require("regenerator/runtime");

var _streamline = typeof require === "function" ? require("streamline-runtime/lib/runtime-callbacks") : Streamline.require("streamline-runtime/lib/runtime-callbacks");

var _filename = "/Users/bruno/dev/dummy/node_modules/streamline/test/common/eval-test._js";
typeof require === "function" ? require("streamline-runtime/lib/builtins-callbacks") : Streamline.require("streamline-runtime/lib/builtins-callbacks")

var evalTest = function evalTest(f, val) {
	f(function (err, result) {
		var str = err ? "ERR: " + err : result;
		strictEqual(str, val, val);
		start();
	});
};

var delay = _streamline.async(regeneratorRuntime.mark(function _$$delay$$(_, val) {
	return regeneratorRuntime.wrap(function _$$delay$$$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				context$1$0.next = 2;
				return _streamline.await(_filename, 12, null, setTimeout, 0, null, false)(true, 0);

			case 2:
				return context$1$0.abrupt("return", val);

			case 3:
			case "end":
				return context$1$0.stop();
		}
	}, _$$delay$$, this);
}), 0, 2);

var delayFail = _streamline.async(regeneratorRuntime.mark(function _$$delayFail$$(_, err) {
	return regeneratorRuntime.wrap(function _$$delayFail$$$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				context$1$0.next = 2;
				return _streamline.await(_filename, 17, null, setTimeout, 0, null, false)(true, 0);

			case 2:
				throw err;

			case 3:
			case "end":
				return context$1$0.stop();
		}
	}, _$$delayFail$$, this);
}), 0, 2);

var throwError = function throwError(message) {
	throw new Error(message);
};

var twoResults = function twoResults(a, b, cb) {
	setTimeout(function () {
		cb(null, a, b);
	}, 0);
};

var twoResultsSync = function twoResultsSync(a, b, cb) {
	cb(null, a, b);
};

QUnit.module(module.id);

asyncTest("eval return", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$(_) {
	return regeneratorRuntime.wrap(function _$$$$$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$(_) {
					return regeneratorRuntime.wrap(function _$$f$$$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, 27, null, delay, 0, null, false)(true, 5);

							case 2:
								return context$2$0.abrupt("return", context$2$0.sent);

							case 3:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$, this);
				}), 0, 1), 5);

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$, this);
}), 0, 1));
asyncTest("eval if true", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$2(_) {
	return regeneratorRuntime.wrap(function _$$$$2$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$2(_) {
					return regeneratorRuntime.wrap(function _$$f$$2$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								if (!true) {
									context$2$0.next = 4;
									break;
								}

								context$2$0.next = 3;
								return _streamline.await(_filename, 32, null, delay, 0, null, false)(true, 3);

							case 3:
								return context$2$0.abrupt("return", context$2$0.sent);

							case 4:
								return context$2$0.abrupt("return", 4);

							case 5:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$2, this);
				}), 0, 1), 3);

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$2, this);
}), 0, 1));
asyncTest("eval if false", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$3(_) {
	return regeneratorRuntime.wrap(function _$$$$3$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$3(_) {
					return regeneratorRuntime.wrap(function _$$f$$3$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								if (!false) {
									context$2$0.next = 4;
									break;
								}

								context$2$0.next = 3;
								return _streamline.await(_filename, 38, null, delay, 0, null, false)(true, 3);

							case 3:
								return context$2$0.abrupt("return", context$2$0.sent);

							case 4:
								return context$2$0.abrupt("return", 4);

							case 5:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$3, this);
				}), 0, 1), 4);

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$3, this);
}), 0, 1));
asyncTest("eval while", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$4(_) {
	return regeneratorRuntime.wrap(function _$$$$4$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$4(_) {
					var i, result;
					return regeneratorRuntime.wrap(function _$$f$$4$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								i = 1, result = 1;

							case 1:
								if (!(i < 5)) {
									context$2$0.next = 8;
									break;
								}

								context$2$0.next = 4;
								return _streamline.await(_filename, 47, null, delay, 0, null, false)(true, i * result);

							case 4:
								result = context$2$0.sent;

								i++;
								context$2$0.next = 1;
								break;

							case 8:
								return context$2$0.abrupt("return", result);

							case 9:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$4, this);
				}), 0, 1), 24);

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$4, this);
}), 0, 1));
asyncTest("eval for", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$5(_) {
	return regeneratorRuntime.wrap(function _$$$$5$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$5(_) {
					var result, i;
					return regeneratorRuntime.wrap(function _$$f$$5$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								result = 1;
								i = 1;

							case 2:
								if (!(i < 5)) {
									context$2$0.next = 13;
									break;
								}

								context$2$0.next = 5;
								return _streamline.await(_filename, 57, null, delay, 0, null, false)(true, i);

							case 5:
								context$2$0.t0 = context$2$0.sent;
								context$2$0.next = 8;
								return _streamline.await(_filename, 57, null, delay, 0, null, false)(true, result);

							case 8:
								context$2$0.t1 = context$2$0.sent;
								result = context$2$0.t0 * context$2$0.t1;

							case 10:
								i++;
								context$2$0.next = 2;
								break;

							case 13:
								return context$2$0.abrupt("return", result);

							case 14:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$5, this);
				}), 0, 1), 24);

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$5, this);
}), 0, 1));
asyncTest("eval for in", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$6(_) {
	return regeneratorRuntime.wrap(function _$$$$6$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$6(_) {
					var foo, result, k;
					return regeneratorRuntime.wrap(function _$$f$$6$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								foo = {
									a: 1,
									b: 2,
									c: 3,
									d: 5
								};
								result = 1;
								context$2$0.t0 = regeneratorRuntime.keys(foo);

							case 3:
								if ((context$2$0.t1 = context$2$0.t0()).done) {
									context$2$0.next = 18;
									break;
								}

								k = context$2$0.t1.value;
								context$2$0.next = 7;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, k);

							case 7:
								context$2$0.t2 = context$2$0.sent;
								context$2$0.t3 = foo[context$2$0.t2];
								context$2$0.next = 11;
								return _streamline.await(_filename, 72, null, delay, 0, null, false)(true, context$2$0.t3);

							case 11:
								context$2$0.t4 = context$2$0.sent;
								context$2$0.next = 14;
								return _streamline.await(_filename, 72, null, delay, 0, null, false)(true, result);

							case 14:
								context$2$0.t5 = context$2$0.sent;
								result = context$2$0.t4 * context$2$0.t5;
								context$2$0.next = 3;
								break;

							case 18:
								return context$2$0.abrupt("return", result);

							case 19:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$6, this);
				}), 0, 1), 30);

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$6, this);
}), 0, 1));
asyncTest("fully async for in", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$7(_) {
	return regeneratorRuntime.wrap(function _$$$$7$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$7(_) {
					var result, i;
					return regeneratorRuntime.wrap(function _$$f$$7$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								result = 1;
								context$2$0.next = 3;
								return _streamline.await(_filename, 80, null, delay, 0, null, false)(true, 2);

							case 3:
								i = context$2$0.sent;

							case 4:
								context$2$0.t0 = i;
								context$2$0.next = 7;
								return _streamline.await(_filename, 80, null, delay, 0, null, false)(true, 5);

							case 7:
								context$2$0.t1 = context$2$0.sent;

								if (!(context$2$0.t0 < context$2$0.t1)) {
									context$2$0.next = 22;
									break;
								}

								context$2$0.next = 11;
								return _streamline.await(_filename, 81, null, delay, 0, null, false)(true, result);

							case 11:
								context$2$0.t2 = context$2$0.sent;
								context$2$0.next = 14;
								return _streamline.await(_filename, 81, null, delay, 0, null, false)(true, i);

							case 14:
								context$2$0.t3 = context$2$0.sent;
								result = context$2$0.t2 * context$2$0.t3;

							case 16:
								context$2$0.next = 18;
								return _streamline.await(_filename, 80, null, delay, 0, null, false)(true, i);

							case 18:
								context$2$0.t4 = context$2$0.sent;
								i = context$2$0.t4 + 1;
								context$2$0.next = 4;
								break;

							case 22:
								return context$2$0.abrupt("return", result);

							case 23:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$7, this);
				}), 0, 1), 24);

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$7, this);
}), 0, 1));
asyncTest("break in loop", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$8(_) {
	return regeneratorRuntime.wrap(function _$$$$8$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$8(_) {
					var result, i;
					return regeneratorRuntime.wrap(function _$$f$$8$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								result = 1;
								i = 1;

							case 2:
								if (!(i < 10)) {
									context$2$0.next = 15;
									break;
								}

								if (!(i == 5)) {
									context$2$0.next = 5;
									break;
								}

								return context$2$0.abrupt("break", 15);

							case 5:
								context$2$0.next = 7;
								return _streamline.await(_filename, 91, null, delay, 0, null, false)(true, result);

							case 7:
								context$2$0.t0 = context$2$0.sent;
								context$2$0.next = 10;
								return _streamline.await(_filename, 91, null, delay, 0, null, false)(true, i);

							case 10:
								context$2$0.t1 = context$2$0.sent;
								result = context$2$0.t0 * context$2$0.t1;

							case 12:
								i++;
								context$2$0.next = 2;
								break;

							case 15:
								return context$2$0.abrupt("return", result);

							case 16:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$8, this);
				}), 0, 1), 24);

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$8, this);
}), 0, 1));
asyncTest("continue", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$9(_) {
	return regeneratorRuntime.wrap(function _$$$$9$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$9(_) {
					var result, i;
					return regeneratorRuntime.wrap(function _$$f$$9$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								result = 1;
								i = 1;

							case 2:
								if (!(i < 10)) {
									context$2$0.next = 15;
									break;
								}

								if (!(i >= 5)) {
									context$2$0.next = 5;
									break;
								}

								return context$2$0.abrupt("continue", 12);

							case 5:
								context$2$0.next = 7;
								return _streamline.await(_filename, 101, null, delay, 0, null, false)(true, result);

							case 7:
								context$2$0.t0 = context$2$0.sent;
								context$2$0.next = 10;
								return _streamline.await(_filename, 101, null, delay, 0, null, false)(true, i);

							case 10:
								context$2$0.t1 = context$2$0.sent;
								result = context$2$0.t0 * context$2$0.t1;

							case 12:
								i++;
								context$2$0.next = 2;
								break;

							case 15:
								return context$2$0.abrupt("return", result);

							case 16:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$9, this);
				}), 0, 1), 24);

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$9, this);
}), 0, 1));
asyncTest("break in while", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$10(_) {
	return regeneratorRuntime.wrap(function _$$$$10$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$10(_) {
					var i, result;
					return regeneratorRuntime.wrap(function _$$f$$10$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								i = 1, result = 1;

							case 1:
								if (!(i < 10)) {
									context$2$0.next = 14;
									break;
								}

								if (!(i == 5)) {
									context$2$0.next = 4;
									break;
								}

								return context$2$0.abrupt("break", 14);

							case 4:
								context$2$0.next = 6;
								return _streamline.await(_filename, 112, null, delay, 0, null, false)(true, result);

							case 6:
								context$2$0.t0 = context$2$0.sent;
								context$2$0.next = 9;
								return _streamline.await(_filename, 112, null, delay, 0, null, false)(true, i);

							case 9:
								context$2$0.t1 = context$2$0.sent;
								result = context$2$0.t0 * context$2$0.t1;

								i++;
								context$2$0.next = 1;
								break;

							case 14:
								return context$2$0.abrupt("return", result);

							case 15:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$10, this);
				}), 0, 1), 24);

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$10, this);
}), 0, 1));
asyncTest("continue in while", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$11(_) {
	return regeneratorRuntime.wrap(function _$$$$11$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$11(_) {
					var i, result;
					return regeneratorRuntime.wrap(function _$$f$$11$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								i = 1, result = 1;

							case 1:
								if (!(i < 10)) {
									context$2$0.next = 14;
									break;
								}

								i++;

								if (!(i >= 5)) {
									context$2$0.next = 5;
									break;
								}

								return context$2$0.abrupt("continue", 1);

							case 5:
								context$2$0.next = 7;
								return _streamline.await(_filename, 125, null, delay, 0, null, false)(true, result);

							case 7:
								context$2$0.t0 = context$2$0.sent;
								context$2$0.next = 10;
								return _streamline.await(_filename, 125, null, delay, 0, null, false)(true, i);

							case 10:
								context$2$0.t1 = context$2$0.sent;
								result = context$2$0.t0 * context$2$0.t1;
								context$2$0.next = 1;
								break;

							case 14:
								return context$2$0.abrupt("return", result);

							case 15:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$11, this);
				}), 0, 1), 24);

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$11, this);
}), 0, 1));
asyncTest("for (;;)", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$12(_) {
	return regeneratorRuntime.wrap(function _$$$$12$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$12(_) {
					var i;
					return regeneratorRuntime.wrap(function _$$f$$12$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								i = 0;

							case 1:
								context$2$0.next = 3;
								return _streamline.await(_filename, 134, null, delay, 0, null, false)(true, ++i);

							case 3:
								context$2$0.t0 = context$2$0.sent;

								if (!(context$2$0.t0 === 10)) {
									context$2$0.next = 6;
									break;
								}

								return context$2$0.abrupt("return", i);

							case 6:
								context$2$0.next = 1;
								break;

							case 8:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$12, this);
				}), 0, 1), 10);

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$12, this);
}), 0, 1));
asyncTest("eval lazy", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$13(_) {
	return regeneratorRuntime.wrap(function _$$$$13$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$13(_) {
					var result;
					return regeneratorRuntime.wrap(function _$$f$$13$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								result = 1;
								context$2$0.next = 3;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, result + 8);

							case 3:
								context$2$0.t1 = context$2$0.sent;
								context$2$0.t2 = context$2$0.t1 < 5;
								context$2$0.next = 7;
								return _streamline.await(_filename, 141, null, delay, 0, null, false)(true, context$2$0.t2);

							case 7:
								context$2$0.t0 = context$2$0.sent;

								if (!context$2$0.t0) {
									context$2$0.next = 10;
									break;
								}

								context$2$0.t0 = true;

							case 10:
								if (!context$2$0.t0) {
									context$2$0.next = 14;
									break;
								}

								context$2$0.t3 = 2;
								context$2$0.next = 15;
								break;

							case 14:
								context$2$0.t3 = 4;

							case 15:
								return context$2$0.abrupt("return", context$2$0.t3);

							case 16:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$13, this);
				}), 0, 1), 4);

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$13, this);
}), 0, 1));
asyncTest("eval lazy full async", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$14(_) {
	return regeneratorRuntime.wrap(function _$$$$14$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$14(_) {
					var result;
					return regeneratorRuntime.wrap(function _$$f$$14$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								result = 1;
								context$2$0.next = 3;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, result + 8);

							case 3:
								context$2$0.t1 = context$2$0.sent;
								context$2$0.t2 = context$2$0.t1 < 5;
								context$2$0.next = 7;
								return _streamline.await(_filename, 147, null, delay, 0, null, false)(true, context$2$0.t2);

							case 7:
								context$2$0.t0 = context$2$0.sent;

								if (!context$2$0.t0) {
									context$2$0.next = 10;
									break;
								}

								context$2$0.t0 = true;

							case 10:
								if (!context$2$0.t0) {
									context$2$0.next = 16;
									break;
								}

								context$2$0.next = 13;
								return _streamline.await(_filename, 147, null, delay, 0, null, false)(true, 2);

							case 13:
								context$2$0.t3 = context$2$0.sent;
								context$2$0.next = 19;
								break;

							case 16:
								context$2$0.next = 18;
								return _streamline.await(_filename, 147, null, delay, 0, null, false)(true, 4);

							case 18:
								context$2$0.t3 = context$2$0.sent;

							case 19:
								return context$2$0.abrupt("return", context$2$0.t3);

							case 20:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$14, this);
				}), 0, 1), 4);

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$14, this);
}), 0, 1));
asyncTest("try catch 1", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$15(_) {
	return regeneratorRuntime.wrap(function _$$$$15$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$15(_) {
					return regeneratorRuntime.wrap(function _$$f$$15$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.prev = 0;
								context$2$0.next = 3;
								return _streamline.await(_filename, 153, null, delay, 0, null, false)(true, "ok");

							case 3:
								return context$2$0.abrupt("return", context$2$0.sent);

							case 6:
								context$2$0.prev = 6;
								context$2$0.t0 = context$2$0["catch"](0);
								context$2$0.next = 10;
								return _streamline.await(_filename, 155, null, delay, 0, null, false)(true, "err");

							case 10:
								return context$2$0.abrupt("return", context$2$0.sent);

							case 11:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$15, this, [[0, 6]]);
				}), 0, 1), "ok");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$15, this);
}), 0, 1));
asyncTest("try catch 2", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$16(_) {
	return regeneratorRuntime.wrap(function _$$$$16$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$16(_) {
					return regeneratorRuntime.wrap(function _$$f$$16$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.prev = 0;
								context$2$0.next = 3;
								return _streamline.await(_filename, 162, null, delay, 0, null, false)(true, "thrown");

							case 3:
								throw context$2$0.sent;

							case 6:
								context$2$0.prev = 6;
								context$2$0.t0 = context$2$0["catch"](0);
								context$2$0.next = 10;
								return _streamline.await(_filename, 164, null, delay, 0, null, false)(true, "caught ");

							case 10:
								context$2$0.t1 = context$2$0.sent;
								context$2$0.t2 = context$2$0.t0;
								return context$2$0.abrupt("return", context$2$0.t1 + context$2$0.t2);

							case 13:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$16, this, [[0, 6]]);
				}), 0, 1), "caught thrown");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$16, this);
}), 0, 1));
asyncTest("try catch 3", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$17(_) {
	return regeneratorRuntime.wrap(function _$$$$17$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$17(_) {
					return regeneratorRuntime.wrap(function _$$f$$17$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.prev = 0;
								context$2$0.next = 3;
								return _streamline.await(_filename, 171, null, delay, 0, null, false)(true, "thrown");

							case 3:
								throw context$2$0.sent;

							case 6:
								context$2$0.prev = 6;
								context$2$0.t0 = context$2$0["catch"](0);
								context$2$0.next = 10;
								return _streamline.await(_filename, 173, null, delay, 0, null, false)(true, "caught ");

							case 10:
								context$2$0.t1 = context$2$0.sent;
								context$2$0.t2 = context$2$0.t0;
								return context$2$0.abrupt("return", context$2$0.t1 + context$2$0.t2);

							case 13:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$17, this, [[0, 6]]);
				}), 0, 1), "caught thrown");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$17, this);
}), 0, 1));
asyncTest("try catch 5", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$18(_) {
	return regeneratorRuntime.wrap(function _$$$$18$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$18(_) {
					return regeneratorRuntime.wrap(function _$$f$$18$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.prev = 0;
								context$2$0.next = 3;
								return _streamline.await(_filename, 180, null, delayFail, 0, null, false)(true, "delay fail");

							case 3:
								context$2$0.next = 12;
								break;

							case 5:
								context$2$0.prev = 5;
								context$2$0.t0 = context$2$0["catch"](0);
								context$2$0.next = 9;
								return _streamline.await(_filename, 182, null, delay, 0, null, false)(true, "caught ");

							case 9:
								context$2$0.t1 = context$2$0.sent;
								context$2$0.t2 = context$2$0.t0;
								return context$2$0.abrupt("return", context$2$0.t1 + context$2$0.t2);

							case 12:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$18, this, [[0, 5]]);
				}), 0, 1), "caught delay fail");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$18, this);
}), 0, 1));
asyncTest("try catch 6", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$19(_) {
	return regeneratorRuntime.wrap(function _$$$$19$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$19(_) {
					return regeneratorRuntime.wrap(function _$$f$$19$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.prev = 0;

								throwError("direct");
								context$2$0.next = 4;
								return _streamline.await(_filename, 190, null, delay, 0, null, false)(true, "ok");

							case 4:
								return context$2$0.abrupt("return", context$2$0.sent);

							case 7:
								context$2$0.prev = 7;
								context$2$0.t0 = context$2$0["catch"](0);
								context$2$0.next = 11;
								return _streamline.await(_filename, 192, null, delay, 0, null, false)(true, "caught ");

							case 11:
								context$2$0.t1 = context$2$0.sent;
								context$2$0.t2 = context$2$0.t0.message;
								return context$2$0.abrupt("return", context$2$0.t1 + context$2$0.t2);

							case 14:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$19, this, [[0, 7]]);
				}), 0, 1), "caught direct");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$19, this);
}), 0, 1));
asyncTest("try catch 7", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$20(_) {
	return regeneratorRuntime.wrap(function _$$$$20$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$20(_) {
					var message;
					return regeneratorRuntime.wrap(function _$$f$$20$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.prev = 0;
								context$2$0.next = 3;
								return _streamline.await(_filename, 199, null, delay, 0, null, false)(true, "indirect");

							case 3:
								message = context$2$0.sent;

								throwError(message);
								context$2$0.next = 7;
								return _streamline.await(_filename, 201, null, delay, 0, null, false)(true, "ok");

							case 7:
								return context$2$0.abrupt("return", context$2$0.sent);

							case 10:
								context$2$0.prev = 10;
								context$2$0.t0 = context$2$0["catch"](0);
								context$2$0.next = 14;
								return _streamline.await(_filename, 203, null, delay, 0, null, false)(true, "caught ");

							case 14:
								context$2$0.t1 = context$2$0.sent;
								context$2$0.t2 = context$2$0.t0.message;
								return context$2$0.abrupt("return", context$2$0.t1 + context$2$0.t2);

							case 17:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$20, this, [[0, 10]]);
				}), 0, 1), "caught indirect");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$20, this);
}), 0, 1));
asyncTest("try finally 1", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$21(_) {
	return regeneratorRuntime.wrap(function _$$$$21$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$21(_) {
					var x;
					return regeneratorRuntime.wrap(function _$$f$$21$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								x = "";
								context$2$0.prev = 1;
								context$2$0.next = 4;
								return _streamline.await(_filename, 211, null, delay, 0, null, false)(true, "try");

							case 4:
								x += context$2$0.sent;

							case 5:
								context$2$0.prev = 5;
								context$2$0.next = 8;
								return _streamline.await(_filename, 213, null, delay, 0, null, false)(true, " finally");

							case 8:
								x += context$2$0.sent;
								return context$2$0.finish(5);

							case 10:
								x += " end";
								return context$2$0.abrupt("return", x);

							case 12:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$21, this, [[1,, 5, 10]]);
				}), 0, 1), "try finally end");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$21, this);
}), 0, 1));
asyncTest("try finally 2", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$22(_) {
	return regeneratorRuntime.wrap(function _$$$$22$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$22(_) {
					var x;
					return regeneratorRuntime.wrap(function _$$f$$22$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								x = "";
								context$2$0.prev = 1;
								context$2$0.next = 4;
								return _streamline.await(_filename, 223, null, delay, 0, null, false)(true, "try");

							case 4:
								x += context$2$0.sent;
								return context$2$0.abrupt("return", x);

							case 6:
								context$2$0.prev = 6;
								context$2$0.next = 9;
								return _streamline.await(_filename, 226, null, delay, 0, null, false)(true, " finally");

							case 9:
								x += context$2$0.sent;
								return context$2$0.finish(6);

							case 11:
								x += " end";
								return context$2$0.abrupt("return", x);

							case 13:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$22, this, [[1,, 6, 11]]);
				}), 0, 1), "try");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$22, this);
}), 0, 1));
asyncTest("try finally 3", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$23(_) {
	return regeneratorRuntime.wrap(function _$$$$23$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$23(_) {
					var x;
					return regeneratorRuntime.wrap(function _$$f$$23$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								x = "";
								context$2$0.prev = 1;
								context$2$0.next = 4;
								return _streamline.await(_filename, 236, null, delay, 0, null, false)(true, "try");

							case 4:
								x += context$2$0.sent;
								throw "bad try";

							case 6:
								context$2$0.prev = 6;
								context$2$0.next = 9;
								return _streamline.await(_filename, 239, null, delay, 0, null, false)(true, " finally");

							case 9:
								x += context$2$0.sent;
								return context$2$0.finish(6);

							case 11:
								x += " end";
								return context$2$0.abrupt("return", x);

							case 13:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$23, this, [[1,, 6, 11]]);
				}), 0, 1), "ERR: bad try");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$23, this);
}), 0, 1));
asyncTest("try finally 4", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$24(_) {
	return regeneratorRuntime.wrap(function _$$$$24$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$24(_) {
					var x;
					return regeneratorRuntime.wrap(function _$$f$$24$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								x = "";
								context$2$0.prev = 1;
								context$2$0.next = 4;
								return _streamline.await(_filename, 249, null, delay, 0, null, false)(true, "try");

							case 4:
								x += context$2$0.sent;

								throwError("except");

							case 6:
								context$2$0.prev = 6;
								context$2$0.next = 9;
								return _streamline.await(_filename, 252, null, delay, 0, null, false)(true, " finally");

							case 9:
								x += context$2$0.sent;
								return context$2$0.finish(6);

							case 11:
								x += " end";
								return context$2$0.abrupt("return", x);

							case 13:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$24, this, [[1,, 6, 11]]);
				}), 0, 1), "ERR: Error: except");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$24, this);
}), 0, 1));
asyncTest("try finally 5", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$25(_) {
	return regeneratorRuntime.wrap(function _$$$$25$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$25(_) {
					var x;
					return regeneratorRuntime.wrap(function _$$f$$25$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								x = "";
								context$2$0.prev = 1;
								context$2$0.prev = 2;
								context$2$0.next = 5;
								return _streamline.await(_filename, 263, null, delay, 0, null, false)(true, "try");

							case 5:
								x += context$2$0.sent;

								throwError("except");
								x += " unreached";

							case 8:
								context$2$0.prev = 8;
								context$2$0.next = 11;
								return _streamline.await(_filename, 267, null, delay, 0, null, false)(true, " finally");

							case 11:
								x += context$2$0.sent;
								return context$2$0.finish(8);

							case 13:
								x += " end";
								return context$2$0.abrupt("return", x);

							case 17:
								context$2$0.prev = 17;
								context$2$0.t0 = context$2$0["catch"](1);
								return context$2$0.abrupt("return", x + "/" + context$2$0.t0.message);

							case 20:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$25, this, [[1, 17], [2,, 8, 13]]);
				}), 0, 1), "try finally/except");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$25, this);
}), 0, 1));
asyncTest("try catch finally 1", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$26(_) {
	return regeneratorRuntime.wrap(function _$$$$26$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$26(_) {
					var x;
					return regeneratorRuntime.wrap(function _$$f$$26$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								x = "";
								context$2$0.prev = 1;
								context$2$0.prev = 2;
								context$2$0.next = 5;
								return _streamline.await(_filename, 281, null, delay, 0, null, false)(true, "try");

							case 5:
								x += context$2$0.sent;
								throw new Error("except");

							case 10:
								context$2$0.prev = 10;
								context$2$0.t0 = context$2$0["catch"](2);
								context$2$0.next = 14;
								return _streamline.await(_filename, 285, null, delay, 0, null, false)(true, " catch " + context$2$0.t0.message);

							case 14:
								x += context$2$0.sent;
								throw context$2$0.t0;

							case 16:
								context$2$0.prev = 16;
								context$2$0.next = 19;
								return _streamline.await(_filename, 288, null, delay, 0, null, false)(true, " finally");

							case 19:
								x += context$2$0.sent;
								return context$2$0.finish(16);

							case 21:
								x += " end";
								return context$2$0.abrupt("return", x);

							case 25:
								context$2$0.prev = 25;
								context$2$0.t1 = context$2$0["catch"](1);
								return context$2$0.abrupt("return", x + "/" + context$2$0.t1.message);

							case 28:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$26, this, [[1, 25], [2, 10, 16, 21]]);
				}), 0, 1), "try catch except finally/except");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$26, this);
}), 0, 1));
asyncTest("try catch finally 2", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$27(_) {
	return regeneratorRuntime.wrap(function _$$$$27$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$27(_) {
					var x;
					return regeneratorRuntime.wrap(function _$$f$$27$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								x = "";
								context$2$0.prev = 1;
								context$2$0.prev = 2;
								context$2$0.next = 5;
								return _streamline.await(_filename, 302, null, delay, 0, null, false)(true, "try");

							case 5:
								x += context$2$0.sent;

								throwError("except");
								x += " unreached";
								context$2$0.next = 14;
								break;

							case 10:
								context$2$0.prev = 10;
								context$2$0.t0 = context$2$0["catch"](2);

								x += " catch " + context$2$0.t0.message;
								throw context$2$0.t0;

							case 14:
								context$2$0.prev = 14;

								x += " finally";
								return context$2$0.finish(14);

							case 17:
								x += " end";
								return context$2$0.abrupt("return", x);

							case 21:
								context$2$0.prev = 21;
								context$2$0.t1 = context$2$0["catch"](1);
								return context$2$0.abrupt("return", x + "/" + context$2$0.t1.message);

							case 24:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$27, this, [[1, 21], [2, 10, 14, 17]]);
				}), 0, 1), "try catch except finally/except");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$27, this);
}), 0, 1));
asyncTest("nested try/catch 1", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$28(_) {
	return regeneratorRuntime.wrap(function _$$$$28$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$28(_) {
					var x;
					return regeneratorRuntime.wrap(function _$$f$$28$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								x = "";
								context$2$0.prev = 1;
								context$2$0.prev = 2;
								context$2$0.next = 5;
								return _streamline.await(_filename, 323, null, delay, 0, null, false)(true, "try");

							case 5:
								x += context$2$0.sent;
								context$2$0.next = 13;
								break;

							case 8:
								context$2$0.prev = 8;
								context$2$0.t0 = context$2$0["catch"](2);
								context$2$0.next = 12;
								return _streamline.await(_filename, 325, null, delay, 0, null, false)(true, " inner catch " + context$2$0.t0.message);

							case 12:
								x += context$2$0.sent;

							case 13:
								throwError(" except");
								context$2$0.next = 19;
								break;

							case 16:
								context$2$0.prev = 16;
								context$2$0.t1 = context$2$0["catch"](1);
								return context$2$0.abrupt("return", x + " outer catch" + context$2$0.t1.message);

							case 19:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$28, this, [[1, 16], [2, 8]]);
				}), 0, 1), "try outer catch except");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$28, this);
}), 0, 1));
asyncTest("nested try/catch 2", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$29(_) {
	return regeneratorRuntime.wrap(function _$$$$29$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$29(_) {
					var x;
					return regeneratorRuntime.wrap(function _$$f$$29$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								x = "";
								context$2$0.prev = 1;
								context$2$0.prev = 2;
								context$2$0.next = 5;
								return _streamline.await(_filename, 338, null, delay, 0, null, false)(true, "try");

							case 5:
								x += context$2$0.sent;
								context$2$0.next = 11;
								break;

							case 8:
								context$2$0.prev = 8;
								context$2$0.t0 = context$2$0["catch"](2);

								x += " inner catch " + context$2$0.t0.message;

							case 11:
								throw new Error(" except");

							case 14:
								context$2$0.prev = 14;
								context$2$0.t1 = context$2$0["catch"](1);
								return context$2$0.abrupt("return", x + " outer catch" + context$2$0.t1.message);

							case 17:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$29, this, [[1, 14], [2, 8]]);
				}), 0, 1), "try outer catch except");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$29, this);
}), 0, 1));
asyncTest("nested try/catch 3", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$30(_) {
	return regeneratorRuntime.wrap(function _$$$$30$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$30(_) {
					var x;
					return regeneratorRuntime.wrap(function _$$f$$30$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								x = "";
								context$2$0.prev = 1;
								context$2$0.prev = 2;
								context$2$0.next = 5;
								return _streamline.await(_filename, 353, null, delay, 0, null, false)(true, "try");

							case 5:
								x += context$2$0.sent;
								context$2$0.next = 13;
								break;

							case 8:
								context$2$0.prev = 8;
								context$2$0.t0 = context$2$0["catch"](2);
								context$2$0.next = 12;
								return _streamline.await(_filename, 355, null, delay, 0, null, false)(true, " inner catch " + context$2$0.t0.message);

							case 12:
								x += context$2$0.sent;

							case 13:
								throw new Error(" except");

							case 16:
								context$2$0.prev = 16;
								context$2$0.t1 = context$2$0["catch"](1);
								return context$2$0.abrupt("return", x + " outer catch" + context$2$0.t1.message);

							case 19:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$30, this, [[1, 16], [2, 8]]);
				}), 0, 1), "try outer catch except");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$30, this);
}), 0, 1));
asyncTest("nested try/finally 1", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$31(_) {
	return regeneratorRuntime.wrap(function _$$$$31$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$31(_) {
					var x;
					return regeneratorRuntime.wrap(function _$$f$$31$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								x = "";
								context$2$0.prev = 1;
								context$2$0.prev = 2;
								context$2$0.next = 5;
								return _streamline.await(_filename, 368, null, delay, 0, null, false)(true, "try");

							case 5:
								x += context$2$0.sent;

							case 6:
								context$2$0.prev = 6;
								context$2$0.next = 9;
								return _streamline.await(_filename, 370, null, delay, 0, null, false)(true, " inner finally");

							case 9:
								x += context$2$0.sent;
								return context$2$0.finish(6);

							case 11:
								throwError(" except");
								context$2$0.next = 17;
								break;

							case 14:
								context$2$0.prev = 14;
								context$2$0.t0 = context$2$0["catch"](1);
								return context$2$0.abrupt("return", x + " outer catch" + context$2$0.t0.message);

							case 17:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$31, this, [[1, 14], [2,, 6, 11]]);
				}), 0, 1), "try inner finally outer catch except");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$31, this);
}), 0, 1));
asyncTest("nested try/finally 2", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$32(_) {
	return regeneratorRuntime.wrap(function _$$$$32$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$32(_) {
					var x;
					return regeneratorRuntime.wrap(function _$$f$$32$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								x = "";
								context$2$0.prev = 1;
								context$2$0.prev = 2;
								context$2$0.next = 5;
								return _streamline.await(_filename, 383, null, delay, 0, null, false)(true, "try");

							case 5:
								x += context$2$0.sent;

							case 6:
								context$2$0.prev = 6;

								x += " inner finally";
								return context$2$0.finish(6);

							case 9:
								throwError(" except");
								context$2$0.next = 15;
								break;

							case 12:
								context$2$0.prev = 12;
								context$2$0.t0 = context$2$0["catch"](1);
								return context$2$0.abrupt("return", x + " outer catch" + context$2$0.t0.message);

							case 15:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$32, this, [[1, 12], [2,, 6, 9]]);
				}), 0, 1), "try inner finally outer catch except");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$32, this);
}), 0, 1));
asyncTest("nested try/finally 3", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$33(_) {
	return regeneratorRuntime.wrap(function _$$$$33$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$33(_) {
					var x;
					return regeneratorRuntime.wrap(function _$$f$$33$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								x = "";
								context$2$0.prev = 1;
								context$2$0.prev = 2;
								context$2$0.next = 5;
								return _streamline.await(_filename, 398, null, delay, 0, null, false)(true, "try");

							case 5:
								x += context$2$0.sent;

							case 6:
								context$2$0.prev = 6;
								context$2$0.next = 9;
								return _streamline.await(_filename, 400, null, delay, 0, null, false)(true, " inner finally");

							case 9:
								x += context$2$0.sent;
								return context$2$0.finish(6);

							case 11:
								throw new Error(" except");

							case 14:
								context$2$0.prev = 14;
								context$2$0.t0 = context$2$0["catch"](1);
								return context$2$0.abrupt("return", x + " outer catch" + context$2$0.t0.message);

							case 17:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$33, this, [[1, 14], [2,, 6, 11]]);
				}), 0, 1), "try inner finally outer catch except");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$33, this);
}), 0, 1));
asyncTest("and ok", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$34(_) {
	return regeneratorRuntime.wrap(function _$$$$34$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$34(_) {
					var x;
					return regeneratorRuntime.wrap(function _$$f$$34$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								x = "<<";
								context$2$0.next = 3;
								return _streamline.await(_filename, 411, null, delay, 0, null, false)(true, true);

							case 3:
								context$2$0.t0 = context$2$0.sent;

								if (!context$2$0.t0) {
									context$2$0.next = 8;
									break;
								}

								context$2$0.next = 7;
								return _streamline.await(_filename, 411, null, delay, 0, null, false)(true, true);

							case 7:
								context$2$0.t0 = context$2$0.sent;

							case 8:
								if (!context$2$0.t0) {
									context$2$0.next = 12;
									break;
								}

								x += "T1";
								context$2$0.next = 13;
								break;

							case 12:
								x += "F1";

							case 13:
								context$2$0.next = 15;
								return _streamline.await(_filename, 413, null, delay, 0, null, false)(true, true);

							case 15:
								context$2$0.t1 = context$2$0.sent;

								if (!context$2$0.t1) {
									context$2$0.next = 20;
									break;
								}

								context$2$0.next = 19;
								return _streamline.await(_filename, 413, null, delay, 0, null, false)(true, false);

							case 19:
								context$2$0.t1 = context$2$0.sent;

							case 20:
								if (!context$2$0.t1) {
									context$2$0.next = 24;
									break;
								}

								x += "T2";
								context$2$0.next = 25;
								break;

							case 24:
								x += "F2";

							case 25:
								context$2$0.next = 27;
								return _streamline.await(_filename, 415, null, delay, 0, null, false)(true, false);

							case 27:
								context$2$0.t2 = context$2$0.sent;

								if (!context$2$0.t2) {
									context$2$0.next = 32;
									break;
								}

								context$2$0.next = 31;
								return _streamline.await(_filename, 415, null, delay, 0, null, false)(true, true);

							case 31:
								context$2$0.t2 = context$2$0.sent;

							case 32:
								if (!context$2$0.t2) {
									context$2$0.next = 36;
									break;
								}

								x += "T3";
								context$2$0.next = 37;
								break;

							case 36:
								x += "F3";

							case 37:
								context$2$0.next = 39;
								return _streamline.await(_filename, 417, null, delay, 0, null, false)(true, false);

							case 39:
								context$2$0.t3 = context$2$0.sent;

								if (!context$2$0.t3) {
									context$2$0.next = 44;
									break;
								}

								context$2$0.next = 43;
								return _streamline.await(_filename, 417, null, delay, 0, null, false)(true, false);

							case 43:
								context$2$0.t3 = context$2$0.sent;

							case 44:
								if (!context$2$0.t3) {
									context$2$0.next = 48;
									break;
								}

								x += "T4";
								context$2$0.next = 49;
								break;

							case 48:
								x += "F4";

							case 49:
								context$2$0.next = 51;
								return _streamline.await(_filename, 419, null, delay, 0, null, false)(true, false);

							case 51:
								context$2$0.t4 = context$2$0.sent;

								if (!context$2$0.t4) {
									context$2$0.next = 56;
									break;
								}

								context$2$0.next = 55;
								return _streamline.await(_filename, 419, null, delayFail, 0, null, false)(true, "bad");

							case 55:
								context$2$0.t4 = context$2$0.sent;

							case 56:
								if (!context$2$0.t4) {
									context$2$0.next = 60;
									break;
								}

								x += "T5";
								context$2$0.next = 61;
								break;

							case 60:
								x += "F5";

							case 61:
								x += ">>";
								return context$2$0.abrupt("return", x);

							case 63:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$34, this);
				}), 0, 1), "<<T1F2F3F4F5>>");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$34, this);
}), 0, 1));
asyncTest("or ok", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$35(_) {
	return regeneratorRuntime.wrap(function _$$$$35$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$35(_) {
					var x;
					return regeneratorRuntime.wrap(function _$$f$$35$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								x = "<<";
								context$2$0.next = 3;
								return _streamline.await(_filename, 428, null, delay, 0, null, false)(true, true);

							case 3:
								context$2$0.t0 = context$2$0.sent;

								if (context$2$0.t0) {
									context$2$0.next = 8;
									break;
								}

								context$2$0.next = 7;
								return _streamline.await(_filename, 428, null, delay, 0, null, false)(true, true);

							case 7:
								context$2$0.t0 = context$2$0.sent;

							case 8:
								if (!context$2$0.t0) {
									context$2$0.next = 12;
									break;
								}

								x += "T1";
								context$2$0.next = 13;
								break;

							case 12:
								x += "F1";

							case 13:
								context$2$0.next = 15;
								return _streamline.await(_filename, 430, null, delay, 0, null, false)(true, true);

							case 15:
								context$2$0.t1 = context$2$0.sent;

								if (context$2$0.t1) {
									context$2$0.next = 20;
									break;
								}

								context$2$0.next = 19;
								return _streamline.await(_filename, 430, null, delay, 0, null, false)(true, false);

							case 19:
								context$2$0.t1 = context$2$0.sent;

							case 20:
								if (!context$2$0.t1) {
									context$2$0.next = 24;
									break;
								}

								x += "T2";
								context$2$0.next = 25;
								break;

							case 24:
								x += "F2";

							case 25:
								context$2$0.next = 27;
								return _streamline.await(_filename, 432, null, delay, 0, null, false)(true, false);

							case 27:
								context$2$0.t2 = context$2$0.sent;

								if (context$2$0.t2) {
									context$2$0.next = 32;
									break;
								}

								context$2$0.next = 31;
								return _streamline.await(_filename, 432, null, delay, 0, null, false)(true, true);

							case 31:
								context$2$0.t2 = context$2$0.sent;

							case 32:
								if (!context$2$0.t2) {
									context$2$0.next = 36;
									break;
								}

								x += "T3";
								context$2$0.next = 37;
								break;

							case 36:
								x += "F3";

							case 37:
								context$2$0.next = 39;
								return _streamline.await(_filename, 434, null, delay, 0, null, false)(true, false);

							case 39:
								context$2$0.t3 = context$2$0.sent;

								if (context$2$0.t3) {
									context$2$0.next = 44;
									break;
								}

								context$2$0.next = 43;
								return _streamline.await(_filename, 434, null, delay, 0, null, false)(true, false);

							case 43:
								context$2$0.t3 = context$2$0.sent;

							case 44:
								if (!context$2$0.t3) {
									context$2$0.next = 48;
									break;
								}

								x += "T4";
								context$2$0.next = 49;
								break;

							case 48:
								x += "F4";

							case 49:
								context$2$0.next = 51;
								return _streamline.await(_filename, 436, null, delay, 0, null, false)(true, true);

							case 51:
								context$2$0.t4 = context$2$0.sent;

								if (context$2$0.t4) {
									context$2$0.next = 56;
									break;
								}

								context$2$0.next = 55;
								return _streamline.await(_filename, 436, null, delayFail, 0, null, false)(true, "bad");

							case 55:
								context$2$0.t4 = context$2$0.sent;

							case 56:
								if (!context$2$0.t4) {
									context$2$0.next = 60;
									break;
								}

								x += "T5";
								context$2$0.next = 61;
								break;

							case 60:
								x += "F5";

							case 61:
								x += ">>";
								return context$2$0.abrupt("return", x);

							case 63:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$35, this);
				}), 0, 1), "<<T1T2T3F4T5>>");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$35, this);
}), 0, 1));
asyncTest("switch with default", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$36(_) {
	return regeneratorRuntime.wrap(function _$$$$36$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$36(_) {
					var g;
					return regeneratorRuntime.wrap(function _$$f$$36$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								g = _streamline.async(regeneratorRuntime.mark(function _$$g$$(_, i) {
									var result;
									return regeneratorRuntime.wrap(function _$$g$$$(context$3$0) {
										while (1) switch (context$3$0.prev = context$3$0.next) {
											case 0:
												result = "a";
												context$3$0.next = 3;
												return _streamline.await(_filename, 446, null, delay, 0, null, false)(true, i);

											case 3:
												context$3$0.t0 = context$3$0.sent;
												context$3$0.next = context$3$0.t0 === 1 ? 6 : context$3$0.t0 === 2 ? 10 : context$3$0.t0 === 3 ? 13 : context$3$0.t0 === 4 ? 13 : 17;
												break;

											case 6:
												context$3$0.next = 8;
												return _streamline.await(_filename, 448, null, delay, 0, null, false)(true, "b");

											case 8:
												result = context$3$0.sent;
												return context$3$0.abrupt("break", 20);

											case 10:
												context$3$0.next = 12;
												return _streamline.await(_filename, 451, null, delay, 0, null, false)(true, "c");

											case 12:
												return context$3$0.abrupt("return", context$3$0.sent);

											case 13:
												context$3$0.next = 15;
												return _streamline.await(_filename, 454, null, delay, 0, null, false)(true, "d");

											case 15:
												result = context$3$0.sent;
												return context$3$0.abrupt("break", 20);

											case 17:
												context$3$0.next = 19;
												return _streamline.await(_filename, 457, null, delay, 0, null, false)(true, "e");

											case 19:
												result = context$3$0.sent;

											case 20:
												return context$3$0.abrupt("return", result);

											case 21:
											case "end":
												return context$3$0.stop();
										}
									}, _$$g$$, this);
								}), 0, 2);
								context$2$0.next = 3;
								return _streamline.await(_filename, 462, null, g, 0, null, false)(true, 0);

							case 3:
								context$2$0.t0 = context$2$0.sent;
								context$2$0.next = 6;
								return _streamline.await(_filename, 462, null, g, 0, null, false)(true, 1);

							case 6:
								context$2$0.t1 = context$2$0.sent;
								context$2$0.t2 = context$2$0.t0 + context$2$0.t1;
								context$2$0.next = 10;
								return _streamline.await(_filename, 462, null, g, 0, null, false)(true, 2);

							case 10:
								context$2$0.t3 = context$2$0.sent;
								context$2$0.t4 = context$2$0.t2 + context$2$0.t3;
								context$2$0.next = 14;
								return _streamline.await(_filename, 462, null, g, 0, null, false)(true, 3);

							case 14:
								context$2$0.t5 = context$2$0.sent;
								context$2$0.t6 = context$2$0.t4 + context$2$0.t5;
								context$2$0.next = 18;
								return _streamline.await(_filename, 462, null, g, 0, null, false)(true, 4);

							case 18:
								context$2$0.t7 = context$2$0.sent;
								context$2$0.t8 = context$2$0.t6 + context$2$0.t7;
								context$2$0.next = 22;
								return _streamline.await(_filename, 462, null, g, 0, null, false)(true, 5);

							case 22:
								context$2$0.t9 = context$2$0.sent;
								return context$2$0.abrupt("return", context$2$0.t8 + context$2$0.t9);

							case 24:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$36, this);
				}), 0, 1), "ebcdde");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$36, this);
}), 0, 1));
asyncTest("switch without default", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$37(_) {
	return regeneratorRuntime.wrap(function _$$$$37$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$37(_) {
					var g;
					return regeneratorRuntime.wrap(function _$$f$$37$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								g = _streamline.async(regeneratorRuntime.mark(function _$$g$$2(_, i) {
									var result;
									return regeneratorRuntime.wrap(function _$$g$$2$(context$3$0) {
										while (1) switch (context$3$0.prev = context$3$0.next) {
											case 0:
												result = "a";
												context$3$0.next = 3;
												return _streamline.await(_filename, 469, null, delay, 0, null, false)(true, i);

											case 3:
												context$3$0.t0 = context$3$0.sent;
												context$3$0.next = context$3$0.t0 === 1 ? 6 : context$3$0.t0 === 2 ? 8 : context$3$0.t0 === 3 ? 9 : context$3$0.t0 === 4 ? 9 : 11;
												break;

											case 6:
												result = "b";
												return context$3$0.abrupt("break", 11);

											case 8:
												return context$3$0.abrupt("return", "c");

											case 9:
												result = "d";
												return context$3$0.abrupt("break", 11);

											case 11:
												return context$3$0.abrupt("return", result);

											case 12:
											case "end":
												return context$3$0.stop();
										}
									}, _$$g$$2, this);
								}), 0, 2);
								context$2$0.next = 3;
								return _streamline.await(_filename, 483, null, g, 0, null, false)(true, 0);

							case 3:
								context$2$0.t0 = context$2$0.sent;
								context$2$0.next = 6;
								return _streamline.await(_filename, 483, null, g, 0, null, false)(true, 1);

							case 6:
								context$2$0.t1 = context$2$0.sent;
								context$2$0.t2 = context$2$0.t0 + context$2$0.t1;
								context$2$0.next = 10;
								return _streamline.await(_filename, 483, null, g, 0, null, false)(true, 2);

							case 10:
								context$2$0.t3 = context$2$0.sent;
								context$2$0.t4 = context$2$0.t2 + context$2$0.t3;
								context$2$0.next = 14;
								return _streamline.await(_filename, 483, null, g, 0, null, false)(true, 3);

							case 14:
								context$2$0.t5 = context$2$0.sent;
								context$2$0.t6 = context$2$0.t4 + context$2$0.t5;
								context$2$0.next = 18;
								return _streamline.await(_filename, 483, null, g, 0, null, false)(true, 4);

							case 18:
								context$2$0.t7 = context$2$0.sent;
								context$2$0.t8 = context$2$0.t6 + context$2$0.t7;
								context$2$0.next = 22;
								return _streamline.await(_filename, 483, null, g, 0, null, false)(true, 5);

							case 22:
								context$2$0.t9 = context$2$0.sent;
								return context$2$0.abrupt("return", context$2$0.t8 + context$2$0.t9);

							case 24:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$37, this);
				}), 0, 1), "abcdda");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$37, this);
}), 0, 1));
asyncTest("switch with fall through", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$38(_) {
	return regeneratorRuntime.wrap(function _$$$$38$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$38(_) {
					var g;
					return regeneratorRuntime.wrap(function _$$f$$38$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								g = _streamline.async(regeneratorRuntime.mark(function _$$g$$3(_, i) {
									var result;
									return regeneratorRuntime.wrap(function _$$g$$3$(context$3$0) {
										while (1) switch (context$3$0.prev = context$3$0.next) {
											case 0:
												result = "/";
												context$3$0.next = 3;
												return _streamline.await(_filename, 490, null, delay, 0, null, false)(true, i);

											case 3:
												context$3$0.t0 = context$3$0.sent;
												context$3$0.next = context$3$0.t0 === 1 ? 6 : context$3$0.t0 === 2 ? 10 : context$3$0.t0 === 3 ? 13 : context$3$0.t0 === 4 ? 13 : context$3$0.t0 === 5 ? 14 : context$3$0.t0 === 6 ? 18 : 21;
												break;

											case 6:
												context$3$0.next = 8;
												return _streamline.await(_filename, 492, null, delay, 0, null, false)(true, "b");

											case 8:
												result += context$3$0.sent;
												return context$3$0.abrupt("break", 24);

											case 10:
												context$3$0.next = 12;
												return _streamline.await(_filename, 495, null, delay, 0, null, false)(true, "c");

											case 12:
												result += context$3$0.sent;

											case 13:
												result += "d";

											case 14:
												context$3$0.next = 16;
												return _streamline.await(_filename, 500, null, delay, 0, null, false)(true, "e");

											case 16:
												result += context$3$0.sent;
												return context$3$0.abrupt("break", 24);

											case 18:
												context$3$0.next = 20;
												return _streamline.await(_filename, 503, null, delay, 0, null, false)(true, "f");

											case 20:
												result += context$3$0.sent;

											case 21:
												context$3$0.next = 23;
												return _streamline.await(_filename, 505, null, delay, 0, null, false)(true, "g");

											case 23:
												result += context$3$0.sent;

											case 24:
												return context$3$0.abrupt("return", result);

											case 25:
											case "end":
												return context$3$0.stop();
										}
									}, _$$g$$3, this);
								}), 0, 2);
								context$2$0.next = 3;
								return _streamline.await(_filename, 510, null, g, 0, null, false)(true, 0);

							case 3:
								context$2$0.t0 = context$2$0.sent;
								context$2$0.next = 6;
								return _streamline.await(_filename, 510, null, g, 0, null, false)(true, 1);

							case 6:
								context$2$0.t1 = context$2$0.sent;
								context$2$0.t2 = context$2$0.t0 + context$2$0.t1;
								context$2$0.next = 10;
								return _streamline.await(_filename, 510, null, g, 0, null, false)(true, 2);

							case 10:
								context$2$0.t3 = context$2$0.sent;
								context$2$0.t4 = context$2$0.t2 + context$2$0.t3;
								context$2$0.next = 14;
								return _streamline.await(_filename, 510, null, g, 0, null, false)(true, 3);

							case 14:
								context$2$0.t5 = context$2$0.sent;
								context$2$0.t6 = context$2$0.t4 + context$2$0.t5;
								context$2$0.next = 18;
								return _streamline.await(_filename, 510, null, g, 0, null, false)(true, 4);

							case 18:
								context$2$0.t7 = context$2$0.sent;
								context$2$0.t8 = context$2$0.t6 + context$2$0.t7;
								context$2$0.next = 22;
								return _streamline.await(_filename, 510, null, g, 0, null, false)(true, 5);

							case 22:
								context$2$0.t9 = context$2$0.sent;
								context$2$0.t10 = context$2$0.t8 + context$2$0.t9;
								context$2$0.next = 26;
								return _streamline.await(_filename, 510, null, g, 0, null, false)(true, 6);

							case 26:
								context$2$0.t11 = context$2$0.sent;
								context$2$0.t12 = context$2$0.t10 + context$2$0.t11;
								context$2$0.next = 30;
								return _streamline.await(_filename, 510, null, g, 0, null, false)(true, 7);

							case 30:
								context$2$0.t13 = context$2$0.sent;
								return context$2$0.abrupt("return", context$2$0.t12 + context$2$0.t13);

							case 32:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$38, this);
				}), 0, 1), "/g/b/cde/de/de/e/fg/g");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$38, this);
}), 0, 1));
asyncTest("this", 5, _streamline.async(regeneratorRuntime.mark(function _$$$$39(_) {
	return regeneratorRuntime.wrap(function _$$$$39$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$39(_) {
					var O, delay2, o;
					return regeneratorRuntime.wrap(function _$$f$$39$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								O = function O(x) {
									this.x = x;
								};

								delay2 = _streamline.async(regeneratorRuntime.mark(function _$$delay2$$(val, _) {
									return regeneratorRuntime.wrap(function _$$delay2$$$(context$3$0) {
										while (1) switch (context$3$0.prev = context$3$0.next) {
											case 0:
												context$3$0.next = 2;
												return _streamline.await(_filename, 546, null, delay, 0, null, false)(true, val);

											case 2:
												return context$3$0.abrupt("return", context$3$0.sent);

											case 3:
											case "end":
												return context$3$0.stop();
										}
									}, _$$delay2$$, this);
								}), 1, 2);

								O.prototype.test1 = _streamline.async(regeneratorRuntime.mark(function _$$$$40(_) {
									var self;
									return regeneratorRuntime.wrap(function _$$$$40$(context$3$0) {
										while (1) switch (context$3$0.prev = context$3$0.next) {
											case 0:
												self = this;
												context$3$0.next = 3;
												return _streamline.await(_filename, 521, null, delay, 0, null, false)(true, this.x + 1);

											case 3:
												this.x = context$3$0.sent;

												strictEqual(this, self);

											case 5:
											case "end":
												return context$3$0.stop();
										}
									}, _$$$$40, this);
								}), 0, 1);
								O.prototype.test2 = _streamline.async(regeneratorRuntime.mark(function _$$$$41(_) {
									var self;
									return regeneratorRuntime.wrap(function _$$$$41$(context$3$0) {
										while (1) switch (context$3$0.prev = context$3$0.next) {
											case 0:
												self = this;
												context$3$0.prev = 1;
												context$3$0.next = 4;
												return _streamline.await(_filename, 527, null, delay, 0, null, false)(true, this.x + 1);

											case 4:
												this.x = context$3$0.sent;

												strictEqual(this, self);
												context$3$0.next = 11;
												break;

											case 8:
												context$3$0.prev = 8;
												context$3$0.t0 = context$3$0["catch"](1);

												ok(false);

											case 11:
											case "end":
												return context$3$0.stop();
										}
									}, _$$$$41, this, [[1, 8]]);
								}), 0, 1);
								O.prototype.test3 = _streamline.async(regeneratorRuntime.mark(function _$$$$42(_) {
									var self;
									return regeneratorRuntime.wrap(function _$$$$42$(context$3$0) {
										while (1) switch (context$3$0.prev = context$3$0.next) {
											case 0:
												self = this;
												context$3$0.prev = 1;
												context$3$0.next = 4;
												return _streamline.await(_filename, 536, null, delay, 0, null, false)(true, this.x + 1);

											case 4:
												this.x = context$3$0.sent;

												throwError("test3");
												ok(false);
												context$3$0.next = 15;
												break;

											case 9:
												context$3$0.prev = 9;
												context$3$0.t0 = context$3$0["catch"](1);

												strictEqual(this, self);
												context$3$0.next = 14;
												return _streamline.await(_filename, 541, null, delay, 0, null, false)(true, this.x + 1);

											case 14:
												this.x = context$3$0.sent;

											case 15:
											case "end":
												return context$3$0.stop();
										}
									}, _$$$$42, this, [[1, 9]]);
								}), 0, 1);

								O.prototype.test4 = _streamline.async(regeneratorRuntime.mark(function _$$$$43(_) {
									var self, v1, v2;
									return regeneratorRuntime.wrap(function _$$$$43$(context$3$0) {
										while (1) switch (context$3$0.prev = context$3$0.next) {
											case 0:
												self = this;
												v1 = _streamline.future(_filename, 551, null, delay2, 1, null, false)(this.x + 1, false);
												v2 = _streamline.future(_filename, 552, null, delay2, 1, null, false)(1, false);
												context$3$0.next = 5;
												return _streamline.await(_filename, 553, null, v1, 0, null, false)(true);

											case 5:
												context$3$0.t0 = context$3$0.sent;
												context$3$0.next = 8;
												return _streamline.await(_filename, 553, null, v2, 0, null, false)(true);

											case 8:
												context$3$0.t1 = context$3$0.sent;
												this.x = context$3$0.t0 + context$3$0.t1;

												strictEqual(this, self);

											case 11:
											case "end":
												return context$3$0.stop();
										}
									}, _$$$$43, this);
								}), 0, 1);
								o = new O(1);
								context$2$0.next = 9;
								return _streamline.await(_filename, 557, o, "test1", 0, null, false)(true);

							case 9:
								context$2$0.next = 11;
								return _streamline.await(_filename, 558, o, "test2", 0, null, false)(true);

							case 11:
								context$2$0.next = 13;
								return _streamline.await(_filename, 559, o, "test3", 0, null, false)(true);

							case 13:
								context$2$0.next = 15;
								return _streamline.await(_filename, 560, o, "test4", 0, null, false)(true);

							case 15:
								return context$2$0.abrupt("return", o.x);

							case 16:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$39, this);
				}), 0, 1), 7);

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$39, this);
}), 0, 1));
asyncTest("scoping", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$44(_) {
	return regeneratorRuntime.wrap(function _$$$$44$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$40(_) {
					var test;
					return regeneratorRuntime.wrap(function _$$f$$40$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								test = _streamline.async(regeneratorRuntime.mark(function _$$test$$(_) {
									var bar, foo;
									return regeneratorRuntime.wrap(function _$$test$$$(context$3$0) {
										while (1) switch (context$3$0.prev = context$3$0.next) {
											case 0:
												bar = function bar() {
													return foo;
												};

												foo = "abc";
												context$3$0.next = 4;
												return _streamline.await(_filename, 573, null, delay, 0, null, false)(true);

											case 4:
												foo = "xyz";
												return context$3$0.abrupt("return", bar);

											case 6:
											case "end":
												return context$3$0.stop();
										}
									}, _$$test$$, this);
								}), 0, 1);
								context$2$0.next = 3;
								return _streamline.await(_filename, 578, null, test, 0, null, false)(true);

							case 3:
								return context$2$0.abrupt("return", (0, context$2$0.sent)());

							case 4:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$40, this);
				}), 0, 1), "xyz");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$44, this);
}), 0, 1));
asyncTest("return undefined", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$45(_) {
	return regeneratorRuntime.wrap(function _$$$$45$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$41(_) {
					var test;
					return regeneratorRuntime.wrap(function _$$f$$41$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								test = _streamline.async(regeneratorRuntime.mark(function _$$test$$2(_) {
									return regeneratorRuntime.wrap(function _$$test$$2$(context$3$0) {
										while (1) switch (context$3$0.prev = context$3$0.next) {
											case 0:
												context$3$0.next = 2;
												return _streamline.await(_filename, 584, null, delay, 0, null, false)(true);

											case 2:
												return context$3$0.abrupt("return");

											case 3:
											case "end":
												return context$3$0.stop();
										}
									}, _$$test$$2, this);
								}), 0, 1);
								context$2$0.next = 3;
								return _streamline.await(_filename, 588, null, test, 0, null, false)(true);

							case 3:
								return context$2$0.abrupt("return", context$2$0.sent);

							case 4:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$41, this);
				}), 0, 1), undefined);

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$45, this);
}), 0, 1));
asyncTest("futures test", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$46(_) {
	return regeneratorRuntime.wrap(function _$$$$46$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$42(_) {
					var delay2, a, b, c, d;
					return regeneratorRuntime.wrap(function _$$f$$42$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								delay2 = _streamline.async(regeneratorRuntime.mark(function _$$delay2$$2(val, _) {
									return regeneratorRuntime.wrap(function _$$delay2$$2$(context$3$0) {
										while (1) switch (context$3$0.prev = context$3$0.next) {
											case 0:
												context$3$0.next = 2;
												return _streamline.await(_filename, 594, null, delay, 0, null, false)(true, val);

											case 2:
												return context$3$0.abrupt("return", context$3$0.sent);

											case 3:
											case "end":
												return context$3$0.stop();
										}
									}, _$$delay2$$2, this);
								}), 1, 2);
								a = _streamline.future(_filename, 597, null, delay2, 1, null, false)("a", false);
								b = _streamline.future(_filename, 598, null, delay2, 1, null, false)("b", false);
								c = _streamline.future(_filename, 599, null, delay2, 1, null, false)("c", false);
								d = _streamline.future(_filename, 600, null, delay2, 1, null, false)("d", false);
								context$2$0.next = 7;
								return _streamline.await(_filename, 601, null, a, 0, null, false)(true);

							case 7:
								context$2$0.t0 = context$2$0.sent;
								context$2$0.next = 10;
								return _streamline.await(_filename, 601, null, b, 0, null, false)(true);

							case 10:
								context$2$0.t1 = context$2$0.sent;
								context$2$0.t2 = context$2$0.t0 + context$2$0.t1;
								context$2$0.next = 14;
								return _streamline.await(_filename, 601, null, d, 0, null, false)(true);

							case 14:
								context$2$0.t3 = context$2$0.sent;
								context$2$0.t4 = context$2$0.t2 + context$2$0.t3;
								context$2$0.next = 18;
								return _streamline.await(_filename, 601, null, c, 0, null, false)(true);

							case 18:
								context$2$0.t5 = context$2$0.sent;
								return context$2$0.abrupt("return", context$2$0.t4 + context$2$0.t5);

							case 20:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$42, this);
				}), 0, 1), "abdc");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$46, this);
}), 0, 1));
asyncTest("last case without break", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$47(_) {
	return regeneratorRuntime.wrap(function _$$$$47$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$43(_) {
					return regeneratorRuntime.wrap(function _$$f$$43$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.t0 = true;
								context$2$0.next = context$2$0.t0 === true ? 3 : 5;
								break;

							case 3:
								context$2$0.next = 5;
								return _streamline.await(_filename, 608, null, delay, 0, null, false)(true);

							case 5:
								return context$2$0.abrupt("return", 1);

							case 6:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$43, this);
				}), 0, 1), 1);

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$47, this);
}), 0, 1));

asyncTest("async comma operator", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$48(_) {
	return regeneratorRuntime.wrap(function _$$$$48$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$44(_) {
					var a;
					return regeneratorRuntime.wrap(function _$$f$$44$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								a = 4;
								a++;
								context$2$0.next = 4;
								return _streamline.await(_filename, 617, null, delay, 0, null, false)(true, 2 * a);

							case 4:
								a = context$2$0.sent;
								context$2$0.next = 7;
								return _streamline.await(_filename, 617, null, delay, 0, null, false)(true, a + 1);

							case 7:
								return context$2$0.abrupt("return", context$2$0.sent);

							case 8:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$44, this);
				}), 0, 1), 11);

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$48, this);
}), 0, 1));

asyncTest("async constructor", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$49(_) {
	return regeneratorRuntime.wrap(function _$$$$49$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$45(_) {
					var Foo;
					return regeneratorRuntime.wrap(function _$$f$$45$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								Foo = _streamline.async(regeneratorRuntime.mark(function _$$Foo$$(val, _) {
									return regeneratorRuntime.wrap(function _$$Foo$$$(context$3$0) {
										while (1) switch (context$3$0.prev = context$3$0.next) {
											case 0:
												context$3$0.next = 2;
												return _streamline.await(_filename, 624, null, delay, 0, null, false)(true);

											case 2:
												this.x = val;

											case 3:
											case "end":
												return context$3$0.stop();
										}
									}, _$$Foo$$, this);
								}), 1, 2);

								Foo.prototype.y = function () {
									return this.x + 1;
								};
								context$2$0.next = 4;
								return _streamline["new"](_filename, 630, Foo, 1)(5, true);

							case 4:
								return context$2$0.abrupt("return", context$2$0.sent.y());

							case 5:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$45, this);
				}), 0, 1), 6);

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$49, this);
}), 0, 1));

asyncTest("fibo false async", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$50(_) {
	return regeneratorRuntime.wrap(function _$$$$50$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$46(_) {
					var fibo;
					return regeneratorRuntime.wrap(function _$$f$$46$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								fibo = _streamline.async(regeneratorRuntime.mark(function _$$fibo$$(_, n) {
									return regeneratorRuntime.wrap(function _$$fibo$$$(context$3$0) {
										while (1) switch (context$3$0.prev = context$3$0.next) {
											case 0:
												if (!(n > 1)) {
													context$3$0.next = 10;
													break;
												}

												context$3$0.next = 3;
												return _streamline.await(_filename, 637, null, fibo, 0, null, false)(true, n - 1);

											case 3:
												context$3$0.t1 = context$3$0.sent;
												context$3$0.next = 6;
												return _streamline.await(_filename, 637, null, fibo, 0, null, false)(true, n - 2);

											case 6:
												context$3$0.t2 = context$3$0.sent;
												context$3$0.t0 = context$3$0.t1 + context$3$0.t2;
												context$3$0.next = 11;
												break;

											case 10:
												context$3$0.t0 = 1;

											case 11:
												return context$3$0.abrupt("return", context$3$0.t0);

											case 12:
											case "end":
												return context$3$0.stop();
										}
									}, _$$fibo$$, this);
								}), 0, 2);
								context$2$0.next = 3;
								return _streamline.await(_filename, 639, null, fibo, 0, null, false)(true, 16);

							case 3:
								return context$2$0.abrupt("return", context$2$0.sent);

							case 4:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$46, this);
				}), 0, 1), 1597);

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$50, this);
}), 0, 1));

asyncTest("coffeescript wrapper 1", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$51(_) {
	return regeneratorRuntime.wrap(function _$$$$51$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$47(_) {
					return regeneratorRuntime.wrap(function _$$f$$47$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return regeneratorRuntime.mark(function callee$2$0() {
									return regeneratorRuntime.wrap(function callee$2$0$(context$3$0) {
										while (1) switch (context$3$0.prev = context$3$0.next) {
											case 0:
												context$3$0.next = 2;
												return _streamline.await(_filename, 646, null, delay, 0, null, false)(true, "cs1");

											case 2:
												return context$3$0.abrupt("return", context$3$0.sent);

											case 3:
											case "end":
												return context$3$0.stop();
										}
									}, callee$2$0, this);
								})();

							case 2:
								return context$2$0.abrupt("return", context$2$0.sent);

							case 3:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$47, this);
				}), 0, 1), "cs1");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$51, this);
}), 0, 1));

asyncTest("coffeescript wrapper 2", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$52(_) {
	return regeneratorRuntime.wrap(function _$$$$52$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$48(_) {
					return regeneratorRuntime.wrap(function _$$f$$48$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return regeneratorRuntime.mark(function callee$2$0() {
									return regeneratorRuntime.wrap(function callee$2$0$(context$3$0) {
										while (1) switch (context$3$0.prev = context$3$0.next) {
											case 0:
												context$3$0.next = 2;
												return _streamline.await(_filename, 654, null, delay, 0, null, false)(true, "cs2");

											case 2:
												return context$3$0.abrupt("return", context$3$0.sent);

											case 3:
											case "end":
												return context$3$0.stop();
										}
									}, callee$2$0, this);
								}).call(this);

							case 2:
								return context$2$0.abrupt("return", context$2$0.sent);

							case 3:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$48, this);
				}), 0, 1), "cs2");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$52, this);
}), 0, 1));

asyncTest("coffeescript wrapper 3", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$53(_) {
	return regeneratorRuntime.wrap(function _$$$$53$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$49(_) {
					var args$2$0 = arguments;
					return regeneratorRuntime.wrap(function _$$f$$49$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return regeneratorRuntime.mark(function callee$2$0() {
									return regeneratorRuntime.wrap(function callee$2$0$(context$3$0) {
										while (1) switch (context$3$0.prev = context$3$0.next) {
											case 0:
												context$3$0.next = 2;
												return _streamline.await(_filename, 662, null, delay, 0, null, false)(true, "cs3");

											case 2:
												return context$3$0.abrupt("return", context$3$0.sent);

											case 3:
											case "end":
												return context$3$0.stop();
										}
									}, callee$2$0, this);
								}).apply(this, args$2$0);

							case 2:
								return context$2$0.abrupt("return", context$2$0.sent);

							case 3:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$49, this);
				}), 0, 1), "cs3");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$53, this);
}), 0, 1));

asyncTest("sync try/catch in async", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$54(_) {
	return regeneratorRuntime.wrap(function _$$$$54$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$50(_) {
					return regeneratorRuntime.wrap(function _$$f$$50$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.prev = 0;
								throw new Error("catch me");

							case 4:
								context$2$0.prev = 4;
								context$2$0.t0 = context$2$0["catch"](0);
								return context$2$0.abrupt("return", "got it");

							case 7:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$50, this, [[0, 4]]);
				}), 0, 1), "got it");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$54, this);
}), 0, 1));

asyncTest("sync try/catch inside conditional", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$55(_) {
	return regeneratorRuntime.wrap(function _$$$$55$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$51(_) {
					return regeneratorRuntime.wrap(function _$$f$$51$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								if (true) {
										try {} catch (ex) {}
									}

							case 1:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$51, this);
				}), 0, 1), undefined);

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$55, this);
}), 0, 1));

asyncTest("labelled break", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$56(_) {
	return regeneratorRuntime.wrap(function _$$$$56$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$52(_) {
					var result, i, j;
					return regeneratorRuntime.wrap(function _$$f$$52$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								result = '';
								i = 1;

							case 2:
								if (!(i < 10)) {
									context$2$0.next = 40;
									break;
								}

								j = 5;

							case 4:
								if (!(j < 10)) {
									context$2$0.next = 34;
									break;
								}

								context$2$0.next = 7;
								return _streamline.await(_filename, 692, null, delay, 0, null, false)(true, result);

							case 7:
								context$2$0.t0 = context$2$0.sent;
								result = context$2$0.t0 + '!';

								if (!(i == 1 && j == 7)) {
									context$2$0.next = 11;
									break;
								}

								return context$2$0.abrupt("break", 34);

							case 11:
								if (!(i == 2 && j == 7)) {
									context$2$0.next = 13;
									break;
								}

								return context$2$0.abrupt("break", 34);

							case 13:
								if (!(i == 3 && j == 7)) {
									context$2$0.next = 15;
									break;
								}

								return context$2$0.abrupt("continue", 31);

							case 15:
								if (!(i == 4 && j == 7)) {
									context$2$0.next = 17;
									break;
								}

								return context$2$0.abrupt("continue", 37);

							case 17:
								if (!(i == 5 && j == 7)) {
									context$2$0.next = 19;
									break;
								}

								return context$2$0.abrupt("break", 40);

							case 19:
								context$2$0.next = 21;
								return _streamline.await(_filename, 698, null, delay, 0, null, false)(true, result);

							case 21:
								context$2$0.t1 = context$2$0.sent;
								context$2$0.next = 24;
								return _streamline.await(_filename, 698, null, delay, 0, null, false)(true, i);

							case 24:
								context$2$0.t2 = context$2$0.sent;
								context$2$0.t3 = context$2$0.t1 + context$2$0.t2;
								context$2$0.next = 28;
								return _streamline.await(_filename, 698, null, delay, 0, null, false)(true, j);

							case 28:
								context$2$0.t4 = context$2$0.sent;
								context$2$0.t5 = context$2$0.t3 + context$2$0.t4;
								result = context$2$0.t5 + '-';

							case 31:
								j++;
								context$2$0.next = 4;
								break;

							case 34:
								context$2$0.next = 36;
								return _streamline.await(_filename, 700, null, delay, 0, null, false)(true, "/");

							case 36:
								result += context$2$0.sent;

							case 37:
								i++;
								context$2$0.next = 2;
								break;

							case 40:
								return context$2$0.abrupt("return", result);

							case 41:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$52, this);
				}), 0, 1), '!15-!16-!/!25-!26-!/!35-!36-!!38-!39-/!45-!46-!!55-!56-!');

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$56, this);
}), 0, 1));

/* this one raises a compile error in babel (normal) - we don't need it any more so nuke it
asyncTest("octal literal", 1, function(_) {
	evalTest(function f(_) {
		return 010;
	}, 8);
})
*/

asyncTest("typeof rewriting bug (fibers)", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$57(_) {
	return regeneratorRuntime.wrap(function _$$$$57$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$53(_) {
					var hello;
					return regeneratorRuntime.wrap(function _$$f$$53$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								hello = "hello";
								return context$2$0.abrupt("return", typeof hello);

							case 2:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$53, this);
				}), 0, 1), "string");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$57, this);
}), 0, 1));

asyncTest("ASI problems", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$58(_) {
	return regeneratorRuntime.wrap(function _$$$$58$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$54(_) {
					var s;
					return regeneratorRuntime.wrap(function _$$f$$54$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								s = "a";
								context$2$0.next = 3;
								return _streamline.await(_filename, 724, null, delay, 0, null, false)(true, s);

							case 3:
								s = context$2$0.sent;
								context$2$0.next = 6;
								return _streamline.await(_filename, 725, null, delay, 0, null, false)(true, s);

							case 6:
								s = context$2$0.sent;
								context$2$0.next = 9;
								return _streamline.await(_filename, 726, null, delay, 0, null, false)(true, s);

							case 9:
								context$2$0.next = 11;
								return _streamline.await(_filename, 727, null, delay, 0, null, false)(true, s);

							case 11:
								return context$2$0.abrupt("return", s);

							case 12:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$54, this);
				}), 0, 1), "a");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$58, this);
}), 0, 1));

asyncTest("multiple results _", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$59(_) {
	return regeneratorRuntime.wrap(function _$$$$59$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$55(_) {
					var results;
					return regeneratorRuntime.wrap(function _$$f$$55$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, 744, null, twoResults, 2, null, false)("abc", "def", true);

							case 2:
								results = context$2$0.sent;
								return context$2$0.abrupt("return", results);

							case 4:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$55, this);
				}), 0, 1), "abc");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$59, this);
}), 0, 1));

asyncTest("multiple results [_]", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$60(_) {
	return regeneratorRuntime.wrap(function _$$$$60$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$56(_) {
					var results;
					return regeneratorRuntime.wrap(function _$$f$$56$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, 751, null, twoResults, 2, null, true)("abc", "def", true);

							case 2:
								results = context$2$0.sent;
								return context$2$0.abrupt("return", results.join('-'));

							case 4:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$56, this);
				}), 0, 1), "abc-def");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$60, this);
}), 0, 1));

asyncTest("multiple results with future", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$61(_) {
	return regeneratorRuntime.wrap(function _$$$$61$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$57(_) {
					var wrapper, results;
					return regeneratorRuntime.wrap(function _$$f$$57$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								wrapper = _streamline.async(regeneratorRuntime.mark(function _$$wrapper$$(a, b, _) {
									return regeneratorRuntime.wrap(function _$$wrapper$$$(context$3$0) {
										while (1) switch (context$3$0.prev = context$3$0.next) {
											case 0:
												context$3$0.next = 2;
												return _streamline.await(_filename, 758, null, twoResults, 2, null, true)(a, b, true);

											case 2:
												return context$3$0.abrupt("return", context$3$0.sent);

											case 3:
											case "end":
												return context$3$0.stop();
										}
									}, _$$wrapper$$, this);
								}), 2, 3);
								context$2$0.next = 3;
								return _streamline.await(_filename, 759, null, _streamline.future(_filename, 759, null, wrapper, 2, null, false)("abc", "def", false), 0, null, false)(true);

							case 3:
								results = context$2$0.sent;
								return context$2$0.abrupt("return", results.join('-'));

							case 5:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$57, this);
				}), 0, 1), "abc-def");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$61, this);
}), 0, 1));

asyncTest("multiple results synchronously", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$62(_) {
	return regeneratorRuntime.wrap(function _$$$$62$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				evalTest(_streamline.async(regeneratorRuntime.mark(function _$$f$$58(_) {
					var results;
					return regeneratorRuntime.wrap(function _$$f$$58$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, 766, null, twoResultsSync, 2, null, true)("abc", "def", true);

							case 2:
								results = context$2$0.sent;
								return context$2$0.abrupt("return", results.join('-'));

							case 4:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$58, this);
				}), 0, 1), "abc-def");

			case 1:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$62, this);
}), 0, 1));

asyncTest("this in futures", 2, _streamline.async(regeneratorRuntime.mark(function _$$$$63(_) {
	var c;
	return regeneratorRuntime.wrap(function _$$$$63$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				c = {
					v: 1,
					test: _streamline.async(regeneratorRuntime.mark(function _$$test$$3(_) {
						return regeneratorRuntime.wrap(function _$$test$$3$(context$2$0) {
							while (1) switch (context$2$0.prev = context$2$0.next) {
								case 0:
									return context$2$0.abrupt("return", this.v);

								case 1:
								case "end":
									return context$2$0.stop();
							}
						}, _$$test$$3, this);
					}), 0, 1)
				};
				context$1$0.next = 3;
				return _streamline.await(_filename, 776, c, "test", 0, null, false)(true);

			case 3:
				context$1$0.t0 = context$1$0.sent;
				strictEqual(context$1$0.t0, 1, "direct call");
				context$1$0.next = 7;
				return _streamline.await(_filename, 777, null, _streamline.future(_filename, 777, c, "test", 0, null, false)(false), 0, null, false)(true);

			case 7:
				context$1$0.t1 = context$1$0.sent;
				strictEqual(context$1$0.t1, 1, "future call");

				start();

			case 10:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$63, this);
}), 0, 1));

asyncTest("arity of async functions", 3, _streamline.async(regeneratorRuntime.mark(function _$$$$64(_) {
	var f, g;
	return regeneratorRuntime.wrap(function _$$$$64$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				f = _streamline.async(regeneratorRuntime.mark(function _$$f$$59(_, a, b, c, d, e, f, g, h, i) {
					return regeneratorRuntime.wrap(function _$$f$$59$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								return context$2$0.abrupt("return", a + b);

							case 1:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$59, this);
				}), 0, 10);
				g = _streamline.async(regeneratorRuntime.mark(function _$$g$$4(_, a) {
					return regeneratorRuntime.wrap(function _$$g$$4$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, 783, null, f, 0, null, false)(true, 1, 2);

							case 2:
								return context$2$0.abrupt("return", context$2$0.sent);

							case 3:
							case "end":
								return context$2$0.stop();
						}
					}, _$$g$$4, this);
				}), 0, 2);

				strictEqual(f.length, 10, "f.length === 10");
				strictEqual(g.length, 2, "g.length === 2");
				context$1$0.next = 6;
				return _streamline.await(_filename, 786, null, g, 0, null, false)(true);

			case 6:
				context$1$0.t0 = context$1$0.sent;
				strictEqual(context$1$0.t0, 3, "g(_) === 3");

				start();

			case 9:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$64, this);
}), 0, 1));

asyncTest("futures on function(i, cb)", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$65(_) {
	var f, fut;
	return regeneratorRuntime.wrap(function _$$$$65$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				f = function f(i, cb) {
					setTimeout(function () {
						cb(null, i + 1);
					}, 0);
				};

				fut = _streamline.future(_filename, 796, null, f, 1, null, false)(5, false);
				context$1$0.next = 4;
				return _streamline.await(_filename, 797, null, fut, 0, null, false)(true);

			case 4:
				context$1$0.t0 = context$1$0.sent;
				strictEqual(context$1$0.t0, 6, "fut(_) === 6");

				start();

			case 7:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$65, this);
}), 0, 1));

asyncTest("do while", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$66(_) {
	var read, i, s, v;
	return regeneratorRuntime.wrap(function _$$$$66$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				read = _streamline.async(regeneratorRuntime.mark(function _$$read$$(_) {
					return regeneratorRuntime.wrap(function _$$read$$$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, 804, null, delay, 0, null, false)(true, ++i);

							case 2:
								return context$2$0.abrupt("return", context$2$0.sent);

							case 3:
							case "end":
								return context$2$0.stop();
						}
					}, _$$read$$, this);
				}), 0, 1);
				i = 0;
				s = "";
				context$1$0.next = 5;
				return _streamline.await(_filename, 807, null, read, 0, null, false)(true);

			case 5:
				v = context$1$0.sent;

			case 6:
				s += v;

			case 7:
				context$1$0.next = 9;
				return _streamline.await(_filename, 810, null, read, 0, null, false)(true);

			case 9:
				context$1$0.t0 = v = context$1$0.sent;

				if (context$1$0.t0 < 5) {
					context$1$0.next = 6;
					break;
				}

			case 11:
				strictEqual(s, "1234");
				start();

			case 13:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$66, this);
}), 0, 1));

asyncTest("return undefined", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$67(_) {
	var read, f;
	return regeneratorRuntime.wrap(function _$$$$67$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				read = _streamline.async(regeneratorRuntime.mark(function _$$read$$2(_) {
					return regeneratorRuntime.wrap(function _$$read$$2$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, 817, null, delay, 0, null, false)(true, 1);

							case 2:
								return context$2$0.abrupt("return", context$2$0.sent);

							case 3:
							case "end":
								return context$2$0.stop();
						}
					}, _$$read$$2, this);
				}), 0, 1);
				f = _streamline.async(regeneratorRuntime.mark(function _$$f$$60(_) {
					return regeneratorRuntime.wrap(function _$$f$$60$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, 820, null, read, 0, null, false)(true);

							case 2:
							case "end":
								return context$2$0.stop();
						}
					}, _$$f$$60, this);
				}), 0, 1);
				context$1$0.next = 4;
				return _streamline.await(_filename, 822, null, f, 0, null, false)(true);

			case 4:
				context$1$0.t0 = context$1$0.sent;
				context$1$0.t1 = undefined;
				strictEqual(context$1$0.t0, context$1$0.t1);

				start();

			case 8:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$67, this);
}), 0, 1));

asyncTest("promises", 7, _streamline.async(regeneratorRuntime.mark(function _$$$$68(_) {
	var test, p1, p2, p3, p4;
	return regeneratorRuntime.wrap(function _$$$$68$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				test = _streamline.async(regeneratorRuntime.mark(function _$$test$$4(v, _) {
					return regeneratorRuntime.wrap(function _$$test$$4$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, 828, null, delay, 0, null, false)(true, v);

							case 2:
								return context$2$0.abrupt("return", context$2$0.sent);

							case 3:
							case "end":
								return context$2$0.stop();
						}
					}, _$$test$$4, this);
				}), 1, 2);
				p1 = _streamline.future(_filename, 830, null, test, 1, null, false)("a", false).promise;
				p2 = _streamline.future(_filename, 831, null, test, 1, null, false)("b", false).promise;

				strictEqual(p1 && typeof p1.then, "function");
				strictEqual(p2 && typeof p2.then, "function");
				context$1$0.next = 7;
				return _streamline.await(_filename, 834, p1, "then", 0, 1, false)(true, true);

			case 7:
				context$1$0.t0 = context$1$0.sent;
				strictEqual(context$1$0.t0, 'a');
				context$1$0.next = 11;
				return _streamline.await(_filename, 835, p2, "then", 0, 1, false)(true, true);

			case 11:
				context$1$0.t1 = context$1$0.sent;
				strictEqual(context$1$0.t1, 'b');
				p3 = _streamline.future(_filename, 836, null, test, 1, null, false)("c", false).promise;

				strictEqual(p3 && typeof p3.then, "function");
				context$1$0.next = 17;
				return _streamline.await(_filename, 838, p3, "then", 0, 1, false)(true, true);

			case 17:
				context$1$0.t2 = context$1$0.sent;
				strictEqual(context$1$0.t2, 'c');
				context$1$0.prev = 19;
				p4 = _streamline.future(_filename, 840, null, delayFail, 0, null, false)(false, "ERR d").promise;
				context$1$0.next = 23;
				return _streamline.await(_filename, 841, p4, "then", 0, 1, false)(true, true);

			case 23:
				ok(false);
				context$1$0.next = 29;
				break;

			case 26:
				context$1$0.prev = 26;
				context$1$0.t3 = context$1$0["catch"](19);

				strictEqual(context$1$0.t3, "ERR d");

			case 29:
				start();

			case 30:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$68, this, [[19, 26]]);
}), 0, 1));

// issue #218
/* - not supported any more
if (!isFast) asyncTest("coffeescript default values", 8, function(_) {
	var got;
	var that = {};
	function fn(a, b, _, c) {
		if (a == null) {
			a = 2;
		}
		if (_ == null) {
			_ = function(e, r) {
				got = r;
			}
		}
		if (c == null) {
			c = 5;
		}
		strictEqual(this, that);
		return delay(_, "a=" + a + ", b=" + b + ", c=" + c);
	}
	var r = fn.call(that, 3, 1, _);
	strictEqual(r, "a=3, b=1, c=5");
	var f = fn.call(that);
	// result should only be ready after a tick
	strictEqual(f, undefined);
	strictEqual(got, undefined);
	delay(_);
	strictEqual(got, "a=2, b=undefined, c=5");
	fn.call(that, 8, 3);
	delay(_);
	strictEqual(got, "a=8, b=3, c=5");
	start();
});
*/

asyncTest("IIFE bug in fibers mode", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$69(_) {
	var api;
	return regeneratorRuntime.wrap(function _$$$$69$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				context$1$0.next = 2;
				return regeneratorRuntime.mark(function callee$1$0() {
					var foo;
					return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								foo = _streamline.async(regeneratorRuntime.mark(function _$$foo$$(_) {
									return regeneratorRuntime.wrap(function _$$foo$$$(context$3$0) {
										while (1) switch (context$3$0.prev = context$3$0.next) {
											case 0:
												return context$3$0.abrupt("return", 1);

											case 1:
											case "end":
												return context$3$0.stop();
										}
									}, _$$foo$$, this);
								}), 0, 1);
								return context$2$0.abrupt("return", {
									foo: foo
								});

							case 2:
							case "end":
								return context$2$0.stop();
						}
					}, callee$1$0, this);
				})();

			case 2:
				api = context$1$0.sent;
				context$1$0.next = 5;
				return _streamline.await(_filename, 893, api, "foo", 0, null, false)(true);

			case 5:
				context$1$0.t0 = context$1$0.sent;
				strictEqual(context$1$0.t0, 1);

				start();

			case 8:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$69, this);
}), 0, 1));

asyncTest("futures on non-streamline APIs", 2, _streamline.async(regeneratorRuntime.mark(function _$$$$70(_) {
	var nat, fut;
	return regeneratorRuntime.wrap(function _$$$$70$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				nat = function nat(cb) {
					setTimeout(function () {
						cb(null, "abc");
					});
				};

				fut = _streamline.future(_filename, 904, null, nat, 0, null, false)(false);

				strictEqual(typeof fut, "function");
				context$1$0.next = 5;
				return _streamline.await(_filename, 906, null, fut, 0, null, false)(true);

			case 5:
				context$1$0.t0 = context$1$0.sent;
				strictEqual(context$1$0.t0, "abc");

				start();

			case 8:
			case "end":
				return context$1$0.stop();
		}
	}, _$$$$70, this);
}), 0, 1));

},{"regenerator/runtime":2,"streamline-runtime/lib/builtins-callbacks":3,"streamline-runtime/lib/runtime-callbacks":5}]},{},[7]);
