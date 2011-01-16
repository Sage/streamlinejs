streamline.js
=============
`streamline.js` is a small set of tools designed to _streamline_ asynchronous Javascript
programming. The heart of the system is a transformation engine that converts
traditional, synchronous-looking code into asynchronous, callback-oriented code. 

`streamline.js` has the following characteristics:

* No language extension: the source code is normal Javascript. 
  So you can keep your favorite code editor.
* Easy to learn: (almost) all you need to know is a simple naming convention.
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

The magic trick
---------------

_Streamlined_ code looks like normal (synchronous) Javascript code. You just need to follow
a simple rule to write _streamlined_ code:

> _Add an underscore at the end of all asynchronous function names, and treat them as if they were synchronous!_

For example:

    function fileLength_(path) {
        if (fs.stat_(path).isFile())
    	    return fs.readFile_(path).length;
        else
    	    throw new Error(path + " is not a file");
     }
  
Note: the trailing underscore can be mentally interpreted as an _ellipsis_ (...), meaning that although the
code looks synchronous, the underlying execution is asynchronous.

The transformation engine converts this function definition into the definition of 
an asynchronous function with the following signature:

    function fileLength(path, _)
  
where _ is a callback with the usual node.js callback signature:

    _(err, result)
  
The transformation engine also converts all the calls to asynchronous functions inside the function body
into traditional node.js-style calls with callbacks (and reorganizes the code to cope with callbacks).

For example, the `fs.readFile_(path)` call is converted into code like:

    fs.readFile(path, function(err, result) { ... }
  
Note: if you look at the generated code you won't see the `err` parameter because it is hidden in a 
small callback wrapper.

By defining `fileLength_` you actually define a new function called `fileLength` which follows
the node.js callback conventions. This function can be called in two ways:

* as `fileLength_(p)` from another _streamlined_ function.
* as `fileLength(p, cb)` from a regular Javascript function (or at top level in a script).

You get two functions for the price of one! (more seriously, the real function is the second one, 
the other one is just an artefact).

You can call a _streamlined_ function from the body of another _streamlined_ function. 
So, the following code is valid:

    function processFiles_() {
        // ...
        var len = fileLength_(p);
        // ...
    }

But you cannot call it from the body of a _non streamlined_ function. 
The transformation engine will reject the following code:

    function processFiles() {
        // ...
        var len = fileLength_(p); // ERROR
        // ...
    }

But you can get around it by switching to the tradional callback style:

    function processFiles() {
        // ...
        fileLength(p, function(err, len) { // OK
            // ...
        });
    }

Mixing with regular node.js code
--------------------------------

You can mix _streamlined_ functions and traditional callback based functions in the same file at your will.

The transformation engine will only convert the functions that follow the underscore convention.
It will leave all other functions unmodified.

Anonymous Functions
-------------------

The trick also works with anonymous functions. Just call your anonymous asynchronous functions `_` 
instead of leaving their name empty.

Array utilities
---------------

The standard ES5 Array methods (`forEach`, `map`, `filter`, ...) are nice but they don't deal with callbacks.
So, they are of little help for _streamlined_ Javascript.

The `lib/flows` module contains some utilities to fill the gap:

* `each_(array, fn_)` applies `fn_` sequentially to the elements of `array`.
* `map_(array, fn_)` transforms `array` by applying `fn_` to each element in turn.
* `filter_(array, fn_)` generates a new array that only contains the elements that satisfy the `fn_` predicate.
* `every_(array, fn_)` returns true if `fn_` is true on every element (if `array` is empty too).
* `some_(array, fn_)` returns true if `fn_` is true for at least one element.

In all these functions, the `fn_` callback is called as `fn_(elt)` (`fn(elt, _)` behind the scenes).  

Note: Unlike ES5, the callback does not have any optional arguments (`i`, `thisObj`).
  This is because the transformation engine adds the callback at the end of the argument list and 
  we don't want to impose the presence of the optional arguments in every callback.

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
        function _() { /* branch 1 */ },
        function _() { /* branch 2 */ },
        function _() { /* branch 3 */ },
        ...
    ]).collectAll_();
    // do something with results...
  
This code executes the different branches in parallel and collects the result into an array which is
returned by `collectAll_()`.

Another typical pattern is:

    var result = spray([
        function _() { /* what we want to do */ },
        function _() { /* set timeout */ }
    ]).collectOne_();
    // test result to find out which branch completed first.
  
Note: `spray` is synchronous as it only sets things up. So don't call it with an underscore. 
  The `collect` functions are the asynchronous ones that start and control parallel execution.
  
The `funnel` function is typically used with the following pattern:

    // somewhere
    var myFunnel = funnel(10); // create a funnel that only allows 10 concurrent streamlines.
  
    // elsewhere
    myFunnel.channel_(function _() { /* code with at most 10 concurrent executions */ });
  
Note: Here also, the `funnel` function only sets things up and is synchronous. 
  The `channel_` function deals with the async part.
  
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

* Irregular `switch` statements (with `case` clauses that flow into each other) are not yet handled by
the transformation engine.
* Labelled `break` and `continue` are not yet supported.
* Files are transformed every time node starts. A cache will be added later (implies upgrading to node.js 0.3.X 
first because the 0.2 `registerExtension` call does not pass the file name to the transformation hook).
* Debugging may be tricky because the line numbers are off in the transformed source.
* A CoffeeScript version would be a nice plus. This should not be too difficult as the transformations can be chained.

Running _streamlined_ code
==========================

You can run _streamlined_ code as a node script file directly from the command line:

    node streamline-dir/lib/node-init.js myscript.js [args]

You can also load the transformation engine from your main server script and let the node
module infrastructure do the job. You need to add the following line to your main server script:

    require('streamline_dir/lib/node-init.js')
  
and include the following special marker in all your _streamlined_ source files:

    !!STREAMLINE!!

With this setup, node will automatically transform the files that carry the special marker when your code
_requires_ them.

On the client side, you can use the `transform.js` API to convert the code and then `eval` it, 
There is only one call in the `transform.js` API:

    var converted = Streamline.transform(source);

Note: We also have a small `require` infrastructure to let the browser load files that have been _streamlined_ 
by a `node.js` server but it is not packaged for publication yet. It will be published later.

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

Note: the `!!STREAMLINE!!` marker works with node.js 0.2.6 but will likely fail with 0.3.x as the `registerExtension` API 
has been deprecated. 

Discussion
==========

For support and discussion, please join the [streamline.js Google Group](http://groups.google.com/group/streamlinejs).

License
=======

This work is licensed under the [MIT license](http://en.wikipedia.org/wiki/MIT_License).
