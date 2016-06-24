# streamline.js

`streamline.js` is a language tool to simplify asynchronous Javascript programming.

tldr; See [Cheat Sheet](CHEAT-SHEET.md)

Instead of writing hairy code like:

```javascript
function archiveOrders(date, cb) {
  db.connect(function(err, conn) {
    if (err) return cb(err);
    conn.query("select * from orders where date < ?", [date], function(err, orders) {
      if (err) return cb(err);
      helper.each(orders, function(order, next) {
        conn.execute("insert into archivedOrders ...", [order.id, ...], function(err) {
          if (err) return cb(err);
          conn.execute("delete from orders where id=?", [order.id], function(err) {
            if (err) return cb(err);
            next();
          });
        });
      }, function() {
        console.log("orders have been archived");
        cb();
      });
    });
  });
}
```

you write:

```javascript
function archiveOrders(date, _) {
  var conn = db.connect(_);
  conn.query("select * from orders where date < ?", [date], _).forEach_(_, function(_, order) {
    conn.execute("insert into archivedOrders ...", [order.id, ...], _);
    conn.execute("delete from orders where id=?", [order.id], _);
  });
  console.log("orders have been archived");
}
```

and streamline transforms the code and takes care of the callbacks!

No control flow APIs to learn! You just have to follow a simple rule:

> Replace all callbacks by an underscore and write your code as if all functions were synchronous.

Streamline is not limited to a subset of Javascript. 
You can use all the features of Javascript in your asynchronous code: conditionals, 
loops, `try/catch/finally` blocks, anonymous functions, chaining, `this`, etc. 

Streamline also provides _futures_, and asynchronous variants of the EcmaScript 5 array functions (`forEach`, `map`, etc.).

## News

The latest cool feature is **TypeScript** support. See https://github.com/Sage/streamlinejs/wiki/TypeScript-support for details.

Streamline 1.0 was a major revamp as a Babel Plugin. Streamline 2.0 was a smaller step from Babel 5 to Babel 6. 
See https://github.com/Sage/streamlinejs/wiki/Babel-upgrade for details.

## Installation

NPM, of course: 

```sh
npm install streamline -g
```

The `-g` option installs streamline _globally_.

You can also install it _locally_ (without `-g`) but then the `_node` and `_coffee` 
commands will not be in your default PATH.

Note: If you encounter a permission error when installing on UNIX systems, you should retry with `sudo`. 

**Warning**: you may get errors during install because fibers is now installed as an optional package and it may fail to build. But this package is optional and **streamline itself should install fine**. 

## Hello World

Streamline modules have `._js` or `._coffee` extensions and you run them with `_node` or `_coffee`.

Example:

``` sh
$ cat > hello._js
console.log('hello ...');
setTimeout(_, 1000);
console.log('... world');
^D
$ _node hello
```

You can also create standalone shell utilities. See [this example](examples/shebang/shebang.sh).

## Compiling and writing loaders

You can also set up your code so that it can be run directly with `node` or `coffee`.
You have two options here:

The first one is to compile your source. The recommanded way is with babel's CLI (see [babel-plugin-streamline](https://github.com/Sage/babel-plugin-streamline)). But you can still use streamline's CLI (`_node -c myfile._js` or `_coffee -c myfile._coffee`)

The second one is to create a loader which will register `require` hooks for the `._js` and `._coffee` extensions. See [this example](examples/loader/loader.md).

Compiling will give you the fastest startup time because node will directly load the compiled `*.js` files but the [registration API](lib/index.md) has a `cache` option which comes close.

The recommandation is to use the loader during development but deploy precompiled files.

# Runtime dependencies

The runtime library is provided as a separate [`streamline-runtime`](https://www.npmjs.com/package/streamline-runtime) package.

If you deploy precompiled files you only need `streamline-runtime`.

If your application/library uses a loader you will need to deploy both `streamline-runtime` and `streamline` with it.

## Browser-side use

You have two options to use streamline in the browser:

* You can transform and bundle your files with browserify. See how the [build.js](build.js) script builds the `test/browser/*-test.js files for an example.
* You can also transform the code in the browser with the `transform` API. All the necessary JS code is available as a single `lib/browser/transform.js` file. See the [streamlineMe example](https://github.com/Sage/streamlinejs/blob/master/examples/streamlineMe).

## Generation options

Streamline can transform the code for several target runtimes:

* _callbacks_. The transformed code will be pure ES5 code. It should be compatible with all JavaScript engines.
* _fibers_. The transformed code will take advantage of the [fibers library](https://github.com/laverdet/node-fibers). This option is only available server-side.
* _generators_. The transformed code will take advantage of JavaScript generators. It will run in node.js 0.12 (with the `--harmony` flag), in node.js 4.0 (without any special flag) and in latest browsers.
* _await_. The transformed code will take advantage of ES7 async/await. 

The choice of a target runtime should be driven by benchmarks:

* The _fibers_ mode gives superior development experience (because it uses real stacks for each fiber so you can step over async calls). It is also very efficient in production if your code traverses many layers of asynchronous calls. 
* The _callbacks_ transform is obtained by chaining the _generators_ transform and the [regenerator transform](https://github.com/facebook/regenerator). It is less efficent than the _generators_ transform and we recommend that you use _generators_ if generators are supported by your target JavaScript engine and that you only use _callbacks_ if you target a legacy JavaScript engine.
* The _await_ mode is experimental at this stage. It relies on an emulation as async/await is not yet available natively in JavaScript engines.

You can control the target runtime with the `--runtime (callbacks|fibers|generators|await)` CLI option, or with the `runtime` API option.
 
## Interoperability with standard node.js code

You can call standard node functions from streamline code. For example the `fs.readFile` function:

``` javascript
function lineCount(path, _) {
  return fs.readFile(path, "utf8", _).split('\n').length;
}
```

You can also call streamline functions as if they were standard node functions. For example, the `lineCount` function that we just defined above can be called as follows in standard node.js style:

``` javascript
lineCount("README.md", function(err, result) {
  if (err) return console.error("ERROR: " + err.message);
  console.log("README has " + result + " lines.");
});
```

You can mix streamline functions, classical callback based code and synchrononous functions in the same file. 

Streamline only transforms the functions that have the special `_` parameter. 

Note: this works with all transformation options. 
Even if you use the _fibers_ option, you can seamlessly call standard callback based node APIs 
and the asynchronous functions that you create with streamline have the standard node callback signature.

## Interoperability with promises

Streamline also provides seamless interoperability with Promise libraries, in both directions.

First, you can consume promises from streamline code, by passing two underscores to their `then` method:

```
function myStreamlineFunction(p1, p2, _) {
  var result = functionReturningAPromise(p1, p2).then(_, _);
  // do something with result
}
```

Note: if the promise fails the error will be propagated as an exception and you can catch it with `try/catch`.

In the other direction you can get a promise from any callback-based asynchronous function by passing `void _` instead of `_`. For example:

``` javascript
function readFileWithPromise(path) {
  var p = fs.readFile(path, 'utf8', void _);
  // p is a promise.
  p.then(function(result) {
    // do something with result
  }, function(err) {
    // handle error
  });
}
```

## Futures

Streamline also provides _futures_. Futures are like promises, without all the bells and whistles. They let you parallelize I/O operations in a very simple manner. 

If you pass `!_` instead of `_` when calling a streamline function, the function returns a _future_. The _future_ is just a regular node.js asynchronous function that you can call later to obtain the result. Here is an example:

```javascript
function countLines(path, _) {
  return fs.readFile(path, "utf8", _).split('\n').length;
}

function compareLineCounts(path1, path2, _) {
  // parallelize the two countLines operations
  var n1 = countLines(path1, !_);
  var n2 = countLines(path2, !_);
  // get the results and diff them
  return n1(_) - n2(_);
}
```

In this example, `countLines` is called twice with `!_`. These calls start the `fs.readFile` asynchronous operations and return immediately two _futures_ (`n1` and `n2`). The `return` statement retrieves the results with `n1(_)` and `n2(_)` calls and computes their difference. 

See the [futures](https://github.com/Sage/streamlinejs/wiki/Futures) wiki page for details.

The [flows module](https://github.com/Sage/streamline-runtime/blob/master/src/flows.md) contains utilities to deal with futures. For example `flows.collect` to wait on an array of futures and `flows.funnel` to limit the number of concurrent operations.

## Asynchronous Array functions

Streamline extends the Array prototype with asynchronous variants of the EcmaScript 5 `forEach`, `map`, `filter`, `reduce`, ... functions. These asynchronous variants are postfixed with an underscore and they take an extra `_` argument (their callback too), but they are otherwise similar to the standard ES5 functions. Here is an example with the `map_` function:

``` javascript
function dirLines(dir, _) {
  return fs.readdir(dir, _).map_(_, function(_, file) {
    return fs.readFile(dir + '/' + file, 'utf8', _).split('\n').length;
  });
}
```

Parallelizing loops is easy: just pass the number of parallel operations as second argument to the call:

``` javascript
function dirLines(dir, _) {
  // process 8 files in parallel
  return fs.readdir(dir, _).map_(_, 8, function(_, file) {
    return fs.readFile(dir + '/' + file, 'utf8', _).split('\n').length;
  });
}
```

If you don't want to limit the level of parallelism, just pass `-1`.

See the documentation of the [builtins module](https://github.com/Sage/streamline-runtime/blob/master/src/builtins.md) for details.

## Exception Handling

Streamline lets you do your exception handling with the usual `try/catch` construct. The `finally` clause is also fully supported.

Streamline overrides the `ex.stack` getter to give you complete comprehensive stacktrace information. In _callbacks_ and _generators_ modes you get two stack traces:

* the _raw_ stack trace of the last callback.
* the _async_ stack trace of the asynchronous calls that caused the exception.

In _fibers_ mode there is a single stack trace.

Exception handling also works with futures and promises.
If a future throws an exception before you try to read its result, the exception is memorized by the future and you get it at the point where your try to read the future's result. 
For example:

``` javascript
try {
  var n1 = countLines(badPath, !_);
  var n2 = countLines(goodPath, !_);
  setTimeout(_, 1000); // n1 fails, exception is memorized
  return n1(_) - n2(_); // exception is thrown by n1(_) expression.
} catch (ex) {
  console.error(ex.stack); // exception caught here
}
```

## Special callbacks

### multiple results

Some APIs return several results through their callback. For example:

``` javascript
request(options, function(err, response, body) {
  // ...
});
```

You can get all the results by passing `[_]` instead of `_`:

``` javascript
var results = request(options, [_]);
// will be better with destructuring assignment.
var response = results[0];
var body = results[1];
```

Note: if you only need the first result you can pass `_`:

``` javascript
var response = request(options, _);
```

### callback + errback

Some APIs don't follow the standard _error first_ callback convention of node.js. Instead, the accept a pair of callback and errback arguments. Streamline lets you call them by passing two `_` arguments. For example:

``` javascript
function nodeStyleFn(arg, _) {
  return callbackErrbackStyleFn(arg, _, _);
}
```

As seen above, this feature is used in the promise interop: `result = promise.then(_, _)` is just a special case.

It can also be used to handle the special _error-less_ callback of `fs.exists`:

``` javascript
function fileExists(path, _) {
  // the second _ is ignored by fs.exists!
  return fs.exists(path, _, _);
}
```

## CoffeeScript support

CoffeeScript is fully supported. 

## Debugging with source maps

You can seamlessly debug streamline code thanks to [JavaScript source maps](http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/). See [this video](https://www.youtube.com/watch?v=duC1Sqy66IE) for a quick demo.

To activate this feature, pass the `--source-map` options to `_node` or `_coffee`, or set the `sourceMap` option if you register via a loader.

## Examples

The [tutorial](https://github.com/Sage/streamlinejs/blob/master/tutorial/tutorial.md) shows streamline.js in action on a simple _search aggregator_ application.

The [diskUsage](https://github.com/Sage/streamlinejs/blob/master/examples/diskUsage) examples show an asynchronous directory traversal that computes disk usage.

The [loader](https://github.com/Sage/streamlinejs/blob/master/examples/loader) examples demonstrate how you can enable the `._js` and `._coffee` require hooks.

# Online demo

You can see how streamline transforms the code by playing with the [online demo](http://sage.github.com/streamlinejs/examples/streamlineMe/streamlineMe.html).

## Troubleshooting

Read the [FAQ](https://github.com/Sage/streamlinejs/blob/master/FAQ.md).

If you don't find your answer in the FAQ, post to the [mailing list](http://groups.google.com/group/streamlinejs), or file an issue in [GitHub's issue tracking](https://github.com/Sage/streamlinejs/issues).

## Related Packages

The following packages are installed together with streamline:

* [babel-plugin-streamline](https://github.com/Sage/babel-plugin-streamline): babel plug-in which transforms streamline code.
* [streamline-runtime](https://github.com/Sage/streamline-runtime): runtime that you should distribute with compiled modules.

The following packages extend the power of streamline:

* [express-streamline](https://github.com/aseemk/express-streamline): interop with express
* [streamline-express](https://github.com/sethyuan/streamline-express): interop with express
* [ez-streams](https://github.com/Sage/ez-streams): streams and transforms for streamline.
* [streamline-flamegraph](https://github.com/Sage/streamline-flamegraph): flamegraph monitoring.

## Resources

The [tutorial](https://github.com/Sage/streamlinejs/blob/master/tutorial/tutorial.md) and [FAQ](https://github.com/Sage/streamlinejs/blob/master/FAQ.md) are must-reads for starters.

The API is documented [here](https://github.com/Sage/streamlinejs/blob/master/API.md).

For support and discussion, please join the [streamline.js mailing list](http://groups.google.com/group/streamlinejs).

## Credits

See the [AUTHORS](https://github.com/Sage/streamlinejs/blob/master/AUTHORS) file.

Special thanks to Marcel Laverdet who contributed the _fibers_ implementation and to Geoffry Song who contributed source map support (in 0.x versions).

## License

[MIT](LICENSE)
