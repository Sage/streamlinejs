streamline.js
=============
`streamline.js` is a small set of tools designed to _streamline_ asynchronous Javascript
programming. The heart of the system is a transformation engine that converts
traditional, synchronous-looking code into asynchronous, callback-oriented code. 

`streamline.js` has the following characteristics:

* No language extension: the source code is normal Javascript. 
  So you can keep your favorite code editor.
* Easy to learn: (almost) all you need to know is a special callback.
* Node-friendly: you can call asynchronous [node.js](http://nodejs.org) APIs directly. 
  You don't need to add wrappers around existing APIs as long as they follow the
  node.js callback convention. And the _streamlined_ functions that you write will 
  be first class citizens in node.js.
* Modular: functions are transformed independently from each other.
  There is no run-time attached.
* Efficient: the generated code is more or less the code that you would need
  to write by hand anyway if you were coding directly with callbacks. There is no real
  overhead. The transformation engine just saves you some headaches.
  
A word of caution: this is **experimental code**. Unit test suites need to be expanded and
experimentation with real projects have only just started (with good results so far).
So you can play with it but don't use it for production code yet.

If you're interested by how the genesis of this idea, you can read [the tale of Harry](http://bjouhier.wordpress.com/2011/01/09/asynchronous-javascript-the-tale-of-harry/).
  
Writing _streamlined_ code
==========================

The problem addressed by streamline.js
--------------------------------------

`streamline.js` simplifies the code that you have to write when dealing with asynchronous APIs. 

For example, let us assume that you want to write a simple function that returns the length of a file, using the `fs.stat` and `fs.readFile` functions.

If these functions were synchronous, you would probably write the following code:

    function fileLength(path) {
        if (fs.stat(path).isFile())
    	    return fs.readFile(path).length;
        else
    	    throw new Error(path + " is not a file");
     }

But, as the node APIs are asynchronous, you have to write the following instead:

    function fileLength(path, callback) {
        fs.stat(path, function(err, stat) {
          if (err) { callback(err); return; }
          if (stat.isFile()) {
            fs.readFile(path, function(err, data) {
              if (err) { callback(err); return; }
              callback(null, data.length);
            });
          }
          else {
            callback(new Error(path + " is not a file"));   
        });
     }

You have to restructure your code to deal with the callbacks. On this example, this is not too hard, but the it can become tricky, for example if your code 
has complex `if/else` branching logic, loops, `try/catch/finally` constructs, etc. The callback pattern is somehow imposing a special flow on your code.
It is as if every asynchronous call is opening a hole into another flow (the callback flow) and you have to push your statements into this new flow. 
It feels a little bit like your statements have leaked through a hole created by the callback. 

This creates two problems:

* Writing algorithms becomes harder because the built-in keywords of Javascript (`if`, `while`, `try/catch`) cannot control the flow as naturally as they did before.
  For example, you have to convert your loops into a recursive form, or use a helper library to write them.
* The code that you write is harder to read because it is polluted by _callback noise_ that does not have much to do with the problem that you are trying to solve.

The solution
------------

`streamline.js` solves this problem by giving you a special callback that somehow _plugs the holes_ that the asynchronous calls would create in your flow. 
Once the holes have been plugged, you are back into the familiar synchronous coding style and you can use all the flow control statements of the Javascript 
language.

The _callback plug_ has a very concise syntax: the _underscore_ character. 

With this simple _plug_, you can write the fileLength function as:

    function fileLength(_, path) {
        if (fs.stat(path, _).isFile())
    	    return fs.readFile(path, _).length;
        else
    	    throw new Error(path + " is not a file");
     }

Note: the first version of `streamline.js` used an underscore postfix on the function name rather than an underscore parameter/argument. 
This syntax still works but it is deprecated and will not be supported forever. So code that uses the old syntax must be converted.

The transformation engine will treat this function definition as the definition of 
an asynchronous function:

    function fileLength(_, path)
  
where `_` is a callback with the usual node.js callback signature:

    _(err, result)
    
Note: `streamline.js` uses a slightly different convention than node for its APIs: the callback is passed
as first parameter rather than as last one. This was chosen because it is more readable (you immediately see if the 
underscore is there or not). Also, it works better with functions that have optional parameters.
But this is just a convention for new APIs, the transformation engine does not impose this and you can pass the 
_callback plug_ as last parameter when you call node APIs that expect it this way.
  
The transformation engine will convert all the calls to which you pass the _callback plug_ inside the function body
into traditional node.js-style calls with callbacks. The transformed code will be very similar to the code you would have written by hand
(in the case of the `fileLength` function, it will be similar to the callback version that we gave above).
  
Note: if you look at the generated code you won't see the `err` parameter because it is hidden in a 
small callback wrapper.

One very important point is that the transformation engine knows how to convert _all_ the constructs of the Javascript language. 
So, the calls that contain the _callback plug_ can be placed anywhere in your code: subexpressions, `if` statements, `while` loops, even `try/catch/finally`. 

For example, you can write code like:

    try {
      if (fs.readFile(path1, _).length < fs.readFile(path2, _).length + 100) {
        doSomething(_, path1, path2);
    }
    catch (ex) {
      handleError(_, ex);
    }

You can use all the flow control statements of the Javascript language to control asynchronous code, 
and you can reason about your asynchronous code the same way you reason about your synchronous code.

The fileLength function that we defined above can be called in two ways:

* as `fileLength(_, p)` from another _streamlined_ function. When you use this form, the result is "returned" directly as if you were calling a synchronous function.
* as `fileLength(cb, p)` from a regular Javascript function (or at top level in a script). When you use this form the result is passed to your callback.

You can call a _streamlined_ function from the body of another _streamlined_ function. 
So, the following code is valid:

    function processFiles(_) {
        // ...
        var len = fileLength(_, p);
        // ...
    }

But you cannot call it from the body of a _non streamlined_ function. 
The transformation engine will reject the following code:

    function processFiles() {
        // ...
        var len = fileLength(_, p); // ERROR
        // ...
    }

which is actually rather logical because the underscore variable is not defined in this case.

But you can get around it by switching to the tradional callback style:

    function processFiles() {
        // ...
        fileLength(function(err, len, p) { // OK
            // ...
        });
    }

Mixing with regular node.js code
--------------------------------

You can mix _streamlined_ functions and traditional callback based functions in the same file at your will.

The transformation engine will only convert the functions that have an underscore as one of their parameters.
It will leave all other functions unmodified.

Array utilities
---------------

The standard ES5 Array methods (`forEach`, `map`, `filter`, ...) are nice but they don't deal with callbacks.
So, they are of little help for _streamlined_ Javascript.

The `lib/flows` module contains some utilities to fill the gap:

* `each(_, array, fn)` applies `fn` sequentially to the elements of `array`.
* `map(_, array, fn)` transforms `array` by applying `fn` to each element in turn.
* `filter(_, array, fn)` generates a new array that only contains the elements that satisfy the `fn` predicate.
* `every(_, array, fn)` returns true if `fn` is true on every element (if `array` is empty too).
* `some(_, array, fn)` returns true if `fn` is true for at least one element.

In `each` and `map`, the `fn` callback is called as `fn(_, elt, i)`.  
In `filter`, `every` and `some`, the `fn` callback is called as `fn(_, elt)`.

Flows
-----

Getting rid of callbacks is a great relief but now the code is completely pseudo-synchronous. 
So, will you still be able to take advantage of asynchronous calls to parallelize processing?

The answer is yes, simply because you can mix _streamlined_ code with regular code. 
So _streamlined_ code can benefit from parallelizing constructs that have been written in _non streamlined_ Javascript.

The `lib/flows` module contains some experimental API to parallelize _streamlined_ code. 

The main functions are:

* `spray(fns, [max=-1])` sets up parallel execution of an array of functions. 
* `funnel(max)` limits the number of concurrent executions of a given code block.
  
`spray` is typically used as follows:

    var results = spray([
        function(_) { /* branch 1 */ },
        function(_) { /* branch 2 */ },
        function(_) { /* branch 3 */ },
        ...
    ]).collectAll(_);
    // do something with results...
  
This code executes the different branches in parallel and collects the result into an array which is
returned by `collectAll(_)`.

Another typical pattern is:

    var result = spray([
        function(_) { /* what we want to do */ },
        function(_) { /* set timeout */ }
    ]).collectOne(_);
    // test result to find out which branch completed first.
  
Note: `spray` is synchronous as it only sets things up. So don't call it with an underscore. 
  The `collect` functions are the asynchronous ones that start and control parallel execution.
  
The `funnel` function is typically used with the following pattern:

    // somewhere
    var myFunnel = funnel(10); // create a funnel that only allows 10 concurrent streamlines.
  
    // elsewhere
    myFunnel.channel(_, function(_) { /* code with at most 10 concurrent executions */ });
  
Note: Here also, the `funnel` function only sets things up and is synchronous. 
  The `channel` function deals with the async part.
  
The `diskUsage2.js` example demonstrates how these calls can be combined to control
concurrent execution. 

One idea behind these APIs is that you can take an existing algorithm and parallelize it 
by _spraying_ execution in a few places and _funnelling_ it in other places to limit the explosion of
parallel calls.

The `funnel` function can also be used to implement critical sections. Just set funnel's `max` parameter to 1. 
This is not a true monitor though as it does not (yet?) support reentrant calls.

Note: This is still very experimental and has only been validated on small examples. 
So, these APIs may evolve.
 
TODOs, known issues, etc.
-------------------------

* Irregular `switch` statements (with `case` clauses that flow into each other) are not handled by
the transformation engine (these constructs are questionable so I am not sure that streamline should support them).
* Labelled `break` and `continue` are not yet supported.
* Files are transformed every time node starts. A cache will be added later.
* Installation via NPM is coming.

Running _streamlined_ code
==========================

You have two options to package _streamlined_ code.

The first one is to use a special convention for your source file names. 
Instead of putting the source for module `xxx` into a file called `xxx.js`, you put it into
a file called `xxx_.js`. When you _require_ `xxx` streamline will read the source from `xxx_.js`,
transform it and save the transformed code into `xxx.js` and will pass the transformed source
to node. This option is the preferred option because it works well with debuggers.

Note: node will not find your module if the `xxx.js` file does not exist. 
So you have to create an empty `xxx.js` file to initiate the process.

The second option is to add a special `!!STREAMLINE!!` marker in your source code (anywhere, usually 
in a comment at the top) and to call your file `xxx.js`, as usual. Streamline will detect
the marker and transform your code before passing to node. The drawback of this option is that the 
transformed code is not available for debugging.

Once you have setup your _streamlined_ code with one of these options, 
you can run it as a node script file directly from the command line:

    streamline-dir/bin/node-streamline myscript.js [args]

You can also initialize streamline from your main server script. 
Just add the following line to your main server script:

    require('streamline_dir/lib/node-init.js')
    
On the client side, you can use the `transform.js` API to convert the code and then `eval` it, 
There is only one call in the `transform.js` API:

    var converted = Streamline.transform(source);

Running with CoffeeScript
=========================

You can also use `streamline.js` with CoffeeScript. To do so, just put the `!!STREAMLINE!!` marker
in your coffeescript modules and run your program with 
`streamline-dir/bin/coffee-streamline` instead of `coffee`. For example:

	streamline-dir/bin/coffee-streamline streamline-dir/examples/diskUsage.coffee


Installation and dependencies
=============================

The transformation engine (`transform.js`) uses the Narcissus compiler and decompiler. 
You need to get it from  [https://github.com/mozilla/narcissus/](https://github.com/mozilla/narcissus/) 
and install it side-by-side with `streamline.js` 
(the `streamlinejs` and `narcissus` directories need to be siblings to each other).

This version of Narcissus requires ECMAScript 5 features (`Object.create`, `Object.defineProperty`, ...). 
So `transform.js` may not run in all browsers. 
You may try to use an older version of Narcissus but you may have to adapt the code then. 
Another solution is to load a library that emulates the missing ECMAScript 5 calls.

On the other hand, the code which is produced by the transformation engine does not have any special strings attached. 
You can use it with any Javascript library that uses node.js's callback style (even outside of node as this is
just an API convention). 

Discussion
==========

For support and discussion, please join the [streamline.js Google Group](http://groups.google.com/group/streamlinejs).

License
=======

This work is licensed under the [MIT license](http://en.wikipedia.org/wiki/MIT_License).
