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

Nothing bad will happen. But you have to call `foo` as `foo(_)`. If you call it as `foo()` you'll get an error.

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

### Can I use _ for other purposes, for example when using the underscore library with streamline?

No. `_` is reserved by streamline.

The preprocessor will give you an error if you use it in invalid contexts. If you want to use underscore with streamline, you should choose another name for underscore. For example you can double the underscore:

``` javascript
var __ = require('underscore');
```

<a name="no-callback-given-error"></a>

### I'm getting a "cannot call F, expecting a function got ..." error. What does that mean?

It means that you are calling a function written with streamline.js and that you forgot to pass a callback.

If you're calling this function from Streamline code, you probably just forgot the `_` parameter in your call.

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

First possibility is that you declared a function without `_` and called it with `_`:

``` javascript
function bad() { ... }

bad(_);
// execution will never reach this point
```

Streamline cannot find out that this call is invalid because `bad` could as well be a regular node.js async function with a callback (which could even be extracted from `arguments` and thus absent from the parameter list).

Another possiblity is that you called a buggy function as a future and that you never tried to resolve the future. For example:

``` javascript
function buggy(_) { undefined.toString(); }
buggy(!_);
```

The future memorizes the exception but does not throw it. Try the following instead:

``` javascript
function buggy(_) { undefined.toString(); }
var f = buggy(!_);
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

You can also leverage interop with callback + errback API style:

```
var ok = fs.exists(__filename, _, _); // works
```

### Why is `this === undefined` at the top level of my module?

This is an incompatibility with streamline 0.x. It is due to the fact that babel enforces ES `strict` mode by default. You can get around it by blacklisting the `strict` plugin. This can be specified via `.streamline.json`. For example:

```json
{
    "runtime": "callbacks",
    "babel": {
        "blacklist": ["strict"]
    }
}
```

### I'm calling an async function with `!_` and I'm not getting a future back. What's wrong?

This used to be a problem with streamline 0.x. It is fixed in streamline 1.0.

### My control flow is completely broken. I am completely lost. Help!

Check your file extensions. 

If you put streamline code in a `.js` or `.coffee` file it won't get transformed 
and your code will go wild: callbacks will be executed multiple times, etc.

### Can I use the streamline extensions for files that don't contain any async code (yet).

This won't hurt. Streamline only transforms functions that have the special `_` parameter. 
So, files that don't contain async code won't be impacted by the transformation.

### Can I use streamline.js with the _express_ middleware

Yes! 

There are two NPM modules that will help you integrate streamline and express:

* [express-streamline](https://github.com/aseemk/express-streamline)
* [streamline-express](https://github.com/sethyuan/streamline-express)

And read just below about dealing with events!

### The underscore trick is designed for callbacks but not events. How do I deal with events?

If you are dealing with stream events, you should try the [ez-streams](https://github.com/Sage/ez-streams)  package. It wraps node streams with a simple callback oriented API and it takes care of the low level event handling for you. For example:

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

If you are not dealing with stream events, you can take a look at the implementation of the ez-streams module for ideas. 

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

The `flows` helper module contain two functions that you can pass instead of writing your own `handleError`:

* `flows.check`: throws if there is an error.
* `flows.ignore`: ignores errors.

### How can I deal with node.js streams

The easiest way is to use the [ez-streams](https://github.com/Sage/ez-streams) companion package.

### Are there limitations? Am I limited to a subset of Javascript?

No. Thanks to babel you can even use language features which are not yet supported by your JavaScript engine. 

### Will I always get the same semantics as in normal (sync) Javascript?

Yes. 

There were some subtle issues with the evaluation order of subexpressions in streamline 0.x but they have all been ironed out in streamline 1.0. The new transform uses `regenerator` which should guarantee a perfect translation.

### What about performance? Am I taking a hit?

In `callbacks` mode, streamline chains the `generators` transform with `regenerator`. The result code is slower than hand-crafted callbacks and is likely to be slower than the callbacks code generated by streamline 0.x (which did not use `regenerator`).

But generators are now supported by most JavaScript engines (node 0.12 with `--harmony` flag, node 4.0 without any flag). You should get better performance with the `generators` mode. 

And try the `fibers` mode if you are on node.js. It has a bit more overhead on I/O calls but it eliminates all the callback overhead in the layers that call low level I/O services. So depending on the thickness of the logic that sits on top of the I/O layers you may get an increase or decrease of performance. The nice thing is that you don't need to choose between callbacks and fibers upfront. You can write your code, compare performance and then choose the best mode for deployment.

If you do not specifiy the `runtime` option streamline will use `fibers` if available, then try `generators` and will default to `callbacks` if none of the other options work.

Some patterns like caching can give surprising results (see https://gist.github.com/2362015). 

Some benchmark programs are included in the [test/benchmarks](test/benchmarks) directory. They do not pretend to be _true_ benchmark suites but they will give your some indication of the relative performance of the various runtime options.
