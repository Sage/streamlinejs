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
'use strict';

var regeneratorRuntime = typeof require === 'function' ? require('regenerator/runtime') : Streamline.require('regenerator/runtime');

var _streamline = typeof require === 'function' ? require('streamline-runtime/lib/runtime-callbacks') : Streamline.require('streamline-runtime/lib/runtime-callbacks');

var _filename = '/Users/bruno/dev/dummy/node_modules/streamline/test/common/futures-test._js';
typeof require === 'function' ? require('streamline-runtime/lib/builtins-callbacks') : Streamline.require('streamline-runtime/lib/builtins-callbacks')

var delay = _streamline.async(regeneratorRuntime.mark(function _$$delay$$(millis, val, _) {
	return regeneratorRuntime.wrap(function _$$delay$$$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				context$1$0.next = 2;
				return _streamline.await(_filename, 4, null, setTimeout, 0, null, false)(true, millis);

			case 2:
				return context$1$0.abrupt('return', val);

			case 3:
			case 'end':
				return context$1$0.stop();
		}
	}, _$$delay$$, this);
}), 2, 3);

QUnit.module(module.id);

asyncTest("no timeout", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$(_) {
	var f;
	return regeneratorRuntime.wrap(function _$$$$$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				f = _streamline.future(_filename, 9, null, delay, 2, null, false)(1, 'a', false);
				context$1$0.next = 3;
				return _streamline.await(_filename, 10, null, f, 0, null, false)(true);

			case 3:
				context$1$0.t0 = context$1$0.sent;
				equals(context$1$0.t0, 'a', "no timeout");

				start();

			case 6:
			case 'end':
				return context$1$0.stop();
		}
	}, _$$$$, this);
}), 0, 1));
/*
asyncTest("result before timeout", 1, function(_) {
	var f = delay(1, 'a');
	equals(f(_, { timeout: 10, return: 'b' }), 'a', "got result");
	start();
});
asyncTest("timeout returns before result", 3, function(_) {
	var f = delay(20, 'a');
	equals(f(_, { timeout: 1, return: 'b' }), 'b', "got timeout");
	ok(f.cancelled, "future got cancelled");
	try {
		equal(f(_, { timeout: 20, return: 'b' }), 'c');
	} catch (ex) {
		equals(ex.message, "future cancelled", "cannot reuse cancelled future")
	}
	start();
});
asyncTest("timeout throws before result", 1, function(_) {
	var f = delay(20, 'a');
	try {
		equal(f(_, { timeout: 1, throw: 'b' }), 'c');
	} catch (ex) {
		equals(ex.message, 'b', "throws before result");
	}
	start();
});
asyncTest("probe with return", 2, function(_) {
	var f = delay(20, 'a');
	equal(f(_, { timeout: 1, return: 'b', probe: true }), 'b', "probe before result");
	equal(f(_, { timeout: 40, return: 'b', probe: true }), 'a', "probe after result");
	start();
});
asyncTest("probe with throw", 2, function(_) {
	var f = delay(20, 'a');
	try {
		equal(f(_, { timeout: 1, throw: 'b', probe: true }), 'c');
	} catch (ex) {
		equals(ex.message, 'b', "probe before result");
	}
	equal(f(_, { timeout: 40, throw: 'b', probe: true }), 'a', "probe after result");
	start();
});

function delay2(ms1, ms2, val, step, _) {
	step.i = 1;
	setTimeout(_, ms1);
	step.i++;
	setTimeout(_, ms2);
	step.i++;
	return val;

}

asyncTest("cancel before first timeout", 4, function(_) {
	var step = {}
	var f = delay2(20, 20, 'a', step);
	equals(step.i, 1, "step ok");
	equals(f(_, { timeout: 1, return: 'b' }), 'b', "timed out ok");
	equals(step.i, 1, "step ok after timeout");
	setTimeout(_, 40);
	equals(step.i, 1, "cancelled ok");
	start();
});
asyncTest("cancel between first and second timeouts", 4, function(_) {
	var step = {}
	var f = delay2(20, 20, 'a', step);
	equals(step.i, 1, "step ok");
	equals(f(_, { timeout: 30, return: 'b' }), 'b', "timed out ok");
	equals(step.i, 2, "step ok after intermediate timeout");
	setTimeout(_, 20);
	equals(step.i, 2, "cancelled ok");
	start();
});

function join(ms1, ms2, val1, step1, ms3, ms4, val2, step2, _) {
	var f1 = delay2(ms1, ms2, val1, step1);
	var f2 = delay2(ms3, ms4, val2, step2);
	return f1(_) + f2(_);
}

asyncTest("join returns before timeout", 3, function(_) {
	var step1 = {}, step2= {};
	var f = join(10, 20, 'a', step1, 20, 20, 'b', step2);
	equals(f(_, { timeout: 60, return: 'c' }), 'ab', "no timeout ok");
	equals(step1.i, 3, "step1 ok");
	equals(step2.i, 3, "step2 ok");
	start();
});
asyncTest("join with short timeout", 5, function(_) {
	var step1 = {}, step2= {};
	var f = join(10, 20, 'a', step1, 20, 20, 'b', step2);
	equals(f(_, { timeout: 15, return: 'c' }), 'c', "result ok");
	equals(step1.i, 2, "step1 ok");
	equals(step2.i, 1, "step2 ok");
	setTimeout(_, 40);
	equals(step1.i, 2, "step1 cancelled ok");
	equals(step2.i, 1, "step2 cancelled ok");
	start();
});
asyncTest("join with intermediate timeout", 5, function(_) {
	var step1 = {}, step2= {};
	var f = join(10, 20, 'a', step1, 20, 20, 'b', step2);
	equals(f(_, { timeout: 35, return: 'c' }), 'c', "result ok");
	equals(step1.i, 3, "step1 ok");
	equals(step2.i, 2, "step2 ok");
	setTimeout(_, 20);
	equals(step1.i, 3, "step1 cancelled ok");
	equals(step2.i, 2, "step2 cancelled ok");
	start();
});
*/

},{"regenerator/runtime":2,"streamline-runtime/lib/builtins-callbacks":3,"streamline-runtime/lib/runtime-callbacks":5}]},{},[7]);
