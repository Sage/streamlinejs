# streamline.js

`streamline.js` is a language tool to simplify asynchronous Javascript programming.

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

# Installation

NPM, of course: 

```sh
npm install streamline -g
```

The `-g` option installs streamline _globally_.
You can also install it _locally_, without `-g` but then the `_node` and `_coffee` 
commands will not be in your default PATH.

Note: If you encounter a permission error when installing on UNIX systems, you should retry with `sudo`. 

If you want to use the _fibers_ option (see below), you must also install the fibers library:

```sh
npm install fibers [-g]
```

# Cool demo

http://coolwanglu.github.io/vim.js/web/vim.html (emscripten + streamline.js + @coolwanglu's magic touch).

# Hello World

Streamline modules have `._js` or `._coffee` extensions and you run them with the `_node` or `_coffee` 
loader.

Javascripters:

``` sh
$ cat > hello._js
console.log('hello ...');
setTimeout(_, 1000);
console.log('... world');
^D
$ _node hello
```

Coffeescripters:

``` sh
$ cat > hello._coffee
console.log 'hello ...'
setTimeout _, 1000
console.log '... world'
^D
$ _coffee hello
```

You can also create standalone shell utilities:

``` sh
$ cat > hello.sh
#!/usr/bin/env _node
console.log('hello ...');
setTimeout(_, 1000);
console.log('... world');
^D
$ ./hello.sh
```

or:

``` sh
$ cat > hello.sh
#!/usr/bin/env _coffee
console.log 'hello ...'
setTimeout _, 1000
console.log '... world'
^D
$ ./hello.sh
```

# Compiling and writing loaders

You can also set up your code so that it can be run directly with `node` or `coffee`.
You have two options here:

The first one is to compile your source with `_node -c` or `_coffee -c`:

``` sh
$ _node -c .
```

This command compiles all the `*._js` and `*._coffee` source files in the current directory and its sub-directories. It generates `*.js` files that you can run directly with `node`.

The second one is to create your own loader with the `register` API. See the [loader example](https://github.com/Sage/streamlinejs/blob/master/examples/loader/loader.md) for details.

Compiling will give you the fastest startup time because node will directly load the compiled `*.js` files but the `register` API has a `cache` option which comes close and the loader saves you a compilation pass.

# Browser-side use

You have three options to use streamline in the browser:

* The first one is to compile the source with `_node --standalone -c`. The compiler generates vanilla Javascript code that you can load with `<script>` directives in an HTML page. See the [eval unit test](https://github.com/Sage/streamlinejs/blob/master/test/common/eval-test.html) for an example.
* You can also transform the code in the browser with the `transform` API. All the necessary JS code is available as a single `lib/transform-all.js` file. See the [streamlineMe example](https://github.com/Sage/streamlinejs/blob/master/examples/streamlineMe).
* A third option is to use the [streamline-require](https://github.com/Sage/streamline-require) infrastructure. This is a very efficient browser-side implementation of `require` that lets you load streamlined modules as well as vanilla Javascript modules in the browser. 

# Generation options

Streamline gives you the choice between generating regular callback-based asynchronous code, 
generating code that takes advantage of the [fibers library](https://github.com/laverdet/node-fibers), 
or generating code for [JavaScript generators](https://developer.mozilla.org/en/New_in_JavaScript_1.7#Generators).

The _callback_ option produces code that does not have any special runtime dependencies. 

The _fibers_ option produces simpler code but requires that you install 
the fibers library (easy: `npm install fibers`). 
This option gives superior development experience: line numbers and comments are preserved in the transformed code; 
you can step with the debugger through asynchronous calls without having to go through complex callbacks, etc.

The _fibers_ option can be activated by passing the `--fibers` option to the `_node` command or by setting the `fibers` option when registering streamline 
(see the `streamline.register(options)` function.

The _generators_ option produces code for harmony generators. It uses the [galaxy](https://github.com/bjouhier/galaxy) module as runtime. It requires node.js version >= 0.11.4 or an experimental browser (latest Chrome Canary). This options produces code which is similar to what you get with the fibers option, just a bit heavier because of the `yield` keywords.

The _generators_ option can be activated by passing the `--generators` option to the `_node` command or by setting the `ganerators` option when registering streamline. If you run it with a loader you have to pass the `--harmony` option to `node`.

There are also _fast_ variants of the _fibers_ and _generators_ options. See below.
 
# Interoperability with standard node.js code

You can call standard node functions from streamline code. For example the `fs.readFile` function:

```javascript
function lineCount(path, _) {
  return fs.readFile(path, "utf8", _).split('\n').length;
}
```
You can also call streamline functions as if they were standard node functions. For example, the `lineCount` function defined above can be called as follows from non-streamlined modules:

```javascript
lineCount("README.md", function(err, result) {
  if (err) return console.error("ERROR: " + err.message);
  console.log("README has " + result + " lines.");
});
```

And you can mix streamline functions, classical callback based code and synchrononous functions in the same file. 
Streamline only transforms the functions that have the special `_` parameter. 

Note: this works with all transformation options. 
Even if you use the _fibers_ option, you can seamlessly call standard callback based node APIs 
and the asynchronous functions that you create with streamline have the standard node callback signature.

# Futures

Streamline provides _futures_, a powerful feature that lets you parallelize I/O operations in a very
simple manner.

If you pass `!_` instead of `_` when calling a streamline function, the function will execute synchronously and return a _future_. The _future_ is just an asynchronous function that you can call later to obtain a result. Here is an example:

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

Futures are very flexible. In the example above, the results are retrieved from the same function, but you can also pass futures to other functions, store them in objects, call them to get the results from a different module, etc. You can also have several readers on the same future. 

See the [futures](https://github.com/Sage/streamlinejs/wiki/Futures) wiki page for details.

The [flows module](https://github.com/Sage/streamlinejs/blob/master/lib/util/flows.md) contains utilities to deal with futures: 
`flows.collect` to wait on an array of futures and `flows.funnel` to limit the number of concurrent operations.

# Asynchronous Array functions

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

See the documentation of the [builtins module](https://github.com/Sage/streamlinejs/blob/master/lib/compiler/builtins.md) for details.

# Exception Handling

Streamline lets you do your exception handling with the usual `try/catch` construct. The `finally` clause is also fully supported.

Streamline overrides the `ex.stack` getter to give you complete comprehensive stacktrace information. In _callbacks_ and _generators_ modes you get two stack traces:

* the _raw_ stack trace of the last callback.
* the _async_ stack trace of the asynchronous calls that caused the exception.

In _fibers_ mode there is a single stack trace.

Note: you must install the companion [galaxy-stack](https://github.com/bjouhier/galaxy-stack) package to get _async_ stack traces in _generators_ mode.

Exception handling also works with futures.
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

# Callbacks with multiple results

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

# Fast mode

Streamline has a _fast_ mode which produces leaner and faster code at the expense of a few more keystrokes and a bit of extra care when writing the code.

This mode only applies to _fibers_ and _generators_ modes. It has no impact in _callbacks_ mode.

For details see the [fast mode wiki page](https://github.com/Sage/streamlinejs/wiki/Fast-mode)

# Stream Wrappers

Streamline also provides _stream wrappers_ that simplify stream programming. These wrappers used to be included in the streamline npm package but they have now been moved to a separate [streamline-streams](https://github.com/Sage/streamline-streams) package.

# Examples

The [tutorial](https://github.com/Sage/streamlinejs/blob/master/tutorial/tutorial.md) shows streamline.js in action on a simple _search aggregator_ application.

The [diskUsage](https://github.com/Sage/streamlinejs/blob/master/examples/diskUsage) examples show an asynchronous directory traversal that computes disk usage.

# Online demo

You can see how streamline transforms the code by playing with the [online demo](http://sage.github.com/streamlinejs/examples/streamlineMe/streamlineMe.html).

# Troubleshooting

Read the [FAQ](https://github.com/Sage/streamlinejs/blob/master/FAQ.md).

If you don't find your answer in the FAQ, post to the [mailing list](http://groups.google.com/group/streamlinejs), or file an issue in [GitHub's issue tracking](https://github.com/Sage/streamlinejs/issues).

# Related Packages

The following package contains a complete yet simple streaming API for streamline.js:

* [ez-streams](https://github.com/Sage/ez-streams): easy streams, with array-like API (filter, map, reduce, foreach, some, every), transforms (json, csv and xml streaming parsers and formatters), parallelization, buffering, etc.

The following packages contain API wrappers for streamline.js:

* [streamline-fs](https://github.com/Sage/streamline-fs): wrapper for node's `fs` module. It fixes the `fs.exists` call and it wraps the entire API for streamline's fast mode.
* [streamline-streams](https://github.com/Sage/streamline-streams): wraps node's stream APIs. Provides very simple read and write calls for node streams. This module is the original streaming module for streamline. It implements the low level bits of the `ez-steams` module (see above). If you want a rich streaming APIs you should use `ez-streams` rather than this lower level API. 
* [streamline-mongodb](https://github.com/Sage/streamline-mongodb): wrappers for [mongodb](https://github.com/mongodb/node-mongodb-native)'s native node.js driver. You only need this wrapper if you use the _fast_ mode.

There are also some helper packages for [express](http://expressjs.com/):

* [express-streamline](https://github.com/aseemk/express-streamline)
* [streamline-express](https://github.com/sethyuan/streamline-express)


The following packages use streamline.js:

* [streamline-require](https://github.com/Sage/streamline-require): a light and efficient _require_ infrastructure for modules in the browser.
* [streamline-pdfkit](https://github.com/Sage/streamline-pdfkit): a fork of [pdfkit](https://github.com/devongovett/pdfkit) in which all the sync calls have been eliminated.
* [streamline-zip](https://github.com/Sage/streamline-zip): a fork of [node-native-zip](https://github.com/janjongboom/node-native-zip) with async deflate.


# Resources

The [tutorial](https://github.com/Sage/streamlinejs/blob/master/tutorial/tutorial.md) and [FAQ](https://github.com/Sage/streamlinejs/blob/master/FAQ.md) are must-reads for starters.

The API is documented [here](https://github.com/Sage/streamlinejs/blob/master/API.md).

For support and discussion, please join the [streamline.js mailing list](http://groups.google.com/group/streamlinejs).

# Credits

See the [AUTHORS](https://github.com/Sage/streamlinejs/blob/master/AUTHORS) file.

Special thanks to Marcel Laverdet who contributed the _fibers_ implementation.

# License

This work is licensed under the [MIT license](http://en.wikipedia.org/wiki/MIT_License).
