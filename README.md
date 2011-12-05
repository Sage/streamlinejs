## streamline.js

`streamline.js` is a small tool to simplify asynchronous Javascript programming.

Instead of writing hairy code like:

```javascript
function lineCount(path, callback) {
  fs.readFile(path, "utf8", function(err, data) {
    if (err) { callback(err); return; }
    callback(null, data.split('\n').length);
  });
}
```
Streamline.js lets you write:

```javascript
function lineCount(path, _) {
  return fs.readFile(path, "utf8", _).split('\n').length;
}
```
You just have to follow a simple rule:

> Replace all callbacks by an underscore and write your code as if all functions were synchronous.

Streamline will transform the code and generate the callbacks for you!

And streamline is not limited to a subset of Javascript. 
You can use all the flow control features of Javascript in your asynchronous code: conditionals, 
loops, `try/catch/finally` blocks, anonymous functions, `this`, etc. 

Streamline also provides _futures_, and comes with a small optional library of helper functions (see Goodies section below).

# Generation options

Streamline gives you the choice between generating regular callback-based asynchronous code, 
or generating code that takes advantage of the [fibers library](https://github.com/laverdet/node-fibers).

The _callback_ option produces code that does not have any special runtime dependencies. You may even use it 
to generate asynchronous code for the browser.

The _fibers_ option produces simpler code but requires that you install 
the fibers library (easy: `npm install fibers`). 
This option gives superior development experience: line numbers are always preserved in the transformed code; 
you can step with the debugger through asynchronous calls without having to go through complex callbacks, etc.
It may also generate more efficient code (to be confirmed by benchmarks).

The _fibers_ option can be activated by passing `--fibers` to the `node-streamline` command or by 
setting the `fibers` option when registering streamline 
(see the `register(options)` function in `streamline/lib/compiler/register` or the `streamline/module` API).
 
# Interoperability with standard node.js code

You can call standard node functions from streamline code. For example the `fs.readFile` function:

```javascript
function lineCount(path, _) {
  return fs.readFile(path, "utf8", _).split('\n').length;
}
```
You can also call streamline functions as if they were standard node functions. For example:

```javascript
lineCount("README.md", function(err, result) {
  if (err) return console.error("ERROR: " + err.message);
  console.log("README has " + result + " lines.");
});
```
And you can mix streamline functions, classical callback based code and synchrononous functions in the same file. 
Streamline will only transform the functions that have the special `_` parameter. 

Note: this works with both transformation options. 
Even if you use the _fibers_ option, you can seamlessly call standard callback based node APIs 
and the asynchronous functions that you create with streamline have the standard node callback signature.

# On-line demo

You can test `streamline.js` directly with the [on-line demo](http://sage.github.com/streamlinejs/examples/streamlineMe/streamlineMe.html)

# Installation

The easiest way to install `streamline.js` is with NPM:

```sh
npm install streamline -g
```

The `-g` option installs it _globally_.
You can also install it _locally_, without `-g` but then the `node-streamline` and `coffee-streamline` 
commands will not be in your default PATH.

Note: If you encounter a permission error when installing on UNIX systems, you should retry with `sudo`. 

The global installation option makes `node-streamline` globally accessible but it does not expose the Javascript support
modules (`runtime.js`, `flows.js`, etc.) globally. 
If you need these modules anywhere in your development tree, 
for example because you use streamline in shell scripts (see below), 
you should `npm link` streamline to the root of your development tree:

```sh
cd $myworkdir
npm link streamline
```

If you want to use the _fibers_ option, you must also install the fibers library:

```sh
npm install fibers [-g]
```

# Creating and running streamline modules

The easiest way to write streamline code is to put the following line at the top of your module:

``` javascript
if (!require('streamline/module')(module)) return;
```

Then you can use the `_` marker anywhere in your module:

```javascript
function lineCount(path, _) {
  return fs.readFile(path, "utf8", _).split('\n').length;
}
```

You can run your module with `node-streamline`:

```sh
node-streamline myModule
```

The code will be automatically transformed and the transformed files will be cached under `~/.streamline`.

You can also run your module with `node`:

```sh
node myModule
```

If you run with `node`, streamline will create (and delete) a temporary copy of your source file.
So you need r/w access to the module's directory. 
Note that only the main module will be copied, the streamline modules that are _required_ by the main module 
won't be copied so you don't need r/w access to all directories.

# Coffeescript

Coffeescript is no different. You just need the following line at the top of your module:

```coffeescript
if not require('streamline/module')(module)
	return
```

And then you can run your module with:

```sh
coffee-streamline myModule
```

or just, if you have r/w access to the module's directory (see `node` above):

```sh
coffee myModule
```

# Shell scripts

You can also use streamline to write shell scripts that call asynchronous node APIs. 
You just need the following line at the top of your script:

```sh
#!/usr/bin/env node-streamline
```

For example:

```sh
#!/usr/bin/env node-streamline
console.log("waiting 1 second");
setTimeout(_, 1000);
console.log("done!");
```

Note: you must install streamline with the `-g` option and you must `npm link` it at the top of your
development tree to make this work smoothly (see installation section above).
  
# Compilation setup (old style)

You can also set up your modules to have the streamline source and the transformed Javascript side by side in 
the same directory. To do this, you must append an underscore to your module's base name: `myModule_.js`.

This was the original setup. It is nice if you want to see the transformed code but it pollutes the directories 
with extra files and it becomes messy when you start testing with both callback and fibers mode. 
The callback output is called `myModule.js` and the fibers' output is called `myModule--fibers.js`.

The [Compilers wiki page](https://github.com/Sage/streamlinejs/wiki/Compilers) gives details on this mode.

# Browser-side use

The [streamline compiler](https://github.com/Sage/streamlinejs/wiki/Compilers) generates vanilla Javascript code that may be run browser-side too.

You can also transform the code in the browser with the `transform` API. See `examples/streamlineMe` for an example.

The `lib/require` directory contains a small infrastructure to load streamline and regular JS modules from the browser. 
It applies the streamline transformation server side and caches the transformed files.
It also optimizes roundtrips between client and server: 
the _required_ module and all its dependencies are transferred in one message.
Also, dependencies that have already been transferred to the browser are not re-transferred 
when you require additional modules.

Note: the `lib/require` infrastructure does not handle all the subtleties of node's require logic but it handles enough to
support our applications (and it does it very efficiently).
It is provided _as is_ and contributions to improve it are welcome.

# Examples

The `examples/diskUsage` directory contains a simple example that traverses directories to compute disk usage.
You can run it as follows:

```sh
node-streamline diskUsage
node diskUsage # requires r/w access to the examples directory
```

The `diskUsage2.js` example is a faster variant that parallelizes I/O operations with futures. 
You'll also find CoffeeScript versions of these examples.

# Goodies

The functions generated by streamline return a _future_ if you call them without a callback. 
This gives you an easy way to run several asynchronous operations in parallel and resynchronize later. 
See the [futures](https://github.com/Sage/streamlinejs/wiki/Futures) wiki page for details.

The following subdirectories contain various modules that have been written with streamline.js:

* `lib/util`: utilities for array manipulation, semaphores, etc.
* `lib/streams`: pull-mode API for node.js streams.
* `lib/require`: infrastructure to support client-side require.
* `lib/tools`: small tools (doc generator for API.md file).

## Resources

The API is documented [here](https://github.com/Sage/streamlinejs/blob/master/API.md).  
The [wiki](https://github.com/Sage/streamlinejs/wiki) give more information on advanced topics.

For support and discussion, please join the [streamline.js Google Group](http://groups.google.com/group/streamlinejs).

## Credits

See the [AUTHORS](https://github.com/Sage/streamlinejs/blob/master/AUTHORS) file.

Special thanks to Marcel Laverdet who contributed the _fibers_ implementation.

## License

This work is licensed under the [MIT license](http://en.wikipedia.org/wiki/MIT_License).
