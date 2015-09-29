## Streamline.js cheat sheet

### CLI

Running script:

```sh
_node [options] file
_coffee [options] file
```

Compiling script:

```sh
_node [options] file._js
_node [options] dir

_coffee -c [options] file._js
_coffee -c [options] dir
```

Help on options:

``` sh
_node -h
```

Advanced CLI:

See [babel CLI](https://babeljs.io/docs/usage/cli/) and [babel config file](https://babeljs.io/docs/usage/babelrc/)

### API

Registering require hooks:

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

Transforming:

``` javascript
var babel = require('babel');
require('babel-plugin-streamline');

[code, map] = babel.transform(code, {
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

Legacy API:

``` javascript
require('streamline').register({
	runtime: 'fibers',
	// more options
});
```

### Syntax

``` javascript
// async function
function myAsyncFn(arg1, arg2, _) {
	// foo(_) calls allowed here
}

// sync function
function mySyncFn(arg1, arg2) {
	// foo(_) calls forbidden here
}

// async call
result = myAsyncFn("hello", 3, _);

// future call
future = myAsyncFn("hello", 3, !_);
result = future(_);

// promise call
promise = myAsyncFn("hello", 3, void _);
result = promise.then(_, _);

// callback call
myAsyncFn("hello", 3, function(err, result) {
	// do something with result
	// foo(_) forbidden here
});

// interfacing with events:
emitter.on('data', function(data) {
	(function(_) {
	    // do something with data
		// foo(_) allowed here
	})();
})


