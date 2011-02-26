## streamline.js

`streamline.js` is a small tool to simplify asynchronous Javascript programming.

Instead of writing hairy code like:

    function lineCount(path, callback) {
      fs.readFile(path, function(err, data) {
        if (err) { callback(err); return; }
        callback(null, data.split('\n').length);
      });
    }

Streamline.js lets you write:

    function lineCount(path, _) {
      return fs.readFile(path, _).split('\n').length;
    }

You just have to follow a simple rule:

> Replace all callbacks by an underscore and write your code as if all functions were synchronous.

Streamline will transform the code and generate the callbacks for you!

And streamline is not limited to a subset of Javascript. 
You can use all the flow control features of Javascript in your asynchronous code: conditionals, 
loops, `try/catch/finally` blocks, anonymous functions, `this`, etc. 

Streamline generates more or less the callbacks that you would write yourself. So you get the same level
of performance as with hand-written callbacks. 
Also, the generated code is nicely indented, easy to read, and directly available to debuggers.

# Installation

The easiest way to install `streamline.js` is with NPM:

    npm install streamline
    
# Creating a streamline module

To create a module called `myModule`, put your _streamlined_ source in a file called `myModule_.js`.
Streamline will transform the code and will save it into a file called `myModule.js`. 
You just need to create an empty `myModule.js` file to initiate the process.

See `examples/diskUsage_.js` for a simple streamline module that traverses directories to compute disk usage.

# Running with node.js

You can run standalone streamline modules with `node-streamline`. For example:

    node-streamline examples/diskUsage

You can also integrate streamline modules into an existing node application. 
You just need to add the following line to your initialization script:

    require('streamline');

Then you can _require_ streamline modules. They will be automatically transformed at require time.

# Interoperability with standard node.js code

You can call standard node functions from streamline code. For example the `fs.readFile` function:

    function lineCount(path, _) {
      return fs.readFile(path, _).split('\n').length;
    }

You can also call streamline functions as if they were standard node functions. For example:

    lineCount("README.MD", function(err, result) {
      if (err) return console.error("ERROR: " + err.message);
      console.log("readme has " + result + " lines.");
    });

And you can mix streamline functions, classical callback based code and synchrononous functions in the same file. 
Streamline will only transform the functions that have the special `_` parameter. The other functions will end up unmodified in the output file (maybe slightly reformatted by the narcissus pretty printer).

# Running in other environments

`streamline.js` generates vanilla Javascript code that may be run browser-side too.

You can also transform the code in the browser. See the `test/*.js` unit test files for examples.

You can also use `streamline.js` with CoffeeScript. For example:

    coffee-streamline examples/diskUsage.coffee

# Goodies

The `streamline/flows` module contains some utilities to deal with arrays, parallel execution, context propagation, etc.
See the [flows module](https://github.com/Sage/streamlinejs/wiki/Flows-module) wiki page for details.

## Resources

The [wiki](https://github.com/Sage/streamlinejs/wiki) discusses advanced topics like utility APIs, exception handling, etc.

For support and discussion, please join the [streamline.js Google Group](http://groups.google.com/group/streamlinejs).

## License

This work is licensed under the [MIT license](http://en.wikipedia.org/wiki/MIT_License).
