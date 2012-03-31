# streamline.js

`streamline.js` is a language tool to simplify asynchronous Javascript programming.

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

Streamline also provides _futures_, and additional builtin functions for asynchronous programming.

# Installation

The easiest way to install `streamline.js` is with NPM:

```sh
npm install streamline -g
```

The `-g` option installs it _globally_.
You can also install it _locally_, without `-g` but then the `_node` and `_coffee` 
commands will not be in your default PATH.

Note: If you encounter a permission error when installing on UNIX systems, you should retry with `sudo`. 

The global installation option makes `_node` globally accessible but it does not expose the Javascript support
modules (`runtime.js`, `flows.js`, etc.) globally. 
If you need these modules anywhere in your development tree, 
for example because you use streamline in shell scripts (see below), 
you should `npm link` streamline to the root of your development tree:

```sh
cd $myworkdir
npm link streamline
```

If you want to use the _fibers_ option (see below), you must also install the fibers library:

```sh
npm install fibers [-g]
```

# Hello World

Streamline modules have `._js` or `._coffee` extensions and you run them with the `_node` or `_coffee` 
loader.

Javascripters:

``` sh
echo "console.log('hello ...');" > hello._js
echo "setTimeout(_, 1000);" >> hello._js
echo "console.log('... world');" >> hello._js
_node hello
```

Coffeescripters:

``` sh
echo "console.log 'hello ...'" > hello._coffee
echo "setTimeout _, 1000" >> hello._coffee
echo "console.log '... world'" >> hello._coffee
_coffee hello
```

You can also create standalone shell utilities:

``` sh
echo "#!/usr/bin/env _node" > hello.sh
cat hello._js >> hello.sh
chmod +x hello.sh
./hello.sh
```

or:

``` sh
echo "#!/usr/bin/env _coffee" > hello.sh
cat hello._coffee >> hello.sh
chmod +x hello.sh
./hello.sh
```

You can also create your own loader and run your program with `node` or `coffee`. 
See the [loader example](http://sage.github.com/streamlinejs/examples/loader/loader.md)

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

The _fibers_ option can be activated by passing `--fibers` to the `_node` command or by 
setting the `fibers` option when registering streamline 
(see the `register(options)` function in `streamline/lib/compiler/register`).
 
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

# Browser-side use

The [streamline compiler](https://github.com/Sage/streamlinejs/wiki/Compilers) generates vanilla Javascript code that may be run browser-side too.

You can also transform the code in the browser with the `transform` API. See `examples/streamlineMe` for an example.

The [streamline-require package](https://github.com/Sage/streamline-require) contains a small infrastructure to load streamline and regular JS modules from the browser. 

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
* `lib/tools`: small tools (doc generator for API.md file).

# Related Packages

The following packages use streamline.js:

* [streamline-require](https://github.com/Sage/streamline-require): a light and efficient _require_ infrastructure for modules in the browser.
* [streamline-pdfkit](https://github.com/Sage/streamline-pdfkit): a fork of [pdfkit](https://github.com/devongovett/pdfkit) in which all the sync calls have been eliminated.
* [streamline-zip](https://github.com/Sage/streamline-zip): a fork of [node-native-zip](https://github.com/janjongboom/node-native-zip) with async deflate.


## Resources

The API is documented [here](https://github.com/Sage/streamlinejs/blob/master/API.md).  
The [wiki](https://github.com/Sage/streamlinejs/wiki) give more information on advanced topics.

For support and discussion, please join the [streamline.js Google Group](http://groups.google.com/group/streamlinejs).

## Credits

See the [AUTHORS](https://github.com/Sage/streamlinejs/blob/master/AUTHORS) file.

Special thanks to Marcel Laverdet who contributed the _fibers_ implementation.

## License

This work is licensed under the [MIT license](http://en.wikipedia.org/wiki/MIT_License).
