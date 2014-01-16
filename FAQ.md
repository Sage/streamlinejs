### I get a weird "Function contains async calls but does not have _ parameter" error. What's the deal?

You'll get this error with code like:

``` javascript
function foo() { bar(_); }
```

Asynchronism is _contagious_. 
Function `foo` contains an async call to `bar`. 
So `foo` itself becomes asynchronous and needs an `_` in its parameter list. Change it to:

``` javascript
function foo(_) { bar(_); }
```

### Can I create an anonymous streamline function?

Yes: 

``` javascript
function(_) { bar(_); }
```

### What if my async function does not do any async calls?

``` javascript
function foo(_) { return bar(); }
```

Nothing bad will happen. But you have to call `foo` as `foo(_)`. If you call it as `foo()` you'll get an error (a _future_ in versions <= 0.8).

There will be a bit of overhead so you should avoid declaring sync functions with an `_`.  

But you many need this feature, for example if you dispatch to functions that may be either async or sync.
In this case you should dispatch asynchronously (pass an `_`) and declare all of dispatch handlers as async functions, even those that are synchronous.

### Why do the built-in streamline functions (`array.forEach_`, `map_`, etc.) have `_` as first parameter rather than last?

Because it makes it easier to deal with optional parameters. 

It also make it easier to check that the `_` is passed to every async call. You don't have to look at the end of the parameter list. 

The standard node convention is to have the callback as last parameter. 
You should follow this convention if you design libraries for a general node audience. 
But you may choose to pass the callback as first parameter if you design private APIs or if you target a more restricted audience of streamliners.

### Can a streamline function take optional parameters?

Yes but you have to be careful with the special `arguments` variable. You cannot pass it blindly to another call with `apply`. You have to use the streamline `apply_` built-in function instead. See its documentation.

### Can I used _ for other purposes, for example when using the underscore library with streamline?

No. `_` is reserved by streamline.

The preprocessor will give you an error if you use it in invalid contexts. If you want to use underscore with streamline, you should choose another name for underscore. For example you can double the underscore:

``` javascript
var __ = require('underscore');
```

<a name="no-callback-given-error">
### I'm getting a "no callback given" error. What does that mean?

It means you've forgotten to pass a callback, and all async functions written with Streamline require one (as of Streamline 0.10).

If you're calling this function from Streamline code as well, you probably just forgot to add a `_` parameter to your call.

``` javascript
function func(foo, bar, _) {
    // ...
}

// will cause this error:
func(foo, bar);

// fixed:
func(foo, bar, _);
```

If you mean to invoke the function asynchronously (i.e. "kick it off"), you can simply pass any regular function as a callback. It's a best practice to pass one anyway for handling errors that arise asynchronously, so that those errors don't get silently ignored or forgotten.

``` javascript
function handleError(err) {
    // log it somewhere, or simply throw it to crash the process
}

console.log('before');
func(foo, bar, handleError);
console.log('after');   // will log immediately; won't wait for func() to fully finish
```

If you mean to get back a Streamline [future](https://github.com/Sage/streamlinejs#futures), you must pass `!_` as the callback.

``` javascript
var f1 = func(foo1, bar1, !_);
var f2 = func(foo2, bar2, !_);

var result1 = f1(_);
var result2 = f2(_);
```

### It does not work and I'm not even getting an exception. What's going on?

You may run into this problem with versions <= 0.8. The _futures_ syntax has changed in 0.10 and the new syntax avoids this problem. You will now get an error if you forgot to pass `_` or `!_`.

If you are running version <= 0.8 you get this problem if you called a buggy asynchronous function and you did not pass `_`. For example:

``` javascript
function buggy(_) { undefined.toString(); }
buggy();
```

The problem is that when you call `buggy()` without `_` it returns a _future_. The future memorizes the exception but does not throw it. Try the following:

``` javascript
function buggy(_) { undefined.toString(); }
var f = buggy();
console.log("after buggy()"); // you'll see this one
f(_); // throws the exception
console.log("after f(_)"); // you won't see this one
```

### I'm calling `fs.exists(fname, _)` and it does not work. What am I doing wrong?

Streamline is designed to work with functions that take standard node callbacks, i.e. callbacks that have the standard `cb(err[, result])` signature.

Unfortunately some libraries use a different callback signature, and node itself has a few exceptions, the most notable one being `fs.exists` which does not have any `err` parameter in its callback.

The workaround is to write a small wrapper that re-aligns the callback parameters on the standard:

``` javascript
function exists(fname, cb) { 
  fs.exists(fname, function(result) { cb(null, result); });
}

console.log(__filename + ': ' + exists(__filename, _)); // works
console.log(__filename + ': ' + fs.exists(__filename, _)); // does not work
```

You can also use the `streamline-fs` package (install it with `npm install streamline-fs`):

```
var fs = require('streamline-fs');

var ok = fs.exists(__filename, _); // works
```


### I'm calling an async function with `!_` and I'm not getting a future back. What's wrong?

You're calling a function which was not written with streamline, for example one of node's `fs` function. The workaround is easy: just wrap it with a streamline function:

``` javascript
// the wrappers
function readTextFile(path, enc, _) { return fs.readFile(path, enc, _); }
function readBinaryFile(path, _) { return fs.readFile(path, _); }

// testing futures
var f1 = readTextFile(path1, "utf8"); // ok
var f2 = fs.readFile(path2, "utf8"); // does not fail but f2 is undefined
var data1 = f1(_); // ok: f1 is a future
var data2 = f2(_); // fails!
```

Wrapping functions with optional arguments might be a bit tricky. The following wrapper will work though:

``` javascript
function readFile(path, enc, _) {
	if (typeof enc === 'string') return fs.readFile(path, enc, _);
	else return fs.readFile(path, _);
}
```

You can also use the `streamline-fs` package (see previous answer). It wraps all the `fs` functions.

### My control flow is completely broken. I am completely lost. Help!

Check your file extensions. 

If you put streamline code in a `.js` or `.coffee` file it won't get transformed 
and your code will go wild: callbacks will be executed multiple times, etc.

### Can I use the streamline extensions for files that don't contain any async code (yet).

This won't hurt. Streamline only transforms functions that have the special `_` parameter. 
So, files that don't contain async code won't be impacted by the transformation.

The only drawback is a slower application startup because more files get transformed but you can avoid that with the `--cache` option.

### Can I use streamline.js with the _express_ middleware

Yes! 

There are two NPM modules that will help you integrate streamline and express:

* [express-streamline](https://github.com/aseemk/express-streamline)
* [streamline-express](https://github.com/sethyuan/streamline-express)

And read just below about dealing with events!

### The underscore trick is designed for callbacks but not events. How do I deal with events?

If you are dealing with stream events, you should try the ez-streams package. It wraps node streams with a simple callback oriented API and it takes care of the low level event handling for you (`pause/resume` on readable streams, `drain` on writable streams). For example:

``` javascript
var ez = require('ez-streams');

var inStream = ez.devices.node.reader(nodeInStream);
var head = inStream.read(_, 128); // read the first 128 bytes
var chunk;
while (chunk = inStream.read(_)) {
  // do something with chunk
}

var outStream = ez.devices.node.writer(nodeOutStream);
outStream.write(_, result);
``` 

This module also contains wrappers around node's `Http` and `Net` objects, both client and server.
See the [ez-streams](https://github.com/Sage/ez-streams) documentation for details.

If you are not dealing with stream events, you can take a look at the implementation of the streamline-streams module (ez-streams' low level implementation module) for ideas. Any event API can be turned into a callback API (with a `getEvent(_)` call that you would call in a loop) but this can be totally counterprodutive (events will be serialized). 

If the events are loosely correlated, it is better to let them be dispatched as events. But in this case, you may want to use streamline to handle the logic of each event you subscribed to. This is not too difficult: just put a small anonymous function wrapper inside your event handlers:

``` javascript
function handleError(err) {
	// log it somewhere
}

server.on('error', handleError);
server.on('eventA', function(arg) {
    (function(_) {
		// function has an _ parameter, you can use streamline
    })(handleError);
});
server.on('eventB', function(arg) {
    (function(_) {
		// streamline code...
    })(handleError);	
});
```

### How can I deal with node.js streams

The easiest way is to use the [ez-streams](https://github.com/Sage/ez-streams) companion package.

### Are there limitations? Am I limited to a subset of Javascript?

Hardly any. 

There were some limitations in 0.8 (labelled `break` and switch `case` that falls into another `case` without `break`) but these limitations have been lifted in 0.10.

So you can do all sorts of crazy things, like calling async functions from object or array literals, or even writing async constructors. The following will work:

``` javascript
var foo = [f1(_), f2(_), f3(_)].filter_(_, function(_, elt) { return elt.g1(_) || elt.g2(_); });

function Bar(_, name) { this.name = name; baz(_); }
var bar = new Bar(_, "zoo");
```

### Will I always get the same semantics as in normal (sync) Javascript?

The streamline compiler works by applying transformation patterns. These patterns have been carefully crafted to preserve semantics. The only known case where streamline may diverge is the order of evaluation of subexpressions inside a given statement. 

In callbacks mode, streamline evaluates the asynchronous subexpressions before the synchronous ones. So if you have `foo() + bar(_)`, it will evaluate `bar(_)` before `foo()`.  

In fibers mode, streamline preserves the order and evaluates `foo()` first. So you should not write _fragile_ code that relies on precise order of evaluation of subexpressions.

But streamline guarantees the ordering in the cases where it really matters: logical operators (`&&` and `||`), ternary operator (`cond ? a : b`) and comma operator (`a, b, c`). If you write `foo() && bar(_)`, `foo()` will be evaluated first and `bar(_)` will only be evaluated if `foo()` is true.

### What about performance? Am I taking a hit?

In callback mode, streamline generates callbacks that are very similar to the ones you would be writing by hand. So you are only paying a small overhead. Usually, the overhead will be small in comparison to the time spent in the async functions that you are calling. For example, you incur a 50% overhead when calling `process.nextTick(_)`, which is the fastest async call in node.js. If you call `setTimeout(_, 0)` the overhead drops to 18%. And on a real (but simple) I/O call like `fs.stat` it goes down to 3 or 4%.

The fibers mode has more overhead on I/O calls but it eliminates all the callback overhead in the layers that call low level I/O services. So depending on the thickness of the logic that sits on top of the I/O layers you may get an increase or decrease of performance. The nice thing is that you don't need to choose between callbacks and fibers upfront. You can write your code, compare performance and then choose the best mode for deployment.

Some patterns like caching can give surprising results (see https://gist.github.com/2362015). 

There is also room for improvement. In callback mode the small overhead comes from the additional comfort and security that streamline gives you: sync stack traces, global context, trampoline, rigorous exception handling. This could be improved with options that disable these _comfort_ features but it would make the tool more complex.
