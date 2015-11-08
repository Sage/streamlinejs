## Streamline.js cheat sheet

### CLI

**Running script:**

```sh
_node [options] file    # or file._js
_coffee [options] file  # or file._coffee
```

**Compiling script:**

```sh
_node -c [options] file._js
_node -c [options] dir

_coffee -c [options] file._coffee
_coffee -c [options] dir
```

Help on options:

``` sh
_node -h
```

**Advanced CLI:**

See [babel CLI](https://babeljs.io/docs/usage/cli/) and [babel config file](https://babeljs.io/docs/usage/babelrc/)

### Syntax

**Function declarations:**

``` javascript
// async function
function foo(arg1, arg2, _) {
	// bar(_) calls allowed here
}

// sync function
function fooSync(arg1, arg2) {
	// bar(_) calls forbidden here
}
```

**Function calls:**

``` javascript
// async call
result = foo("hello", 3, _);

// starting a future (don't wait)
future = foo("hello", 3, !_);
// waiting on the future's result
result = future(_);

// fire and forget (don't wait)
var flows = require('streamline-runtime').flows;
foo("hello", 3, flows.check); // throw on error (recommended)
foo("hello", 3, flows.ignore); // ignore error silently
```

**Interop:**

``` javascript
// with node.js callbacks
foo("hello", 3, function(err, result) {
	// do something with result
	// bar(_) forbidden here
});

// with promises
// starting it
promise = foo("hello", 3, void _);
// waiting on the promise's result
result = promise.then(_, _);

// with node.js events
var flows = require('streamline-runtime').flows;
emitter.on('data', function(data) {
	(function(_) {
	    // do something with data
		// bar(_) allowed here
	})(flows.check);
})
```

### API

**Registering require hooks:**

``` javascript
require("babel-plugin-streamline");
require('babel/register')({
	plugins: ['streamline'],
	extensions: [".js", "._js"],
	// more babel options
	extra: {
		streamline: {
			runtime: "fibers",
		}
	}
});
```
See [babel require hook doc](https://babeljs.io/docs/usage/require/) for more.

**Transforming:**

``` javascript
var babel = require('babel-core');
require('babel-plugin-streamline');

{code, map} = babel.transform(code, {
	plugins: [streamline],
	// more babel options
	extra: {
		streamline: {
			runtime: 'fibers',
			// more streamline options
		}
	}
});
```
See [babel API](https://babeljs.io/docs/usage/api/) for more

**Legacy API:**

``` javascript
require('streamline').register({
	runtime: 'fibers',
	// more options
});
```

