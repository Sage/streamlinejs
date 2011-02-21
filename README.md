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
  
If you're interested by the genesis of this idea, you can read [the tale of Harry](http://bjouhier.wordpress.com/2011/01/09/asynchronous-javascript-the-tale-of-harry/).
  
Writing _streamlined_ code
==========================

The problem addressed by streamline.js
--------------------------------------

`streamline.js` simplifies the code that you have to write when dealing with asynchronous APIs. 

For example, let us assume that you want to write a simple function that returns the length of a file, 
using the `fs.stat` and `fs.readFile` functions.

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

You have to restructure your code to deal with the callbacks. On this example, this is not too hard, 
but it can become tricky, for example if your code has complex `if/else` branching logic, 
loops, `try/catch/finally` constructs, etc. 
The callback pattern is somehow imposing a special flow on your code.
It is as if every asynchronous call is opening a hole into another flow (the callback flow) and 
you have to push your statements into this new flow. 
It feels a little bit like your statements have leaked through a hole created by the callback. 

This creates two problems:

* Writing algorithms becomes harder because the built-in keywords of Javascript (`if`, `while`, `try/catch`) 
  cannot control the flow as naturally as they did before.
  For example, you have to convert your loops into a recursive form, or use a helper library to write them.
* The code that you write is harder to read because it is polluted by _callback noise_ that does not have 
  much to do with the problem that you are trying to solve.

The solution
------------

`streamline.js` solves this problem by giving you a special callback that somehow _plugs the holes_ 
that the asynchronous calls would create in your flow. 
Once the holes have been plugged, you are back into the familiar synchronous coding style and 
you can use all the flow control statements of the Javascript language.

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

One very important point is that the transformation engine knows how to convert _all_ the constructs of the Javascript language. 
So, the calls that contain the _callback plug_ can be placed anywhere in your code: subexpressions, `if` statements, 
`while` loops, even `try/catch/finally`. 

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

* as `fileLength(_, p)` from another _streamlined_ function. 
  When you use this form, the result is "returned" directly as if you were calling a synchronous function.
* as `fileLength(cb, p)` from a regular Javascript function (or at top level in a script). 
  When you use this form the result is passed to your callback.

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
        fileLength(function(err, len) { // OK
            // ...
        }, p);
    }

Mixing with regular node.js code
--------------------------------

You can mix _streamlined_ functions and traditional callback based functions in the same file at your will.

The transformation engine will only convert the functions that have an underscore as one of their parameters.
It will leave all other functions unmodified.

Advanced options
----------------

You can control the transformation by placing comments like the following in your source file:

    // pragma streamline.xxx

For now, only one `xxx` option is implemented:

* `noTryCatch` this option removes the `try/catch` blocks generated around the body of every streamlined
function, as well as the `try/catch` block in the `__cb` callback helper. This option allows you to generate
more efficient code but requires that you trap exceptions both in low level async libraries called
by streamlined modules and in high level modules that call them. 

TODOs, known issues, etc.
-------------------------

* Irregular `switch` statements (with `case` clauses that flow into each other) are not handled by
the transformation engine (these constructs are questionable so I am not sure that streamline should support them).
* Labelled `break` and `continue` are not yet supported.

Running _streamlined_ code
==========================

You have two options to package _streamlined_ code.

The first one is to use a special convention for your source file names. 
Instead of putting the source for module `xxx` into a file called `xxx.js`, you put it into
a file called `xxx_.js`. When you _require_ `xxx` streamline will read the source from `xxx_.js`,
transform it and save the transformed code into `xxx.js` and will pass the transformed source
to node. 
This option is the preferred option because it works well with debuggers and the transformed file will be cached.

Note: node will not find your module if the `xxx.js` file does not exist. 
So you have to create an empty `xxx.js` file to initiate the process.

The second option is to add a special `!!STREAMLINE!!` marker in your source code (anywhere, usually 
in a comment at the top) and to call your file `xxx.js`, as usual. 
Streamline will detect the marker and transform your code before passing to node. 
The drawback of this option is that the transformed code won't be cached and won't be not available for debugging.

Once you have setup your _streamlined_ code with one of these options, 
you can run it as a node script file directly from the command line:

    node-streamline myscript.js [args]

You can also initialize streamline from your main server script. 
Just add the following line to your main server script:

    require('streamline')

Running with CoffeeScript
=========================

You can also use `streamline.js` with CoffeeScript. To do so, just put the `!!STREAMLINE!!` marker
in your coffeescript modules and run your program with 
`coffee-streamline` instead of `coffee`. For example:

	coffee-streamline myscript.coffee [args]

Node.js installation
====================

Streamline can be installed with NPM. 

For a developper setup, use:

	git clone git@github.com:Sage/streamlinejs.git
	cd streamline
	npm install
	
For a runtime setup, use:

	npm install streamline

Client-side Use
===============

The transformed code is standard Javascript and does not need any special runtime support.
So you can run transformed code directly in the browser.

But you can also transform the code in the browser. 
For this, you can use the `transform.js` API to convert the code and then `eval` it. 
Typical code is:

    var converted = Streamline.transform(source);
    eval(converted);

Note: if you transform the code in the browser, you will need to load Narcissus in your browser.
You can get Narcissus from [github.com/mozilla/narcissus](https://github.com/mozilla/narcissus)
This version of Narcissus requires ECMAScript 5 features (`Object.create`, `Object.defineProperty`, ...). 
So it may not run in all browsers.

Resources
==========

The [[wiki]] discusses advanced topics like utility APIs, exception handling, etc.

For support and discussion, please join the [streamline.js Google Group](http://groups.google.com/group/streamlinejs).

License
=======

This work is licensed under the [MIT license](http://en.wikipedia.org/wiki/MIT_License).
