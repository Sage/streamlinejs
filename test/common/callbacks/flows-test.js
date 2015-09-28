(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

"use strict";

!(function (global) {
  var wrap = function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided, then outerFn.prototype instanceof Generator.
    var generator = Object.create((outerFn || Generator).prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  };

  var tryCatch = function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  };

  var Generator = function Generator() {};

  var GeneratorFunction = function GeneratorFunction() {};

  var GeneratorFunctionPrototype = function GeneratorFunctionPrototype() {};

  var defineIteratorMethods = function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function (method) {
      prototype[method] = function (arg) {
        return this._invoke(method, arg);
      };
    });
  };

  var AwaitArgument = function AwaitArgument(arg) {
    this.arg = arg;
  };

  var AsyncIterator = function AsyncIterator(generator) {
    var invoke = function invoke(method, arg) {
      var result = generator[method](arg);
      var value = result.value;
      return value instanceof AwaitArgument ? Promise.resolve(value.arg).then(invokeNext, invokeThrow) : Promise.resolve(value).then(function (unwrapped) {
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
    };

    var enqueue = function enqueue(method, arg) {
      var callInvokeWithMethodAndArg = function callInvokeWithMethodAndArg() {
        return invoke(method, arg);
      };

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
      previousPromise ? previousPromise.then(callInvokeWithMethodAndArg,
      // Avoid propagating failures to Promises returned by later
      // invocations of the iterator.
      callInvokeWithMethodAndArg) : new Promise(function (resolve) {
        resolve(callInvokeWithMethodAndArg());
      });
    };

    if (typeof process === "object" && process.domain) {
        invoke = process.domain.bind(invoke);
      }

    var invokeNext = invoke.bind(generator, "next");
    var invokeThrow = invoke.bind(generator, "throw");
    var invokeReturn = invoke.bind(generator, "return");
    var previousPromise;

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  };

  var makeInvokeMethod = function makeInvokeMethod(innerFn, self, context) {
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
            if (method === "return" || method === "throw" && delegate.iterator[method] === undefined) {
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

            var record = tryCatch(delegate.iterator[method], delegate.iterator, arg);

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
            state = context.done ? GenStateCompleted : GenStateSuspendedYield;

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
  };

  var pushTryEntry = function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
        entry.catchLoc = locs[1];
      }

    if (2 in locs) {
        entry.finallyLoc = locs[2];
        entry.afterLoc = locs[3];
      }

    this.tryEntries.push(entry);
  };

  var resetTryEntry = function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  };

  var Context = function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  };

  var values = function values(iterable) {
    if (iterable) {
        var iteratorMethod = iterable[iteratorSymbol];
        if (iteratorMethod) {
            return iteratorMethod.call(iterable);
          }

        if (typeof iterable.next === "function") {
            return iterable;
          }

        if (!isNaN(iterable.length)) {
            var i = -1,
                next = function next() {
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
  };

  var doneResult = function doneResult() {
    return { value: undefined, done: true };
  };

  "use strict";

  var hasOwn = Object.prototype.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var iteratorSymbol = typeof Symbol === "function" && Symbol.iterator || "@@iterator";

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

  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype;
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.

  runtime.isGeneratorFunction = function (genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor ? ctor === GeneratorFunction ||
    // For the native GeneratorFunction constructor, the best we can
    // do is to check its .name property.
    (ctor.displayName || ctor.name) === "GeneratorFunction" : false;
  };

  runtime.mark = function (genFun) {
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
  runtime.awrap = function (arg) {
    return new AwaitArgument(arg);
  };

  defineIteratorMethods(AsyncIterator.prototype);

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function (innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList));

    return runtime.isGeneratorFunction(outerFn) ? iter // If outerFn is a generator, return the full iterator.
    : iter.next().then(function (result) {
      return result.done ? result.value : iter.next();
    });
  };

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[iteratorSymbol] = function () {
    return this;
  };

  Gp.toString = function () {
    return "[object Generator]";
  };

  runtime.keys = function (object) {
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

  runtime.values = values;

  Context.prototype = {
    constructor: Context,

    reset: function reset(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      this.sent = undefined;
      this.done = false;
      this.delegate = null;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
          for (var name in this) {
            // Not sure about the optimal order of these conditions:
            if (name.charAt(0) === "t" && hasOwn.call(this, name) && !isNaN(+name.slice(1))) {
                this[name] = undefined;
              }
          }
        }
    },

    stop: function stop() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
          throw rootRecord.arg;
        }

      return this.rval;
    },

    dispatchException: function dispatchException(exception) {
      var handle = function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;
        return !!caught;
      };

      if (this.done) {
          throw exception;
        }

      var context = this;

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

    abrupt: function abrupt(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
            var finallyEntry = entry;
            break;
          }
      }

      if (finallyEntry && (type === "break" || type === "continue") && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc) {
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

    complete: function complete(record, afterLoc) {
      if (record.type === "throw") {
          throw record.arg;
        }

      if (record.type === "break" || record.type === "continue") {
          this.next = record.arg;
        } else if (record.type === "return") {
          this.rval = record.arg;
          this.next = "end";
        } else if (record.type === "normal" && afterLoc) {
          this.next = afterLoc;
        }
    },

    finish: function finish(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
            this.complete(entry.completion, entry.afterLoc);
            resetTryEntry(entry);
            return ContinueSentinel;
          }
      }
    },

    "catch": function _catch(tryLoc) {
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

    delegateYield: function delegateYield(iterable, resultName, nextLoc) {
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
typeof global === "object" ? global : typeof window === "object" ? window : typeof self === "object" ? self : undefined);

// This invoke function is written in a style that assumes some
// calling function (or Promise) will handle exceptions.

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":10}],2:[function(require,module,exports){
"use strict";

var regeneratorRuntime = typeof require === "function" ? require("regenerator/runtime") : Streamline.require("regenerator/runtime");

var _streamline = typeof require === "function" ? require("streamline-runtime/lib/runtime-callbacks") : Streamline.require("streamline-runtime/lib/runtime-callbacks");

var _filename = "builtins._js";
typeof require === "function" ? require("streamline-runtime/lib/builtins-callbacks") : Streamline.require("streamline-runtime/lib/builtins-callbacks");
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

	var future = function future(fn, args, i) {
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

	var funnel = require('./funnel');

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
						return _streamline.await(_filename, 95, fn, "call", 1, null, false)(thisObj, true, this[i], i, this);

					case 10:
						i++;
						context$2$0.next = 6;
						break;

					case 13:
						context$2$0.next = 17;
						break;

					case 15:
						context$2$0.next = 17;
						return _streamline.await(_filename, 98, this, "map_", 0, null, false)(true, par, fn, thisObj);

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
						return _streamline.await(_filename, 124, fn, "call", 1, null, false)(thisObj, true, this[i], i, this);

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
							return _streamline.future(_filename, 129, null, fun, 0, null, false)(false, _streamline.async(regeneratorRuntime.mark(function _$$$$(_) {
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
						return _streamline.await(_filename, 134, result, i, 0, null, false)(true);

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
						return _streamline.await(_filename, 161, fn, "call", 1, null, false)(thisObj, true, elt, i, this);

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
						return _streamline.await(_filename, 165, this, "map_", 0, null, false)(true, par, _streamline.async(regeneratorRuntime.mark(function _$$$$2(_, elt, i, arr) {
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
						return _streamline.await(_filename, 191, fn, "call", 1, null, false)(thisObj, true, this[i], i, this);

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
							return _streamline.future(_filename, 196, null, fun, 0, null, false)(false, _streamline.async(regeneratorRuntime.mark(function _$$$$3(_) {
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
						return _streamline.await(_filename, 201, futures, i, 0, null, false)(true);

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
						return _streamline.await(_filename, 228, fn, "call", 1, null, false)(thisObj, true, this[i], i, this);

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
							return _streamline.future(_filename, 233, null, fun, 0, null, false)(false, _streamline.async(regeneratorRuntime.mark(function _$$$$4(_) {
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
						return _streamline.await(_filename, 238, futures, i, 0, null, false)(true);

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
						return _streamline.await(_filename, 258, fn, "call", 1, null, false)(thisObj, true, v, this[i], i, this);

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
						return _streamline.await(_filename, 274, fn, "call", 1, null, false)(thisObj, true, v, this[i], i, this);

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
										return _streamline.await(_filename, 298, null, compare, 0, null, false)(true, array[beg], array[end]);

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
										return _streamline.await(_filename, 312, null, compare, 0, null, false)(true, array[nbeg], o);

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
										return _streamline.await(_filename, 313, null, compare, 0, null, false)(true, o, array[nend]);

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
										return _streamline.await(_filename, 324, null, _qsort, 0, null, false)(true, nbeg, end);

									case 42:
										if (!(beg < nend)) {
												context$3$0.next = 45;
												break;
											}

										context$3$0.next = 45;
										return _streamline.await(_filename, 325, null, _qsort, 0, null, false)(true, beg, nend);

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
						return _streamline.await(_filename, 327, null, _qsort, 0, null, false)(true, beg, end);

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
		value: function value(callback, thisObj, args, index) {
			args = Array.prototype.slice.call(args, 0);
			args.splice(index != null && index >= 0 ? index : args.length, 0, callback);
			return this.apply(thisObj, args);
		}
	});
})(typeof exports !== 'undefined' ? exports : Streamline.builtins = Streamline.builtins || {});
///

},{"./funnel":4,"regenerator/runtime":1,"streamline-runtime/lib/builtins-callbacks":2,"streamline-runtime/lib/runtime-callbacks":6}],3:[function(require,module,exports){
"use strict";

var regeneratorRuntime = typeof require === "function" ? require("regenerator/runtime") : Streamline.require("regenerator/runtime");

var _streamline = typeof require === "function" ? require("streamline-runtime/lib/runtime-callbacks") : Streamline.require("streamline-runtime/lib/runtime-callbacks");

var _filename = "/Users/bruno/dev/syracuse/node_modules/streamline-runtime/lib/builtins._js";
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

	var future = function future(fn, args, i) {
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

	var funnel = require('./funnel');

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
						return _streamline.await(_filename, 95, fn, "call", 1, null, false)(thisObj, true, this[i], i, this);

					case 10:
						i++;
						context$2$0.next = 6;
						break;

					case 13:
						context$2$0.next = 17;
						break;

					case 15:
						context$2$0.next = 17;
						return _streamline.await(_filename, 98, this, "map_", 0, null, false)(true, par, fn, thisObj);

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
						return _streamline.await(_filename, 124, fn, "call", 1, null, false)(thisObj, true, this[i], i, this);

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
							return _streamline.future(_filename, 129, null, fun, 0, null, false)(false, _streamline.async(regeneratorRuntime.mark(function _$$$$(_) {
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
						return _streamline.await(_filename, 134, result, i, 0, null, false)(true);

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
						return _streamline.await(_filename, 161, fn, "call", 1, null, false)(thisObj, true, elt, i, this);

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
						return _streamline.await(_filename, 165, this, "map_", 0, null, false)(true, par, _streamline.async(regeneratorRuntime.mark(function _$$$$2(_, elt, i, arr) {
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
						return _streamline.await(_filename, 191, fn, "call", 1, null, false)(thisObj, true, this[i], i, this);

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
							return _streamline.future(_filename, 196, null, fun, 0, null, false)(false, _streamline.async(regeneratorRuntime.mark(function _$$$$3(_) {
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
						return _streamline.await(_filename, 201, futures, i, 0, null, false)(true);

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
						return _streamline.await(_filename, 228, fn, "call", 1, null, false)(thisObj, true, this[i], i, this);

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
							return _streamline.future(_filename, 233, null, fun, 0, null, false)(false, _streamline.async(regeneratorRuntime.mark(function _$$$$4(_) {
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
						return _streamline.await(_filename, 238, futures, i, 0, null, false)(true);

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
						return _streamline.await(_filename, 258, fn, "call", 1, null, false)(thisObj, true, v, this[i], i, this);

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
						return _streamline.await(_filename, 274, fn, "call", 1, null, false)(thisObj, true, v, this[i], i, this);

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
										return _streamline.await(_filename, 298, null, compare, 0, null, false)(true, array[beg], array[end]);

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
										return _streamline.await(_filename, 312, null, compare, 0, null, false)(true, array[nbeg], o);

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
										return _streamline.await(_filename, 313, null, compare, 0, null, false)(true, o, array[nend]);

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
										return _streamline.await(_filename, 324, null, _qsort, 0, null, false)(true, nbeg, end);

									case 42:
										if (!(beg < nend)) {
											context$3$0.next = 45;
											break;
										}

										context$3$0.next = 45;
										return _streamline.await(_filename, 325, null, _qsort, 0, null, false)(true, beg, nend);

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
						return _streamline.await(_filename, 327, null, _qsort, 0, null, false)(true, beg, end);

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
		value: function value(callback, thisObj, args, index) {
			args = Array.prototype.slice.call(args, 0);
			args.splice(index != null && index >= 0 ? index : args.length, 0, callback);
			return this.apply(thisObj, args);
		}
	});
})(typeof exports !== 'undefined' ? exports : Streamline.builtins = Streamline.builtins || {});
///

},{"./funnel":4,"regenerator/runtime":1,"streamline-runtime/lib/runtime-callbacks":6}],4:[function(require,module,exports){
"use strict";

// Do not use this one directly, require it through the flows module.
module.exports = function funnel(max) {
	max = max == null ? -1 : max;
	if (max === 0) max = module.exports.defaultSize;
	if (typeof max !== "number") throw new Error("bad max number: " + max);
	var queue = [],
	    active = 0,
	    closed = false;

	var fun = function fun(callback, fn) {
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
module.exports.defaultSize = 4;

},{}],5:[function(require,module,exports){
"use strict";

var util = require('./util');

module.exports = function (file, line, object, property, index) {
	var bound = typeof property !== "function";
	var fn = bound ? object[property] : property;
	var self = bound ? object : this;
	if (typeof fn !== "function") throw new Error("cannot create future", "function", fn);
	return function futured() {
		var err,
		    result,
		    done,
		    q = [];
		var args = Array.prototype.slice.call(arguments);
		var callback = function callback(e, r) {
			//if (e) console.error(e);
			err = e;
			result = r;
			done = true;
			q && q.forEach(function (f) {
				if (sync) {
						setImmediate(function () {
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
		var future = function future(cb) {
			if (typeof cb !== "function") throw argError(fn.name, index, "function", cb);
			if (done) {
					cb.call(self, err, result);
				} else q.push(cb);
		};
		// computed property so that we don't allocate promise if we don't need to
		Object.defineProperty(future, 'promise', {
			get: function get() {
				return new Promise(function (resolve, reject) {
					if (done) {
							if (err) reject(err);else resolve(result);
						} else {
							q.push(function (e, r) {
								if (e) reject(e);else resolve(r);
							});
						}
				});
			}
		});
		return future;
	};
};

},{"./util":7}],6:[function(require,module,exports){
'use strict';

var regeneratorRuntime = typeof require === 'function' ? require('regenerator/runtime') : Streamline.require('regenerator/runtime');

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
	var emit = function emit(ev, g) {
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
					var v = err ? g['throw'](err) : send.call(g, val);
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
	var callback = function callback(e, r) {
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
		get: function get() {
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
	get: function get() {
		return this;
	}
});

var starTemplate = function starTemplate(fn, options) {
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

var unstarTemplate = function unstarTemplate(fn, options) {
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

exports['new'] = function (file, line, constructor, index) {
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

},{"./future":5,"./util":7,"regenerator/runtime":1}],7:[function(require,module,exports){
(function (process,global){
'use strict';

var log = function log(message) {
	console.error(colors.gray("[STREAMLINE-RUNTIME] " + message));
};

var warn = function warn(message) {
	console.error(colors.magenta("[STREAMLINE-RUNTIME] " + message));
};

var error = function error(message) {
	console.error(colors.red("[STREAMLINE-RUNTIME] " + message));
};

var trace = function trace(obj) {
	if (obj instanceof TypeError) util.error(obj.stack);
	//else console.error(obj);
};

var typeName = function typeName(val) {
	return val === null ? "null" : typeof val;
};

var typeError = function typeError(message, expected, got) {
	var err = new TypeError(message + ": expected " + expected + ", got " + typeName(got));
	console.error(err.stack);
	throw err;
};

var argError = function argError(fname, index, expected, got) {
	return typeError("invalid argument " + index + " to function `" + fname + "`", expected, got);
};

var getGlobals = function getGlobals(runtime) {
	var glob = typeof global === "object" ? global : window;
	var secret = "_20c7abceb95c4eb88b7ca1895b1170d1";
	var g = glob[secret] = glob[secret] || { context: {} };
	if (runtime && g.runtime && g.runtime !== runtime) {
			console.warn("[STREAMLINE-RUNTIME] " + runtime + " runtime loaded on top of " + g.runtime);
			g.runtime = runtime;
		}
	return g;
};

"use strict";
// colors package does not work in browser - fails on reference to node's `process` global
var idem = function idem(x) {
	return x;
};
var colors = typeof process === 'undefined' || process.browser ? ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray'].reduce(function (r, c) {
	r[c] = idem;
	return r;
}, {}) : require(idem('colors'));

;

// fix names in stack traces
var origPrepareStackTrace = Error.prepareStackTrace;
if (origPrepareStackTrace) Error.prepareStackTrace = function (_, stack) {
	var result = origPrepareStackTrace.apply(this, arguments);
	result = result.replace(/_\$\$(.*)\$\$\d*/g, function (all, x) {
		return x;
	}).replace(/Function\.(.*) \[as awaitWrapper-0-null-false\]/g, function (all, x) {
		return x;
	});
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
	getGlobals: getGlobals
};
var util = module.exports;

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":10}],8:[function(require,module,exports){
(function (global){
"use strict";
/// !doc
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
/// `var globals = require('streamline/lib/globals')`
///
/// * `globals.context = ctx`
/// * `ctx = globals.context` 
///   sets and gets the context
///
/// Note: an empty context (`{}`) is automatically set by the server wrappers of the `streams` module,
/// before they dispatch a request. So, with these wrappers, each request starts with a fresh empty context.
// This module may be loaded several times so we need a true global (with a secret name!).
// This implementation also allows us to share the context between modules compiled in callback and fibers mode.
(function () {
	var glob = typeof global === "object" ? global : window;
	var secret = "_20c7abceb95c4eb88b7ca1895b1170d1";
	var g = glob[secret] || (glob[secret] = { context: {} });
	if (typeof exports !== 'undefined') {
			module.exports = g;
		} else {
			Streamline.globals = g;
		}
	// g.runtime is now set by each runtime

	///
	/// * `fn = globals.withContext(fn, cx)` 
	///   wraps a function so that it executes with context `cx` (or a wrapper around current context if `cx` is falsy).
	///   The previous context will be restored when the function returns (or throws). 
	///   returns the wrapped function.
	g.withContext = function (fn, cx) {
		if (Object.prototype.toString.call(fn) === "[object GeneratorFunction]") throw new Error("async function not allowed in globals.withContext");
		return function () {
			var oldContext = g.context;
			g.context = cx || Object.create(oldContext);
			try {
				return fn.apply(this, arguments);
			} finally {
				g.context = oldContext;
			}
		};
	};

	g.setPromise = function (name) {
		if (g.Promise) return; // first caller wins
		var req = require; // defeat streamline-require dependencies
		if (name === true) g.Promise = typeof Promise === "function" ? Promise : req('es6-promise');else g.Promise = require(name);
	};
})();

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],9:[function(require,module,exports){
(function (process){
'use strict';

var regeneratorRuntime = typeof require === 'function' ? require('regenerator/runtime') : Streamline.require('regenerator/runtime');

var _streamline = typeof require === 'function' ? require('streamline-runtime/lib/runtime-callbacks') : Streamline.require('streamline-runtime/lib/runtime-callbacks');

var _filename = '/Users/bruno/dev/syracuse/node_modules/streamline/lib/util/flows._js';
typeof require === 'function' ? require('streamline-runtime/lib/builtins-callbacks') : Streamline.require('streamline-runtime/lib/builtins-callbacks');
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

(function (exports) {
	"use strict";
	var globals = require('../globals');
	var builtins = require('streamline-runtime/lib/builtins');
	/// !nodoc
	/// Obsolete API
	///
	/// This API is obsolete. Use `array.forEach_`, `array.map_`, ... instead.
	///
	/// * `flows.each(_, array, fn, [thisObj])` 
	///   applies `fn` sequentially to the elements of `array`. 
	///   `fn` is called as `fn(_, elt, i)`.
	exports.each = _streamline.async(regeneratorRuntime.mark(function _$$$$(_, array, fn, thisObj) {
		return regeneratorRuntime.wrap(function _$$$$$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					if (!(array && array.length)) {
						context$2$0.next = 6;
						break;
					}

					context$2$0.next = 3;
					return _streamline.await(_filename, 45, array, 'forEach_', 0, null, false)(true, fn, thisObj);

				case 3:
					context$2$0.t0 = context$2$0.sent;
					context$2$0.next = 7;
					break;

				case 6:
					context$2$0.t0 = undefined;

				case 7:
					return context$2$0.abrupt('return', context$2$0.t0);

				case 8:
				case 'end':
					return context$2$0.stop();
			}
		}, _$$$$, this);
	}), 0, 4);
	/// * `result = flows.map(_, array, fn, [thisObj])` 
	///   transforms `array` by applying `fn` to each element in turn. 
	///   `fn` is called as `fn(_, elt, i)`.
	exports.map = _streamline.async(regeneratorRuntime.mark(function _$$$$2(_, array, fn, thisObj) {
		return regeneratorRuntime.wrap(function _$$$$2$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					if (!array) {
						context$2$0.next = 6;
						break;
					}

					context$2$0.next = 3;
					return _streamline.await(_filename, 51, array, 'map_', 0, null, false)(true, fn, thisObj);

				case 3:
					context$2$0.t0 = context$2$0.sent;
					context$2$0.next = 7;
					break;

				case 6:
					context$2$0.t0 = array;

				case 7:
					return context$2$0.abrupt('return', context$2$0.t0);

				case 8:
				case 'end':
					return context$2$0.stop();
			}
		}, _$$$$2, this);
	}), 0, 4);
	/// * `result = flows.filter(_, array, fn, [thisObj])` 
	///   generates a new array that only contains the elements that satisfy the `fn` predicate. 
	///   `fn` is called as `fn(_, elt)`.
	exports.filter = _streamline.async(regeneratorRuntime.mark(function _$$$$3(_, array, fn, thisObj) {
		return regeneratorRuntime.wrap(function _$$$$3$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					if (!array) {
						context$2$0.next = 6;
						break;
					}

					context$2$0.next = 3;
					return _streamline.await(_filename, 57, array, 'filter_', 0, null, false)(true, fn, thisObj);

				case 3:
					context$2$0.t0 = context$2$0.sent;
					context$2$0.next = 7;
					break;

				case 6:
					context$2$0.t0 = array;

				case 7:
					return context$2$0.abrupt('return', context$2$0.t0);

				case 8:
				case 'end':
					return context$2$0.stop();
			}
		}, _$$$$3, this);
	}), 0, 4);
	/// * `bool = flows.every(_, array, fn, [thisObj])` 
	///   returns true if `fn` is true on every element (if `array` is empty too). 
	///   `fn` is called as `fn(_, elt)`.
	exports.every = _streamline.async(regeneratorRuntime.mark(function _$$$$4(_, array, fn, thisObj) {
		return regeneratorRuntime.wrap(function _$$$$4$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					if (!array) {
						context$2$0.next = 6;
						break;
					}

					context$2$0.next = 3;
					return _streamline.await(_filename, 63, array, 'every_', 0, null, false)(true, fn, thisObj);

				case 3:
					context$2$0.t0 = context$2$0.sent;
					context$2$0.next = 7;
					break;

				case 6:
					context$2$0.t0 = undefined;

				case 7:
					return context$2$0.abrupt('return', context$2$0.t0);

				case 8:
				case 'end':
					return context$2$0.stop();
			}
		}, _$$$$4, this);
	}), 0, 4);
	/// * `bool = flows.some(_, array, fn, [thisObj])` 
	///   returns true if `fn` is true for at least one element. 
	///   `fn` is called as `fn(_, elt)`.
	exports.some = _streamline.async(regeneratorRuntime.mark(function _$$$$5(_, array, fn, thisObj) {
		return regeneratorRuntime.wrap(function _$$$$5$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					if (!array) {
						context$2$0.next = 6;
						break;
					}

					context$2$0.next = 3;
					return _streamline.await(_filename, 69, array, 'some_', 0, null, false)(true, fn, thisObj);

				case 3:
					context$2$0.t0 = context$2$0.sent;
					context$2$0.next = 7;
					break;

				case 6:
					context$2$0.t0 = undefined;

				case 7:
					return context$2$0.abrupt('return', context$2$0.t0);

				case 8:
				case 'end':
					return context$2$0.stop();
			}
		}, _$$$$5, this);
	}), 0, 4);
	/// * `result = flows.reduce(_, array, fn, val, [thisObj])` 
	///   reduces by applying `fn` to each element. 
	///   `fn` is called as `val = fn(_, val, elt, i, array)`.
	exports.reduce = _streamline.async(regeneratorRuntime.mark(function _$$$$6(_, array, fn, v, thisObj) {
		return regeneratorRuntime.wrap(function _$$$$6$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					if (!array) {
						context$2$0.next = 6;
						break;
					}

					context$2$0.next = 3;
					return _streamline.await(_filename, 75, array, 'reduce_', 0, null, false)(true, fn, v, thisObj);

				case 3:
					context$2$0.t0 = context$2$0.sent;
					context$2$0.next = 7;
					break;

				case 6:
					context$2$0.t0 = v;

				case 7:
					return context$2$0.abrupt('return', context$2$0.t0);

				case 8:
				case 'end':
					return context$2$0.stop();
			}
		}, _$$$$6, this);
	}), 0, 5);
	/// * `result = flows.reduceRight(_, array, fn, val, [thisObj])` 
	///   reduces from end to start by applying `fn` to each element. 
	///   `fn` is called as `val = fn(_, val, elt, i, array)`.
	exports.reduceRight = _streamline.async(regeneratorRuntime.mark(function _$$$$7(_, array, fn, v, thisObj) {
		return regeneratorRuntime.wrap(function _$$$$7$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					if (!array) {
						context$2$0.next = 6;
						break;
					}

					context$2$0.next = 3;
					return _streamline.await(_filename, 81, array, 'reduceRight_', 0, null, false)(true, fn, v, thisObj);

				case 3:
					context$2$0.t0 = context$2$0.sent;
					context$2$0.next = 7;
					break;

				case 6:
					context$2$0.t0 = v;

				case 7:
					return context$2$0.abrupt('return', context$2$0.t0);

				case 8:
				case 'end':
					return context$2$0.stop();
			}
		}, _$$$$7, this);
	}), 0, 5);

	/// * `array = flows.sort(_, array, compare, [beg], [end])` 
	///   sorts the array. 
	///   `compare` is called as `cmp = compare(_, elt1, elt2)`
	///  
	///   Note: this function _changes_ the original array (and returns it)
	exports.sort = _streamline.async(regeneratorRuntime.mark(function _$$$$8(_, array, compare, beg, end) {
		return regeneratorRuntime.wrap(function _$$$$8$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					if (!array) {
						context$2$0.next = 6;
						break;
					}

					context$2$0.next = 3;
					return _streamline.await(_filename, 90, array, 'sort_', 0, null, false)(true, compare, beg, end);

				case 3:
					context$2$0.t0 = context$2$0.sent;
					context$2$0.next = 7;
					break;

				case 6:
					context$2$0.t0 = array;

				case 7:
					return context$2$0.abrupt('return', context$2$0.t0);

				case 8:
				case 'end':
					return context$2$0.stop();
			}
		}, _$$$$8, this);
	}), 0, 5);
	///
	/// ## Object utility (obsolete)
	///
	/// This API is obsolete. Use `Object.keys(obj).forEach_` instead.
	///
	/// * `flows.eachKey(_, obj, fn)` 
	///   calls `fn(_, key, obj[key])` for every `key` in `obj`.
	exports.eachKey = _streamline.async(regeneratorRuntime.mark(function _$$$$9(_, obj, fn, thisObj) {
		return regeneratorRuntime.wrap(function _$$$$9$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					context$2$0.next = 2;
					return _streamline.await(_filename, 100, obj ? Object.keys(obj) : [], 'forEach_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$10(_, elt) {
						return regeneratorRuntime.wrap(function _$$$$10$(context$3$0) {
							while (1) switch (context$3$0.prev = context$3$0.next) {
								case 0:
									context$3$0.next = 2;
									return _streamline.await(_filename, null, fn, 'call', 1, null, false)(thisObj, true, elt, obj[elt]);

								case 2:
								case 'end':
									return context$3$0.stop();
							}
						}, _$$$$10, this);
					}), 0, 2));

				case 2:
					return context$2$0.abrupt('return', context$2$0.sent);

				case 3:
				case 'end':
					return context$2$0.stop();
			}
		}, _$$$$9, this);
	}), 0, 4);

	// deprecated -- don't document
	exports.spray = function (fns, max) {
		return new function () {
			var funnel = exports.funnel(max);
			this.collect = _streamline.async(regeneratorRuntime.mark(function _$$$$11(_, count, trim) {
				return regeneratorRuntime.wrap(function _$$$$11$(context$4$0) {
					while (1) switch (context$4$0.prev = context$4$0.next) {
						case 0:
							context$4$0.next = 2;
							return _streamline.await(_filename, 110, function (callback) {
								if (typeof callback !== "function") throw new Error("invalid call to collect: no callback");
								var results = trim ? [] : new Array(fns.length);
								count = count < 0 ? fns.length : Math.min(count, fns.length);
								if (count === 0) return callback(null, results);
								var collected = 0;
								for (var i = 0; i < fns.length; i++) {
									(function (i) {
										funnel(function (err, result) {
											if (err) return callback(err);
											if (trim) results.push(result);else results[i] = result;
											if (++collected === count) return callback(null, results);
										}, fns[i]);
									})(i);
								}
							}, 'call', 1, null, false)(this, true);

						case 2:
							return context$4$0.abrupt('return', context$4$0.sent);

						case 3:
						case 'end':
							return context$4$0.stop();
					}
				}, _$$$$11, this);
			}), 0, 3);
			this.collectOne = _streamline.async(regeneratorRuntime.mark(function _$$$$12(_) {
				var result;
				return regeneratorRuntime.wrap(function _$$$$12$(context$4$0) {
					while (1) switch (context$4$0.prev = context$4$0.next) {
						case 0:
							context$4$0.next = 2;
							return _streamline.await(_filename, 129, this, 'collect', 0, null, false)(true, 1, true);

						case 2:
							result = context$4$0.sent;
							return context$4$0.abrupt('return', result && result[0]);

						case 4:
						case 'end':
							return context$4$0.stop();
					}
				}, _$$$$12, this);
			}), 0, 1);
			this.collectAll = _streamline.async(regeneratorRuntime.mark(function _$$$$13(_) {
				return regeneratorRuntime.wrap(function _$$$$13$(context$4$0) {
					while (1) switch (context$4$0.prev = context$4$0.next) {
						case 0:
							context$4$0.next = 2;
							return _streamline.await(_filename, 133, this, 'collect', 0, null, false)(true, -1, false);

						case 2:
							return context$4$0.abrupt('return', context$4$0.sent);

						case 3:
						case 'end':
							return context$4$0.stop();
					}
				}, _$$$$13, this);
			}), 0, 1);
		}();
	};

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
	exports.funnel = require('streamline-runtime/lib/funnel');

	/// ## handshake and queue
	/// * `hs = flows.handshake()` 
	///   allocates a simple semaphore that can be used to do simple handshakes between two tasks. 
	///   The returned handshake object has two methods: 
	///   `hs.wait(_)`: waits until `hs` is notified. 
	///   `hs.notify()`: notifies `hs`. 
	///   Note: `wait` calls are not queued. An exception is thrown if wait is called while another `wait` is pending.
	exports.handshake = function () {
		var callback = null,
		    notified = false;
		return {
			wait: function wait(cb) {
				if (callback) throw new Error("already waiting");
				if (notified) exports.setImmediate(cb);else callback = cb;
				notified = false;
			},
			notify: function notify() {
				if (!callback) notified = true;else exports.setImmediate(callback);
				callback = null;
			}
		};
	};

	/// * `q = flows.queue(options)` 
	///   allocates a queue which may be used to send data asynchronously between two tasks. 
	///   The `max` option can be set to control the maximum queue length. 
	///   When `max` has been reached `q.put(data)` discards data and returns false.
	///   The returned queue has the following methods: 
	exports.queue = function (options) {
		if (typeof options === 'number') options = {
			max: options
		};
		options = options || {};
		var max = options.max != null ? options.max : -1;
		var callback = null,
		    err = null,
		    q = [],
		    pendingWrites = [];
		var queue = {
			///   `data = q.read(_)`: dequeues an item from the queue. Waits if no element is available. 
			read: function read(cb) {
				if (callback) throw new Error("already getting");
				if (q.length > 0) {
						var item = q.shift();
						// recycle queue when empty to avoid maintaining arrays that have grown large and shrunk
						if (q.length === 0) q = [];
						exports.setImmediate(function () {
							cb(err, item);
						});
						if (pendingWrites.length > 0) {
								var wr = pendingWrites.shift();
								exports.setImmediate(function () {
									wr[0](err, wr[1]);
								});
							}
					} else {
						callback = cb;
					}
			},
			///   `q.write(_, data)`:  queues an item. Waits if the queue is full. 
			write: function write(cb, item) {
				if (this.put(item)) {
						exports.setImmediate(function () {
							cb(err);
						});
					} else {
						pendingWrites.push([cb, item]);
					}
			},
			///   `ok = q.put(data)`: queues an item synchronously. Returns true if the queue accepted it, false otherwise.
			put: function put(item, force) {
				if (!callback) {
						if (max >= 0 && q.length >= max && !force) return false;
						q.push(item);
					} else {
						var cb = callback;
						callback = null;
						exports.setImmediate(function () {
							cb(err, item);
						});
					}
				return true;
			},
			///   `q.end()`: ends the queue. This is the synchronous equivalent of `q.write(_, undefined)` 
			end: function end() {
				this.put(undefined, true);
			},
			///   `data = q.peek()`: returns the first item, without dequeuing it. Returns `undefined` if the queue is empty. 
			peek: function peek() {
				return q[0];
			},
			///   `array = q.contents()`: returns a copy of the queue's contents. 
			contents: function contents() {
				return q.slice(0);
			},
			///   `q.adjust(fn[, thisObj])`: adjusts the contents of the queue by calling `newContents = fn(oldContents)`. 
			adjust: function adjust(fn, thisObj) {
				var nq = fn.call(thisObj, q);
				if (!Array.isArray(nq)) throw new Error("reorder function does not return array");
				q = nq;
			}
		};
		///   `q.length`: number of items currently in the queue. 
		Object.defineProperty(queue, "length", {
			get: function get() {
				return q.length;
			}
		});
		return queue;
	};

	///
	/// ## Miscellaneous utilities
	/// * `results = flows.collect(_, futures)` 
	///   collects the results of an array of futures
	exports.collect = _streamline.async(regeneratorRuntime.mark(function _$$$$14(_, futures) {
		return regeneratorRuntime.wrap(function _$$$$14$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					context$2$0.t0 = futures;

					if (!context$2$0.t0) {
						context$2$0.next = 5;
						break;
					}

					context$2$0.next = 4;
					return _streamline.await(_filename, 280, futures, 'map_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$15(_, future) {
						return regeneratorRuntime.wrap(function _$$$$15$(context$3$0) {
							while (1) switch (context$3$0.prev = context$3$0.next) {
								case 0:
									context$3$0.next = 2;
									return _streamline.await(_filename, null, null, future, 0, null, false)(true);

								case 2:
									return context$3$0.abrupt('return', context$3$0.sent);

								case 3:
								case 'end':
									return context$3$0.stop();
							}
						}, _$$$$15, this);
					}), 0, 2));

				case 4:
					context$2$0.t0 = context$2$0.sent;

				case 5:
					return context$2$0.abrupt('return', context$2$0.t0);

				case 6:
				case 'end':
					return context$2$0.stop();
			}
		}, _$$$$14, this);
	}), 0, 2);

	// Obsolete API - use require('streamline/lib/globals').context instead
	exports.setContext = function (ctx) {
		var old = globals.context;
		globals.context = ctx;
		return old;
	};
	exports.getContext = function () {
		return globals.context;
	};

	///
	/// * `result = flows.trampoline(_, fn, thisObj)` 
	///   Executes `fn(_)` through a trampoline. 
	///   Waits for `fn`'s result and returns it. 
	///   This is equivalent to calling `fn.call(thisObj, _)` but the current stack is unwound
	///   before calling `fn`.
	exports.trampoline = function (cb, fn, thisObj) {
		exports.setImmediate(globals.withContext(function () {
			fn.call(thisObj, cb);
		}, globals.context));
	};

	///
	/// * `flows.setImmediate(fn)` 
	///   portable `setImmediate` both browser and server. 
	exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function (fn) {
		setTimeout(fn, 0);
	};

	///
	/// * `flows.nextTick(_)` 
	///   `nextTick` function for both browser and server. 
	///   Aliased to `process.nextTick` on the server side.
	var nextTick = typeof process === "object" && typeof process.nextTick === "function" ? process.nextTick : function (cb) {
		cb();
	};

	// document later
	exports.nextTick = _streamline.async(regeneratorRuntime.mark(function _$$$$16(_) {
		return regeneratorRuntime.wrap(function _$$$$16$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					context$2$0.next = 2;
					return _streamline.await(_filename, 324, null, nextTick, 0, null, false)(true);

				case 2:
				case 'end':
					return context$2$0.stop();
			}
		}, _$$$$16, this);
	}), 0, 1);

	// document later
	// should probably cap millis instead of trying to be too smart
	exports.setTimeout = function (fn, millis) {
		// node's setTimeout notifies immediately if millis > max!!
		// So be safe and work around it.
		// Gotcha: timeout cannot be cancelled beyond max.
		var max = 0x7fffffff;
		if (millis > max) {
				return setTimeout(function () {
					exports.setTimeout(fn, millis - max);
				}, max);
			} else {
				return setTimeout(function () {
					_streamline.future(_filename, 340, null, fn, 0, null, false)(false);
				}, millis);
			}
	};

	// document later
	exports.setInterval = function (fn, millis) {
		return setInterval(function () {
			_streamline.future(_filename, 348, null, fn, 0, null, false)(false);
		}, millis);
	};

	///
	/// * `flows.sleep(_, millis)` 
	///   Sleeps `millis` ms. 
	exports.sleep = _streamline.async(regeneratorRuntime.mark(function _$$$$17(_, millis) {
		return regeneratorRuntime.wrap(function _$$$$17$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					context$2$0.next = 2;
					return _streamline.await(_filename, 356, null, setTimeout, 0, null, false)(true, millis);

				case 2:
					return context$2$0.abrupt('return', context$2$0.sent);

				case 3:
				case 'end':
					return context$2$0.stop();
			}
		}, _$$$$17, this);
	}), 0, 2);

	exports.eventHandler = function (fn) {
		return function () {
			var that = this;
			var args = Array.prototype.slice(arguments, 0);
			return _streamline.async(regeneratorRuntime.mark(function _$$$$18(_) {
				return regeneratorRuntime.wrap(function _$$$$18$(context$4$0) {
					while (1) switch (context$4$0.prev = context$4$0.next) {
						case 0:
							context$4$0.next = 2;
							return _streamline.await(_filename, 364, fn, 'apply_', 0, null, false)(true, that, args, 0);

						case 2:
							return context$4$0.abrupt('return', context$4$0.sent);

						case 3:
						case 'end':
							return context$4$0.stop();
					}
				}, _$$$$18, this);
			}), 0, 1)(function (err) {
				if (err) throw err;
			});
		};
	};

	//   Obsolete. Use `fn.apply_` instead.
	exports.apply = _streamline.async(regeneratorRuntime.mark(function _$$apply$$(_, fn, thisObj, args, index) {
		return regeneratorRuntime.wrap(function _$$apply$$$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					context$2$0.next = 2;
					return _streamline.await(_filename, 373, fn, 'apply_', 0, null, false)(true, thisObj, args, index);

				case 2:
					return context$2$0.abrupt('return', context$2$0.sent);

				case 3:
				case 'end':
					return context$2$0.stop();
			}
		}, _$$apply$$, this);
	}), 0, 5);

	///
	/// * `flows.callWithTimeout(_, fn, millis)` 
	///   Calls `fn(_)` with a timeout guard. 
	///   Throws a timeout exception if `fn` takes more than `millis` ms to complete. 
	exports.callWithTimeout = function (cb, fn, millis) {
		var tid = setTimeout(function () {
			if (cb) {
					var ex = new Error("timeout");
					ex.code = "ETIMEOUT";
					ex.errno = "ETIMEOUT";
					cb(ex);
					cb = null;
				}
		}, millis);
		fn(function (err, result) {
			if (cb) {
					clearTimeout(tid);
					cb(err, result);
					cb = null;
				}
		});
	};
})(typeof exports !== 'undefined' ? exports : Streamline.flows = Streamline.flows || {});
///

}).call(this,require('_process'))
},{"../globals":8,"_process":10,"regenerator/runtime":11,"streamline-runtime/lib/builtins":3,"streamline-runtime/lib/builtins-callbacks":2,"streamline-runtime/lib/funnel":4,"streamline-runtime/lib/runtime-callbacks":6}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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
},{"_process":10}],12:[function(require,module,exports){
'use strict';

var regeneratorRuntime = typeof require === 'function' ? require('regenerator/runtime') : Streamline.require('regenerator/runtime');

var _streamline = typeof require === 'function' ? require('streamline-runtime/lib/runtime-callbacks') : Streamline.require('streamline-runtime/lib/runtime-callbacks');

var _filename = '/Users/bruno/dev/syracuse/node_modules/streamline/test/common/flows-test._js';
typeof require === 'function' ? require('streamline-runtime/lib/builtins-callbacks') : Streamline.require('streamline-runtime/lib/builtins-callbacks');

var delay = _streamline.async(regeneratorRuntime.mark(function _$$delay$$(_, val) {
	return regeneratorRuntime.wrap(function _$$delay$$$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				context$1$0.next = 2;
				return _streamline.await(_filename, 5, flows, 'nextTick', 0, null, false)(true);

			case 2:
				return context$1$0.abrupt('return', val);

			case 3:
			case 'end':
				return context$1$0.stop();
		}
	}, _$$delay$$, this);
}), 0, 2);

var delayFail = _streamline.async(regeneratorRuntime.mark(function _$$delayFail$$(_, err) {
	return regeneratorRuntime.wrap(function _$$delayFail$$$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				context$1$0.next = 2;
				return _streamline.await(_filename, 10, flows, 'nextTick', 0, null, false)(true);

			case 2:
				throw err;

			case 3:
			case 'end':
				return context$1$0.stop();
		}
	}, _$$delayFail$$, this);
}), 0, 2);

var sparse = function sparse() {
	var a = [];
	a[2] = 33;
	a[5] = 44;
	a[7] = 99;
	return a;
};

var dump = function dump(a) {
	return a.reduce(function (s, v) {
		return s + '/' + v;
	}, '');
};

QUnit.module(module.id);
var flows = require("streamline/lib/util/flows");

asyncTest("each", 7, _streamline.async(regeneratorRuntime.mark(function _$$$$(_) {
	var result;
	return regeneratorRuntime.wrap(function _$$$$$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				result = 1;
				context$1$0.next = 3;
				return _streamline.await(_filename, 30, flows, 'each', 0, null, false)(true, [1, 2, 3, 4], _streamline.async(regeneratorRuntime.mark(function _$$$$2(_, val) {
					return regeneratorRuntime.wrap(function _$$$$2$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.t0 = result;
								context$2$0.next = 3;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 3:
								context$2$0.t1 = context$2$0.sent;
								result = context$2$0.t0 * context$2$0.t1;

							case 5:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$2, this);
				}), 0, 2));

			case 3:
				strictEqual(result, 24);
				result = 1;
				context$1$0.next = 7;
				return _streamline.await(_filename, 35, [1, 2, 3, 4], 'forEach_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$3(_, val) {
					var v;
					return regeneratorRuntime.wrap(function _$$$$3$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								v = context$2$0.sent;
								result = result * v;

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$3, this);
				}), 0, 2));

			case 7:
				strictEqual(result, 24);
				result = 1;
				context$1$0.next = 11;
				return _streamline.await(_filename, 41, [1, 2, 3, 4], 'forEach_', 0, null, false)(true, 2, _streamline.async(regeneratorRuntime.mark(function _$$$$4(_, val) {
					var v;
					return regeneratorRuntime.wrap(function _$$$$4$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								v = context$2$0.sent;
								result = result * v;

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$4, this);
				}), 0, 2));

			case 11:
				strictEqual(result, 24);
				result = 1;
				context$1$0.next = 15;
				return _streamline.await(_filename, 47, [1, 2, 3, 4], 'forEach_', 0, null, false)(true, {
					parallel: 2
				}, _streamline.async(regeneratorRuntime.mark(function _$$$$5(_, val) {
					var v;
					return regeneratorRuntime.wrap(function _$$$$5$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								v = context$2$0.sent;
								result = result * v;

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$5, this);
				}), 0, 2));

			case 15:
				strictEqual(result, 24);
				result = 1;
				context$1$0.next = 19;
				return _streamline.await(_filename, 55, [1, 2, 3, 4], 'forEach_', 0, null, false)(true, -1, _streamline.async(regeneratorRuntime.mark(function _$$$$6(_, val) {
					var v;
					return regeneratorRuntime.wrap(function _$$$$6$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								v = context$2$0.sent;
								result = result * v;

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$6, this);
				}), 0, 2));

			case 19:
				strictEqual(result, 24);
				result = '';
				context$1$0.next = 23;
				return _streamline.await(_filename, 61, sparse(), 'forEach_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$7(_, val, i) {
					var v;
					return regeneratorRuntime.wrap(function _$$$$7$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								v = context$2$0.sent;
								result = result + '/' + i + ':' + v;

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$7, this);
				}), 0, 3));

			case 23:
				strictEqual(result, '/2:33/5:44/7:99');
				result = '';
				context$1$0.next = 27;
				return _streamline.await(_filename, 67, sparse(), 'forEach_', 0, null, false)(true, -1, _streamline.async(regeneratorRuntime.mark(function _$$$$8(_, val, i) {
					var v;
					return regeneratorRuntime.wrap(function _$$$$8$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								v = context$2$0.sent;
								result = result + '/' + i + ':' + v;

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$8, this);
				}), 0, 3));

			case 27:
				strictEqual(result, '/2:33/5:44/7:99');
				start();

			case 29:
			case 'end':
				return context$1$0.stop();
		}
	}, _$$$$, this);
}), 0, 1));
asyncTest("map", 9, _streamline.async(regeneratorRuntime.mark(function _$$$$9(_) {
	var result;
	return regeneratorRuntime.wrap(function _$$$$9$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				context$1$0.next = 2;
				return _streamline.await(_filename, 75, flows, 'map', 0, null, false)(true, [1, 2, 3, 4], _streamline.async(regeneratorRuntime.mark(function _$$$$10(_, val) {
					return regeneratorRuntime.wrap(function _$$$$10$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', 2 * context$2$0.t0);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$10, this);
				}), 0, 2));

			case 2:
				result = context$1$0.sent;

				deepEqual(result, [2, 4, 6, 8]);
				context$1$0.next = 6;
				return _streamline.await(_filename, 79, [1, 2, 3, 4], 'map_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$11(_, val) {
					return regeneratorRuntime.wrap(function _$$$$11$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', 2 * context$2$0.t0);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$11, this);
				}), 0, 2));

			case 6:
				result = context$1$0.sent;

				deepEqual(result, [2, 4, 6, 8]);
				context$1$0.next = 10;
				return _streamline.await(_filename, 83, [1, 2, 3, 4], 'map_', 0, null, false)(true, 2, _streamline.async(regeneratorRuntime.mark(function _$$$$12(_, val) {
					return regeneratorRuntime.wrap(function _$$$$12$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', 2 * context$2$0.t0);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$12, this);
				}), 0, 2));

			case 10:
				result = context$1$0.sent;

				deepEqual(result, [2, 4, 6, 8]);
				context$1$0.next = 14;
				return _streamline.await(_filename, 87, [1, 2, 3, 4], 'map_', 0, null, false)(true, {
					parallel: 2
				}, _streamline.async(regeneratorRuntime.mark(function _$$$$13(_, val) {
					return regeneratorRuntime.wrap(function _$$$$13$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', 2 * context$2$0.t0);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$13, this);
				}), 0, 2));

			case 14:
				result = context$1$0.sent;

				deepEqual(result, [2, 4, 6, 8]);
				context$1$0.next = 18;
				return _streamline.await(_filename, 93, [1, 2, 3, 4], 'map_', 0, null, false)(true, -1, _streamline.async(regeneratorRuntime.mark(function _$$$$14(_, val) {
					return regeneratorRuntime.wrap(function _$$$$14$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', 2 * context$2$0.t0);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$14, this);
				}), 0, 2));

			case 18:
				result = context$1$0.sent;

				deepEqual(result, [2, 4, 6, 8]);
				context$1$0.next = 22;
				return _streamline.await(_filename, 97, sparse(), 'map_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$15(_, val, i) {
					var v;
					return regeneratorRuntime.wrap(function _$$$$15$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								v = context$2$0.sent;
								return context$2$0.abrupt('return', i + ':' + v);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$15, this);
				}), 0, 3));

			case 22:
				result = context$1$0.sent;

				strictEqual(result.length, 8);
				strictEqual(dump(result), '/2:33/5:44/7:99');
				context$1$0.next = 27;
				return _streamline.await(_filename, 103, sparse(), 'map_', 0, null, false)(true, -1, _streamline.async(regeneratorRuntime.mark(function _$$$$16(_, val, i) {
					var v;
					return regeneratorRuntime.wrap(function _$$$$16$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								v = context$2$0.sent;
								return context$2$0.abrupt('return', i + ':' + v);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$16, this);
				}), 0, 3));

			case 27:
				result = context$1$0.sent;

				strictEqual(result.length, 8);
				strictEqual(dump(result), '/2:33/5:44/7:99');
				start();

			case 31:
			case 'end':
				return context$1$0.stop();
		}
	}, _$$$$9, this);
}), 0, 1));
asyncTest("filter", 9, _streamline.async(regeneratorRuntime.mark(function _$$$$17(_) {
	var result;
	return regeneratorRuntime.wrap(function _$$$$17$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				context$1$0.next = 2;
				return _streamline.await(_filename, 112, flows, 'filter', 0, null, false)(true, [1, 2, 3, 4], _streamline.async(regeneratorRuntime.mark(function _$$$$18(_, val) {
					return regeneratorRuntime.wrap(function _$$$$18$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 % 2);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$18, this);
				}), 0, 2));

			case 2:
				result = context$1$0.sent;

				deepEqual(result, [1, 3]);
				context$1$0.next = 6;
				return _streamline.await(_filename, 116, [1, 2, 3, 4], 'filter_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$19(_, val) {
					return regeneratorRuntime.wrap(function _$$$$19$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 % 2);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$19, this);
				}), 0, 2));

			case 6:
				result = context$1$0.sent;

				deepEqual(result, [1, 3]);
				context$1$0.next = 10;
				return _streamline.await(_filename, 120, [1, 2, 3, 4], 'filter_', 0, null, false)(true, 2, _streamline.async(regeneratorRuntime.mark(function _$$$$20(_, val) {
					return regeneratorRuntime.wrap(function _$$$$20$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 % 2);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$20, this);
				}), 0, 2));

			case 10:
				result = context$1$0.sent;

				deepEqual(result, [1, 3]);
				context$1$0.next = 14;
				return _streamline.await(_filename, 124, [1, 2, 3, 4], 'filter_', 0, null, false)(true, {
					parallel: 2
				}, _streamline.async(regeneratorRuntime.mark(function _$$$$21(_, val) {
					return regeneratorRuntime.wrap(function _$$$$21$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 % 2);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$21, this);
				}), 0, 2));

			case 14:
				result = context$1$0.sent;

				deepEqual(result, [1, 3]);
				context$1$0.next = 18;
				return _streamline.await(_filename, 130, [1, 2, 3, 4], 'filter_', 0, null, false)(true, -1, _streamline.async(regeneratorRuntime.mark(function _$$$$22(_, val) {
					return regeneratorRuntime.wrap(function _$$$$22$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 % 2);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$22, this);
				}), 0, 2));

			case 18:
				result = context$1$0.sent;

				deepEqual(result, [1, 3]);
				context$1$0.next = 22;
				return _streamline.await(_filename, 134, sparse(), 'filter_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$23(_, val, i) {
					return regeneratorRuntime.wrap(function _$$$$23$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 % 2);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$23, this);
				}), 0, 3));

			case 22:
				result = context$1$0.sent;

				strictEqual(result.length, 2);
				deepEqual(result, [33, 99]);
				context$1$0.next = 27;
				return _streamline.await(_filename, 139, sparse(), 'filter_', 0, null, false)(true, -1, _streamline.async(regeneratorRuntime.mark(function _$$$$24(_, val, i) {
					return regeneratorRuntime.wrap(function _$$$$24$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 % 2);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$24, this);
				}), 0, 3));

			case 27:
				result = context$1$0.sent;

				strictEqual(result.length, 2);
				deepEqual(result, [33, 99]);
				start();

			case 31:
			case 'end':
				return context$1$0.stop();
		}
	}, _$$$$17, this);
}), 0, 1));
asyncTest("every true", 9, _streamline.async(regeneratorRuntime.mark(function _$$$$25(_) {
	var result;
	return regeneratorRuntime.wrap(function _$$$$25$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				context$1$0.next = 2;
				return _streamline.await(_filename, 147, flows, 'every', 0, null, false)(true, [1, 2, 3, 4], _streamline.async(regeneratorRuntime.mark(function _$$$$26(_, val) {
					return regeneratorRuntime.wrap(function _$$$$26$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 5);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$26, this);
				}), 0, 2));

			case 2:
				result = context$1$0.sent;

				strictEqual(result, true);
				context$1$0.next = 6;
				return _streamline.await(_filename, 151, [1, 2, 3, 4], 'every_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$27(_, val) {
					return regeneratorRuntime.wrap(function _$$$$27$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 5);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$27, this);
				}), 0, 2));

			case 6:
				result = context$1$0.sent;

				strictEqual(result, true);
				context$1$0.next = 10;
				return _streamline.await(_filename, 155, [1, 2, 3, 4], 'every_', 0, null, false)(true, 2, _streamline.async(regeneratorRuntime.mark(function _$$$$28(_, val) {
					return regeneratorRuntime.wrap(function _$$$$28$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 5);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$28, this);
				}), 0, 2));

			case 10:
				result = context$1$0.sent;

				strictEqual(result, true);
				context$1$0.next = 14;
				return _streamline.await(_filename, 159, [1, 2, 3, 4], 'every_', 0, null, false)(true, {
					parallel: 2
				}, _streamline.async(regeneratorRuntime.mark(function _$$$$29(_, val) {
					return regeneratorRuntime.wrap(function _$$$$29$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 5);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$29, this);
				}), 0, 2));

			case 14:
				result = context$1$0.sent;

				strictEqual(result, true);
				context$1$0.next = 18;
				return _streamline.await(_filename, 165, [1, 2, 3, 4], 'every_', 0, null, false)(true, -1, _streamline.async(regeneratorRuntime.mark(function _$$$$30(_, val) {
					return regeneratorRuntime.wrap(function _$$$$30$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 5);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$30, this);
				}), 0, 2));

			case 18:
				result = context$1$0.sent;

				strictEqual(result, true);
				context$1$0.next = 22;
				return _streamline.await(_filename, 169, sparse(), 'every_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$31(_, val, i) {
					return regeneratorRuntime.wrap(function _$$$$31$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 > 30);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$31, this);
				}), 0, 3));

			case 22:
				result = context$1$0.sent;

				strictEqual(result, true);
				context$1$0.next = 26;
				return _streamline.await(_filename, 173, sparse(), 'every_', 0, null, false)(true, -1, _streamline.async(regeneratorRuntime.mark(function _$$$$32(_, val, i) {
					return regeneratorRuntime.wrap(function _$$$$32$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 > 30);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$32, this);
				}), 0, 3));

			case 26:
				result = context$1$0.sent;

				strictEqual(result, true);
				context$1$0.next = 30;
				return _streamline.await(_filename, 177, [1, 4, 9, 16], 'every_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$33(_, val, i) {
					return regeneratorRuntime.wrap(function _$$$$33$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, i);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 4);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$33, this);
				}), 0, 3));

			case 30:
				result = context$1$0.sent;

				strictEqual(result, true);
				context$1$0.next = 34;
				return _streamline.await(_filename, 181, [1, 4, 9, 16], 'every_', 0, null, false)(true, -1, _streamline.async(regeneratorRuntime.mark(function _$$$$34(_, val, i) {
					return regeneratorRuntime.wrap(function _$$$$34$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, i);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 4);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$34, this);
				}), 0, 3));

			case 34:
				result = context$1$0.sent;

				strictEqual(result, true);
				start();

			case 37:
			case 'end':
				return context$1$0.stop();
		}
	}, _$$$$25, this);
}), 0, 1));
asyncTest("every false", 9, _streamline.async(regeneratorRuntime.mark(function _$$$$35(_) {
	var result;
	return regeneratorRuntime.wrap(function _$$$$35$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				context$1$0.next = 2;
				return _streamline.await(_filename, 188, flows, 'every', 0, null, false)(true, [1, 2, 3, 4], _streamline.async(regeneratorRuntime.mark(function _$$$$36(_, val) {
					return regeneratorRuntime.wrap(function _$$$$36$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 3);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$36, this);
				}), 0, 2));

			case 2:
				result = context$1$0.sent;

				strictEqual(result, false);
				context$1$0.next = 6;
				return _streamline.await(_filename, 192, [1, 2, 3, 4], 'every_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$37(_, val) {
					return regeneratorRuntime.wrap(function _$$$$37$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 3);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$37, this);
				}), 0, 2));

			case 6:
				result = context$1$0.sent;

				strictEqual(result, false);
				context$1$0.next = 10;
				return _streamline.await(_filename, 196, [1, 2, 3, 4], 'every_', 0, null, false)(true, 2, _streamline.async(regeneratorRuntime.mark(function _$$$$38(_, val) {
					return regeneratorRuntime.wrap(function _$$$$38$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 3);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$38, this);
				}), 0, 2));

			case 10:
				result = context$1$0.sent;

				strictEqual(result, false);
				context$1$0.next = 14;
				return _streamline.await(_filename, 200, [1, 2, 3, 4], 'every_', 0, null, false)(true, {
					parallel: 2
				}, _streamline.async(regeneratorRuntime.mark(function _$$$$39(_, val) {
					return regeneratorRuntime.wrap(function _$$$$39$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 3);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$39, this);
				}), 0, 2));

			case 14:
				result = context$1$0.sent;

				strictEqual(result, false);
				context$1$0.next = 18;
				return _streamline.await(_filename, 206, [1, 2, 3, 4], 'every_', 0, null, false)(true, -1, _streamline.async(regeneratorRuntime.mark(function _$$$$40(_, val) {
					return regeneratorRuntime.wrap(function _$$$$40$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 3);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$40, this);
				}), 0, 2));

			case 18:
				result = context$1$0.sent;

				strictEqual(result, false);
				context$1$0.next = 22;
				return _streamline.await(_filename, 210, sparse(), 'every_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$41(_, val) {
					return regeneratorRuntime.wrap(function _$$$$41$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 > 40);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$41, this);
				}), 0, 2));

			case 22:
				result = context$1$0.sent;

				strictEqual(result, false);
				context$1$0.next = 26;
				return _streamline.await(_filename, 214, sparse(), 'every_', 0, null, false)(true, -1, _streamline.async(regeneratorRuntime.mark(function _$$$$42(_, val) {
					return regeneratorRuntime.wrap(function _$$$$42$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 > 40);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$42, this);
				}), 0, 2));

			case 26:
				result = context$1$0.sent;

				strictEqual(result, false);
				context$1$0.next = 30;
				return _streamline.await(_filename, 218, [1, 4, 9, 16], 'every_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$43(_, val, i) {
					return regeneratorRuntime.wrap(function _$$$$43$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, i);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 3);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$43, this);
				}), 0, 3));

			case 30:
				result = context$1$0.sent;

				strictEqual(result, false);
				context$1$0.next = 34;
				return _streamline.await(_filename, 222, [1, 4, 9, 16], 'every_', 0, null, false)(true, -1, _streamline.async(regeneratorRuntime.mark(function _$$$$44(_, val, i) {
					return regeneratorRuntime.wrap(function _$$$$44$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, i);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 3);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$44, this);
				}), 0, 3));

			case 34:
				result = context$1$0.sent;

				strictEqual(result, false);
				start();

			case 37:
			case 'end':
				return context$1$0.stop();
		}
	}, _$$$$35, this);
}), 0, 1));
asyncTest("some true", 9, _streamline.async(regeneratorRuntime.mark(function _$$$$45(_) {
	var result;
	return regeneratorRuntime.wrap(function _$$$$45$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				context$1$0.next = 2;
				return _streamline.await(_filename, 229, flows, 'some', 0, null, false)(true, [1, 2, 3, 4], _streamline.async(regeneratorRuntime.mark(function _$$$$46(_, val) {
					return regeneratorRuntime.wrap(function _$$$$46$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 3);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$46, this);
				}), 0, 2));

			case 2:
				result = context$1$0.sent;

				strictEqual(result, true);
				context$1$0.next = 6;
				return _streamline.await(_filename, 233, [1, 2, 3, 4], 'some_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$47(_, val) {
					return regeneratorRuntime.wrap(function _$$$$47$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 3);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$47, this);
				}), 0, 2));

			case 6:
				result = context$1$0.sent;

				strictEqual(result, true);
				context$1$0.next = 10;
				return _streamline.await(_filename, 237, [1, 2, 3, 4], 'some_', 0, null, false)(true, 2, _streamline.async(regeneratorRuntime.mark(function _$$$$48(_, val) {
					return regeneratorRuntime.wrap(function _$$$$48$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 3);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$48, this);
				}), 0, 2));

			case 10:
				result = context$1$0.sent;

				strictEqual(result, true);
				context$1$0.next = 14;
				return _streamline.await(_filename, 241, [1, 2, 3, 4], 'some_', 0, null, false)(true, {
					parallel: 2
				}, _streamline.async(regeneratorRuntime.mark(function _$$$$49(_, val) {
					return regeneratorRuntime.wrap(function _$$$$49$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 3);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$49, this);
				}), 0, 2));

			case 14:
				result = context$1$0.sent;

				strictEqual(result, true);
				context$1$0.next = 18;
				return _streamline.await(_filename, 247, [1, 2, 3, 4], 'some_', 0, null, false)(true, -1, _streamline.async(regeneratorRuntime.mark(function _$$$$50(_, val) {
					return regeneratorRuntime.wrap(function _$$$$50$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 3);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$50, this);
				}), 0, 2));

			case 18:
				result = context$1$0.sent;

				strictEqual(result, true);
				context$1$0.next = 22;
				return _streamline.await(_filename, 251, sparse(), 'some_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$51(_, val) {
					return regeneratorRuntime.wrap(function _$$$$51$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 > 30);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$51, this);
				}), 0, 2));

			case 22:
				result = context$1$0.sent;

				strictEqual(result, true);
				context$1$0.next = 26;
				return _streamline.await(_filename, 255, sparse(), 'some_', 0, null, false)(true, -1, _streamline.async(regeneratorRuntime.mark(function _$$$$52(_, val) {
					return regeneratorRuntime.wrap(function _$$$$52$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 > 30);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$52, this);
				}), 0, 2));

			case 26:
				result = context$1$0.sent;

				strictEqual(result, true);
				context$1$0.next = 30;
				return _streamline.await(_filename, 259, [1, 4, 9, 16], 'some_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$53(_, val, i) {
					return regeneratorRuntime.wrap(function _$$$$53$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, i);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 === 2);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$53, this);
				}), 0, 3));

			case 30:
				result = context$1$0.sent;

				strictEqual(result, true);
				context$1$0.next = 34;
				return _streamline.await(_filename, 263, [1, 4, 9, 16], 'some_', 0, null, false)(true, -1, _streamline.async(regeneratorRuntime.mark(function _$$$$54(_, val, i) {
					return regeneratorRuntime.wrap(function _$$$$54$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, i);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 === 2);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$54, this);
				}), 0, 3));

			case 34:
				result = context$1$0.sent;

				strictEqual(result, true);
				start();

			case 37:
			case 'end':
				return context$1$0.stop();
		}
	}, _$$$$45, this);
}), 0, 1));
asyncTest("some false", 9, _streamline.async(regeneratorRuntime.mark(function _$$$$55(_) {
	var result;
	return regeneratorRuntime.wrap(function _$$$$55$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				context$1$0.next = 2;
				return _streamline.await(_filename, 270, flows, 'some', 0, null, false)(true, [1, 2, 3, 4], _streamline.async(regeneratorRuntime.mark(function _$$$$56(_, val) {
					return regeneratorRuntime.wrap(function _$$$$56$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 0);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$56, this);
				}), 0, 2));

			case 2:
				result = context$1$0.sent;

				strictEqual(result, false);
				context$1$0.next = 6;
				return _streamline.await(_filename, 274, [1, 2, 3, 4], 'some_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$57(_, val) {
					return regeneratorRuntime.wrap(function _$$$$57$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 0);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$57, this);
				}), 0, 2));

			case 6:
				result = context$1$0.sent;

				strictEqual(result, false);
				context$1$0.next = 10;
				return _streamline.await(_filename, 278, [1, 2, 3, 4], 'some_', 0, null, false)(true, 2, _streamline.async(regeneratorRuntime.mark(function _$$$$58(_, val) {
					return regeneratorRuntime.wrap(function _$$$$58$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 0);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$58, this);
				}), 0, 2));

			case 10:
				result = context$1$0.sent;

				strictEqual(result, false);
				context$1$0.next = 14;
				return _streamline.await(_filename, 282, [1, 2, 3, 4], 'some_', 0, null, false)(true, {
					parallel: 2
				}, _streamline.async(regeneratorRuntime.mark(function _$$$$59(_, val) {
					return regeneratorRuntime.wrap(function _$$$$59$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 0);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$59, this);
				}), 0, 2));

			case 14:
				result = context$1$0.sent;

				strictEqual(result, false);
				context$1$0.next = 18;
				return _streamline.await(_filename, 288, [1, 2, 3, 4], 'some_', 0, null, false)(true, -1, _streamline.async(regeneratorRuntime.mark(function _$$$$60(_, val) {
					return regeneratorRuntime.wrap(function _$$$$60$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 < 0);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$60, this);
				}), 0, 2));

			case 18:
				result = context$1$0.sent;

				strictEqual(result, false);
				context$1$0.next = 22;
				return _streamline.await(_filename, 292, sparse(), 'some_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$61(_, val) {
					return regeneratorRuntime.wrap(function _$$$$61$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', !(context$2$0.t0 > 20));

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$61, this);
				}), 0, 2));

			case 22:
				result = context$1$0.sent;

				strictEqual(result, false);
				context$1$0.next = 26;
				return _streamline.await(_filename, 296, sparse(), 'some_', 0, null, false)(true, -1, _streamline.async(regeneratorRuntime.mark(function _$$$$62(_, val) {
					return regeneratorRuntime.wrap(function _$$$$62$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', !(context$2$0.t0 > 20));

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$62, this);
				}), 0, 2));

			case 26:
				result = context$1$0.sent;

				strictEqual(result, false);
				context$1$0.next = 30;
				return _streamline.await(_filename, 300, [1, 4, 9, 16], 'some_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$63(_, val, i) {
					return regeneratorRuntime.wrap(function _$$$$63$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, i);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 === 9);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$63, this);
				}), 0, 3));

			case 30:
				result = context$1$0.sent;

				strictEqual(result, false);
				context$1$0.next = 34;
				return _streamline.await(_filename, 304, [1, 4, 9, 16], 'some_', 0, null, false)(true, -1, _streamline.async(regeneratorRuntime.mark(function _$$$$64(_, val, i) {
					return regeneratorRuntime.wrap(function _$$$$64$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, i);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 === 9);

							case 4:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$64, this);
				}), 0, 3));

			case 34:
				result = context$1$0.sent;

				strictEqual(result, false);
				start();

			case 37:
			case 'end':
				return context$1$0.stop();
		}
	}, _$$$$55, this);
}), 0, 1));
asyncTest("reduce", 3, _streamline.async(regeneratorRuntime.mark(function _$$$$65(_) {
	var result;
	return regeneratorRuntime.wrap(function _$$$$65$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				context$1$0.next = 2;
				return _streamline.await(_filename, 311, flows, 'reduce', 0, null, false)(true, [1, 2, 3, 4], _streamline.async(regeneratorRuntime.mark(function _$$$$66(_, v, val) {
					return regeneratorRuntime.wrap(function _$$$$66$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.t0 = v;
								context$2$0.next = 3;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 3:
								context$2$0.t1 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 * context$2$0.t1);

							case 5:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$66, this);
				}), 0, 3), 1);

			case 2:
				result = context$1$0.sent;

				strictEqual(result, 24);
				context$1$0.next = 6;
				return _streamline.await(_filename, 315, [1, 2, 3, 4], 'reduce_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$67(_, v, val) {
					return regeneratorRuntime.wrap(function _$$$$67$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.t0 = v;
								context$2$0.next = 3;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 3:
								context$2$0.t1 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 * context$2$0.t1);

							case 5:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$67, this);
				}), 0, 3), 1);

			case 6:
				result = context$1$0.sent;

				strictEqual(result, 24);
				context$1$0.next = 10;
				return _streamline.await(_filename, 319, sparse(), 'reduce_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$68(_, v, val, i) {
					return regeneratorRuntime.wrap(function _$$$$68$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.t0 = v + '/';
								context$2$0.next = 3;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 3:
								context$2$0.t1 = context$2$0.sent;
								context$2$0.t2 = context$2$0.t0 + context$2$0.t1;
								context$2$0.t3 = i;
								return context$2$0.abrupt('return', context$2$0.t2 + context$2$0.t3);

							case 7:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$68, this);
				}), 0, 4), '');

			case 10:
				result = context$1$0.sent;

				strictEqual(result, '/332/445/997');
				start();

			case 13:
			case 'end':
				return context$1$0.stop();
		}
	}, _$$$$65, this);
}), 0, 1));
asyncTest("reduceRight", 3, _streamline.async(regeneratorRuntime.mark(function _$$$$69(_) {
	var result;
	return regeneratorRuntime.wrap(function _$$$$69$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				context$1$0.next = 2;
				return _streamline.await(_filename, 326, flows, 'reduceRight', 0, null, false)(true, [1, 2, 3, 4], _streamline.async(regeneratorRuntime.mark(function _$$$$70(_, v, val) {
					return regeneratorRuntime.wrap(function _$$$$70$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.t0 = v;
								context$2$0.next = 3;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 3:
								context$2$0.t1 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 * context$2$0.t1);

							case 5:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$70, this);
				}), 0, 3), 1);

			case 2:
				result = context$1$0.sent;

				strictEqual(result, 24);
				context$1$0.next = 6;
				return _streamline.await(_filename, 330, [1, 2, 3, 4], 'reduceRight_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$71(_, v, val) {
					return regeneratorRuntime.wrap(function _$$$$71$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.t0 = v;
								context$2$0.next = 3;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 3:
								context$2$0.t1 = context$2$0.sent;
								return context$2$0.abrupt('return', context$2$0.t0 * context$2$0.t1);

							case 5:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$71, this);
				}), 0, 3), 1);

			case 6:
				result = context$1$0.sent;

				strictEqual(result, 24);
				context$1$0.next = 10;
				return _streamline.await(_filename, 334, sparse(), 'reduceRight_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$72(_, v, val, i) {
					return regeneratorRuntime.wrap(function _$$$$72$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.t0 = v + '/';
								context$2$0.next = 3;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, val);

							case 3:
								context$2$0.t1 = context$2$0.sent;
								context$2$0.t2 = context$2$0.t0 + context$2$0.t1;
								context$2$0.t3 = i;
								return context$2$0.abrupt('return', context$2$0.t2 + context$2$0.t3);

							case 7:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$72, this);
				}), 0, 4), '');

			case 10:
				result = context$1$0.sent;

				strictEqual(result, '/997/445/332');
				start();

			case 13:
			case 'end':
				return context$1$0.stop();
		}
	}, _$$$$69, this);
}), 0, 1));
asyncTest("sort", 4, _streamline.async(regeneratorRuntime.mark(function _$$$$73(_) {
	var array;
	return regeneratorRuntime.wrap(function _$$$$73$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				array = [1, 2, 3, 4];
				context$1$0.next = 3;
				return _streamline.await(_filename, 342, flows, 'sort', 0, null, false)(true, array, _streamline.async(regeneratorRuntime.mark(function _$$$$74(_, a, b) {
					return regeneratorRuntime.wrap(function _$$$$74$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, a - b);

							case 2:
								return context$2$0.abrupt('return', context$2$0.sent);

							case 3:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$74, this);
				}), 0, 3));

			case 3:
				deepEqual(array, [1, 2, 3, 4], "In order array sort ok");
				context$1$0.next = 6;
				return _streamline.await(_filename, 346, array, 'sort_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$75(_, a, b) {
					return regeneratorRuntime.wrap(function _$$$$75$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, a - b);

							case 2:
								return context$2$0.abrupt('return', context$2$0.sent);

							case 3:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$75, this);
				}), 0, 3));

			case 6:
				deepEqual(array, [1, 2, 3, 4], "In order array sort ok");
				array = [4, 3, 2, 1];
				context$1$0.next = 10;
				return _streamline.await(_filename, 351, array, 'sort_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$76(_, a, b) {
					return regeneratorRuntime.wrap(function _$$$$76$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, a - b);

							case 2:
								return context$2$0.abrupt('return', context$2$0.sent);

							case 3:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$76, this);
				}), 0, 3));

			case 10:
				deepEqual(array, [1, 2, 3, 4], "Reverse array sort ok");
				array = [3, 1, 2, 4];
				context$1$0.next = 14;
				return _streamline.await(_filename, 356, array, 'sort_', 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$77(_, a, b) {
					return regeneratorRuntime.wrap(function _$$$$77$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, null, null, delay, 0, null, false)(true, a - b);

							case 2:
								return context$2$0.abrupt('return', context$2$0.sent);

							case 3:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$77, this);
				}), 0, 3));

			case 14:
				deepEqual(array, [1, 2, 3, 4], "Random array sort ok");
				start();

			case 16:
			case 'end':
				return context$1$0.stop();
		}
	}, _$$$$73, this);
}), 0, 1));
asyncTest("collectAll", 4, _streamline.async(regeneratorRuntime.mark(function _$$$$78(_) {
	var doIt, total, peak, count, results;
	return regeneratorRuntime.wrap(function _$$$$78$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				doIt = function doIt(i) {
					return _streamline.async(regeneratorRuntime.mark(function _$$$$79(_) {
						return regeneratorRuntime.wrap(function _$$$$79$(context$3$0) {
							while (1) switch (context$3$0.prev = context$3$0.next) {
								case 0:
									count++;
									peak = Math.max(count, peak);
									context$3$0.next = 4;
									return _streamline.await(_filename, 371, null, setTimeout, 0, null, false)(true, 10);

								case 4:
									context$3$0.next = 6;
									return _streamline.await(_filename, 372, null, delay, 0, null, false)(true, i);

								case 6:
									context$3$0.t0 = context$3$0.sent;
									context$3$0.t1 = total;
									total = context$3$0.t0 + context$3$0.t1;

									count--;
									return context$3$0.abrupt('return', 2 * i);

								case 11:
								case 'end':
									return context$3$0.stop();
							}
						}, _$$$$79, this);
					}), 0, 1);
				};

				total = 0;
				peak = 0;
				count = 0;
				context$1$0.next = 6;
				return _streamline.await(_filename, 378, flows.spray([doIt(1), doIt(2), doIt(3)]), 'collectAll', 0, null, false)(true);

			case 6:
				results = context$1$0.sent;

				equal(total, 6);
				ok(peak >= 2);
				equal(count, 0);
				deepEqual(results, [2, 4, 6]);
				start();

			case 12:
			case 'end':
				return context$1$0.stop();
		}
	}, _$$$$78, this);
}), 0, 1));
asyncTest("collectOne", 4, _streamline.async(regeneratorRuntime.mark(function _$$$$80(_) {
	var doIt, total, peak, count, result;
	return regeneratorRuntime.wrap(function _$$$$80$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				doIt = function doIt(i) {
					return _streamline.async(regeneratorRuntime.mark(function _$$$$81(_) {
						return regeneratorRuntime.wrap(function _$$$$81$(context$3$0) {
							while (1) switch (context$3$0.prev = context$3$0.next) {
								case 0:
									count++;
									peak = Math.max(count, peak);
									context$3$0.next = 4;
									return _streamline.await(_filename, 394, null, setTimeout, 0, null, false)(true, 10);

								case 4:
									context$3$0.next = 6;
									return _streamline.await(_filename, 395, null, delay, 0, null, false)(true, i);

								case 6:
									context$3$0.t0 = context$3$0.sent;
									context$3$0.t1 = total;
									total = context$3$0.t0 + context$3$0.t1;

									count--;
									return context$3$0.abrupt('return', 2 * i);

								case 11:
								case 'end':
									return context$3$0.stop();
							}
						}, _$$$$81, this);
					}), 0, 1);
				};

				total = 0;
				peak = 0;
				count = 0;
				context$1$0.next = 6;
				return _streamline.await(_filename, 401, flows.spray([doIt(1), doIt(2), doIt(3)]), 'collectOne', 0, null, false)(true);

			case 6:
				result = context$1$0.sent;

				ok(total == 1 || total == 2);
				ok(peak >= 2);
				ok(count > 0);
				ok(result == 2 || result == 4);
				start();

			case 12:
			case 'end':
				return context$1$0.stop();
		}
	}, _$$$$80, this);
}), 0, 1));
asyncTest("collectAll with limit", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$82(_) {
	var doIt, total, peak, count, results;
	return regeneratorRuntime.wrap(function _$$$$82$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				doIt = function doIt(i) {
					return _streamline.async(regeneratorRuntime.mark(function _$$$$83(_) {
						return regeneratorRuntime.wrap(function _$$$$83$(context$3$0) {
							while (1) switch (context$3$0.prev = context$3$0.next) {
								case 0:
									count++;
									peak = Math.max(count, peak);
									context$3$0.next = 4;
									return _streamline.await(_filename, 417, null, setTimeout, 0, null, false)(true, 10);

								case 4:
									context$3$0.next = 6;
									return _streamline.await(_filename, 418, null, delay, 0, null, false)(true, i);

								case 6:
									context$3$0.t0 = context$3$0.sent;
									context$3$0.t1 = total;
									total = context$3$0.t0 + context$3$0.t1;

									count--;
									return context$3$0.abrupt('return', 2 * i);

								case 11:
								case 'end':
									return context$3$0.stop();
							}
						}, _$$$$83, this);
					}), 0, 1);
				};

				total = 0;
				peak = 0;
				count = 0;
				context$1$0.next = 6;
				return _streamline.await(_filename, 424, flows.spray([doIt(1), doIt(2), doIt(3)], 2), 'collectAll', 0, null, false)(true);

			case 6:
				results = context$1$0.sent;

				deepEqual([total, peak, count, results], [6, 2, 0, [2, 4, 6]]);
				start();

			case 9:
			case 'end':
				return context$1$0.stop();
		}
	}, _$$$$82, this);
}), 0, 1));
asyncTest("contexts", 3, _streamline.async(regeneratorRuntime.mark(function _$$$$84(_) {
	var testContext, result;
	return regeneratorRuntime.wrap(function _$$$$84$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				testContext = _streamline.async(regeneratorRuntime.mark(function _$$testContext$$(_, x) {
					var y;
					return regeneratorRuntime.wrap(function _$$testContext$$$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								flows.setContext({
									val: x
								});
								context$2$0.next = 3;
								return _streamline.await(_filename, 433, null, delay, 0, null, false)(true, 2 * x);

							case 3:
								y = context$2$0.sent;

								strictEqual(y, 2 * flows.getContext().val);
								return context$2$0.abrupt('return', y + 1);

							case 6:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$testContext$$, this);
				}), 0, 2);
				context$1$0.next = 3;
				return _streamline.await(_filename, 438, flows.spray([_streamline.async(regeneratorRuntime.mark(function _$$$$85(_) {
					return regeneratorRuntime.wrap(function _$$$$85$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, 441, null, testContext, 0, null, false)(true, 3);

							case 2:
								return context$2$0.abrupt('return', context$2$0.sent);

							case 3:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$85, this);
				}), 0, 1), _streamline.async(regeneratorRuntime.mark(function _$$$$86(_) {
					return regeneratorRuntime.wrap(function _$$$$86$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, 445, null, testContext, 0, null, false)(true, 5);

							case 2:
								return context$2$0.abrupt('return', context$2$0.sent);

							case 3:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$86, this);
				}), 0, 1)]), 'collectAll', 0, null, false)(true);

			case 3:
				result = context$1$0.sent;

				deepEqual(result, [7, 11]);
				start();

			case 6:
			case 'end':
				return context$1$0.stop();
		}
	}, _$$$$84, this);
}), 0, 1));

asyncTest("futures multiplex", 3, _streamline.async(regeneratorRuntime.mark(function _$$$$87(_) {
	var doIt, result1, result2, result3, f1, f10;
	return regeneratorRuntime.wrap(function _$$$$87$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				doIt = _streamline.async(regeneratorRuntime.mark(function _$$doIt$$(future, _) {
					return regeneratorRuntime.wrap(function _$$doIt$$$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, 459, null, future, 0, null, false)(true);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								context$2$0.t1 = result1;
								result1 = context$2$0.t0 + context$2$0.t1;
								context$2$0.next = 7;
								return _streamline.await(_filename, 460, null, future, 0, null, false)(true);

							case 7:
								context$2$0.t2 = context$2$0.sent;
								context$2$0.t3 = result2;
								result2 = context$2$0.t2 + context$2$0.t3;
								context$2$0.next = 12;
								return _streamline.await(_filename, 461, null, delay, 0, null, false)(true);

							case 12:
								context$2$0.next = 14;
								return _streamline.await(_filename, 462, null, future, 0, null, false)(true);

							case 14:
								context$2$0.t4 = context$2$0.sent;
								context$2$0.t5 = result3;
								result3 = context$2$0.t4 + context$2$0.t5;

							case 17:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$doIt$$, this);
				}), 1, 2);
				result1 = 0;
				result2 = 0;
				result3 = 0;
				f1 = _streamline.future(_filename, 465, null, delay, 0, null, false)(false, 1);
				f10 = _streamline.future(_filename, 466, null, delay, 0, null, false)(false, 10);
				context$1$0.next = 8;
				return _streamline.await(_filename, 468, flows, 'collect', 0, null, false)(true, [_streamline.future(_filename, null, null, doIt, 1, null, false)(f1, false), _streamline.future(_filename, null, null, doIt, 1, null, false)(f10, false), _streamline.future(_filename, null, null, doIt, 1, null, false)(f1, false)]);

			case 8:

				deepEqual(result1, 12);
				deepEqual(result2, 12);
				deepEqual(result3, 12);
				start();

			case 12:
			case 'end':
				return context$1$0.stop();
		}
	}, _$$$$87, this);
}), 0, 1));

asyncTest("trampoline", 1, _streamline.async(regeneratorRuntime.mark(function _$$$$88(_) {
	var sums;
	return regeneratorRuntime.wrap(function _$$$$88$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				sums = _streamline.async(regeneratorRuntime.mark(function _$$sums$$(_, n) {
					var fn;
					return regeneratorRuntime.wrap(function _$$sums$$$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								fn = _streamline.async(regeneratorRuntime.mark(function _$$fn$$(_) {
									return regeneratorRuntime.wrap(function _$$fn$$$(context$3$0) {
										while (1) switch (context$3$0.prev = context$3$0.next) {
											case 0:
												if (!(n > 0)) {
													context$3$0.next = 8;
													break;
												}

												context$3$0.t1 = n;
												context$3$0.next = 4;
												return _streamline.await(_filename, 479, null, sums, 0, null, false)(true, n - 1);

											case 4:
												context$3$0.t2 = context$3$0.sent;
												context$3$0.t0 = context$3$0.t1 + context$3$0.t2;
												context$3$0.next = 9;
												break;

											case 8:
												context$3$0.t0 = 0;

											case 9:
												return context$3$0.abrupt('return', context$3$0.t0);

											case 10:
											case 'end':
												return context$3$0.stop();
										}
									}, _$$fn$$, this);
								}), 0, 1);

								if (!(n % 1000 === 0)) {
									context$2$0.next = 7;
									break;
								}

								context$2$0.next = 4;
								return _streamline.await(_filename, 481, flows, 'trampoline', 0, null, false)(true, fn);

							case 4:
								return context$2$0.abrupt('return', context$2$0.sent);

							case 7:
								context$2$0.next = 9;
								return _streamline.await(_filename, 482, null, fn, 0, null, false)(true);

							case 9:
								return context$2$0.abrupt('return', context$2$0.sent);

							case 10:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$sums$$, this);
				}), 0, 2);
				context$1$0.next = 3;
				return _streamline.await(_filename, 484, null, sums, 0, null, false)(true, 100000);

			case 3:
				context$1$0.t0 = context$1$0.sent;
				context$1$0.t1 = 50000 * 100001;
				equals(context$1$0.t0, context$1$0.t1);

				start();

			case 7:
			case 'end':
				return context$1$0.stop();
		}
	}, _$$$$88, this);
}), 0, 1));

asyncTest("queue overflow", 5, _streamline.async(regeneratorRuntime.mark(function _$$$$89(_) {
	var queue, produce, consume;
	return regeneratorRuntime.wrap(function _$$$$89$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				queue = flows.queue(2);
				produce = _streamline.future(_filename, 491, null, _streamline.async(regeneratorRuntime.mark(function _$$$$90(_) {
					return regeneratorRuntime.wrap(function _$$$$90$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, 492, queue, 'write', 0, null, false)(true, 4);

							case 2:
								context$2$0.next = 4;
								return _streamline.await(_filename, 493, queue, 'write', 0, null, false)(true, 9);

							case 4:
								context$2$0.next = 6;
								return _streamline.await(_filename, 494, queue, 'write', 0, null, false)(true, 16);

							case 6:
								context$2$0.next = 8;
								return _streamline.await(_filename, 495, queue, 'write', 0, null, false)(true, 25);

							case 8:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$90, this);
				}), 0, 1), 0, null, false)(false);
				consume = _streamline.future(_filename, 497, null, _streamline.async(regeneratorRuntime.mark(function _$$$$91(_) {
					return regeneratorRuntime.wrap(function _$$$$91$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _streamline.await(_filename, 498, queue, 'read', 0, null, false)(true);

							case 2:
								context$2$0.t0 = context$2$0.sent;
								strictEqual(context$2$0.t0, 4);
								context$2$0.next = 6;
								return _streamline.await(_filename, 499, queue, 'read', 0, null, false)(true);

							case 6:
								context$2$0.t1 = context$2$0.sent;
								strictEqual(context$2$0.t1, 9);
								context$2$0.next = 10;
								return _streamline.await(_filename, 500, queue, 'read', 0, null, false)(true);

							case 10:
								context$2$0.t2 = context$2$0.sent;
								strictEqual(context$2$0.t2, 16);
								context$2$0.next = 14;
								return _streamline.await(_filename, 501, queue, 'read', 0, null, false)(true);

							case 14:
								context$2$0.t3 = context$2$0.sent;
								strictEqual(context$2$0.t3, 25);

							case 16:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$$$91, this);
				}), 0, 1), 0, null, false)(false);
				context$1$0.next = 5;
				return _streamline.await(_filename, 503, null, produce, 0, null, false)(true);

			case 5:
				context$1$0.next = 7;
				return _streamline.await(_filename, 504, null, consume, 0, null, false)(true);

			case 7:
				strictEqual(queue.peek(), undefined);
				start();

			case 9:
			case 'end':
				return context$1$0.stop();
		}
	}, _$$$$89, this);
}), 0, 1));

asyncTest("queue length, contents, alter", 8, _streamline.async(regeneratorRuntime.mark(function _$$$$92(_) {
	var queue;
	return regeneratorRuntime.wrap(function _$$$$92$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				queue = flows.queue();
				context$1$0.next = 3;
				return _streamline.await(_filename, 511, queue, 'write', 0, null, false)(true, 4);

			case 3:
				context$1$0.next = 5;
				return _streamline.await(_filename, 512, queue, 'write', 0, null, false)(true, 9);

			case 5:
				context$1$0.next = 7;
				return _streamline.await(_filename, 513, queue, 'write', 0, null, false)(true, 16);

			case 7:
				context$1$0.next = 9;
				return _streamline.await(_filename, 514, queue, 'write', 0, null, false)(true, 25);

			case 9:
				strictEqual(queue.length, 4);
				strictEqual(queue.peek(), 4);
				deepEqual(queue.contents(), [4, 9, 16, 25]);
				queue.adjust(function (arr) {
					return [arr[3], arr[1]];
				});
				strictEqual(queue.peek(), 25);
				context$1$0.next = 16;
				return _streamline.await(_filename, 522, queue, 'read', 0, null, false)(true);

			case 16:
				context$1$0.t0 = context$1$0.sent;
				strictEqual(context$1$0.t0, 25);

				strictEqual(queue.peek(), 9);
				context$1$0.next = 21;
				return _streamline.await(_filename, 524, queue, 'read', 0, null, false)(true);

			case 21:
				context$1$0.t1 = context$1$0.sent;
				strictEqual(context$1$0.t1, 9);

				strictEqual(queue.peek(), undefined);
				start();

			case 25:
			case 'end':
				return context$1$0.stop();
		}
	}, _$$$$92, this);
}), 0, 1));

asyncTest("trampoline preserves context", 2, _streamline.async(regeneratorRuntime.mark(function _$$$$93(_) {
	var globals, fn, result;
	return regeneratorRuntime.wrap(function _$$$$93$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				globals = require('streamline/lib/globals');
				fn = _streamline.async(regeneratorRuntime.mark(function _$$fn$$2(_) {
					return regeneratorRuntime.wrap(function _$$fn$$2$(context$2$0) {
						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								return context$2$0.abrupt('return', globals.context.val);

							case 1:
							case 'end':
								return context$2$0.stop();
						}
					}, _$$fn$$2, this);
				}), 0, 1);

				globals.context.val = "abc";
				context$1$0.next = 5;
				return _streamline.await(_filename, 535, flows, 'trampoline', 0, null, false)(true, fn);

			case 5:
				result = context$1$0.sent;

				strictEqual(result, "abc");
				strictEqual(globals.context.val, "abc");
				start();

			case 9:
			case 'end':
				return context$1$0.stop();
		}
	}, _$$$$93, this);
}), 0, 1));

// must produce and consume in parallel to avoid deadlock

},{"regenerator/runtime":11,"streamline-runtime/lib/builtins-callbacks":2,"streamline-runtime/lib/runtime-callbacks":6,"streamline/lib/globals":8,"streamline/lib/util/flows":9}]},{},[12]);
