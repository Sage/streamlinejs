<blockquote>
Simple things should be simple. Complex things should be possible.
<br/><em>Alan Kay</em>
</blockquote>

## Installation

To run this tutorial you need to install streamline.js and its companion [ez-streams](https://github.com/Sage/ez-streams) library, which is the default streaming library for streamline.

``` sh
npm install -g streamline
npm install ez-streams
```

## [Hello world!](tuto1-hello._js)

Let us start with streamline's version of node's hello world:

```javascript
"use strict";
var ez = require('ez-streams');

ez.devices.http.server(function(request, response, _) {
	response.writeHead(200, {
		'Content-Type': 'text/plain; charset=utf8'
	});
	response.end("Hello world!");

}).listen(_, 1337);
console.log('Server running at http://127.0.0.1:1337/');
```

To run it, save this source as `tuto1._js` and start it with:

```javascript
_node tuto1
```

Now, point your browser to http://127.0.0.1:1337/. You should get a `"hello world"` message.

This code is very close to the original version. Just a few differences:

* The server is created with streamline's `ez.devices.http.server` rather than with node's `http.createServer` call.
* The server callback takes an additional `_` parameter. This parameter is streamline's _callback stub_. This is the magic token that we will pass to all asynchronous calls that expect a node.js callback.
* The `request` and `response` parameters are streamline wrappers around node's request and response streams. These wrappers don't make a difference for now but they will make it easier to read and write from these streams later.
* `listen` is called with an `_` argument. This is because `listen` is an asynchronous call. The streamline version prints the `'Server running ...'` message after receiving the `listening` event, while the original node version prints the message without waiting for the `listening` event. This is a really minor difference though, and streamline makes it easy to avoid the wait if you don't care: just call `listen` as a _future_ by passing `!_` instead of `_`. If you're discovering _streamline.js_ don't worry about all this now. I'll talk more about futures at the end of this tutorial.
* The source file extension is `._js` instead of `.js` and you run it with `_node` rather than `node`. This is because _streamline.js_ extends the JavaScript language and the code needs to be transformed before being passed the JavaScript engine (note: `_node` has a `--cache` option which speeds up load time by shortcircuiting the transformation when files don't change).

## [Setting up a simple search form](tuto2-form._js)

Now, we are going to be a bit more ambitious and turn our page into a simple search form:

```javascript
"use strict";
var ez = require('ez-streams');
var url = require('url');
var qs = require('querystring');

var begPage = '<html><head><title>My Search</title></head></body>' + //
'<form action="/">Search: ' + //
'<input name="q" value="{q}"/>' + //
'<input type="submit"/>' + //
'</form><hr/>';
var endPage = '<hr/>generated in {ms}ms</body></html>';

ez.devices.http.server(function(request, response, _) {
	var query = qs.parse(url.parse(request.url).query),
		t0 = new Date();
	response.writeHead(200, {
		'Content-Type': 'text/html; charset=utf8'
	});
	response.write(_, begPage.replace('{q}', query.q || ''));
	response.write(_, search(_, query.q));
	response.write(_, endPage.replace('{ms}', new Date() - t0));
	response.end();
}).listen(_, 1337);
console.log('Server running at http://127.0.0.1:1337/');

function search(_, q) {
	return "NIY: " + q;
}
```

Nothing difficult here. We are using node's `url` and `querystring` helper modules to parse the URL and its query string component. We are now writing the response in 3 chunks with the asynchronous `write` method of the wrapped response stream.

We are going to implement the `search` function next. For now we are just returning a `NIY` message. Note that we pass `_` as first parameter to our `search` function. We need this parameter because `search` will be an asynchronous function.

## [Calling Google](tuto3-google._js)

Now we are going to implement the `search` function by passing our search string to Google. Here is the code:

```javascript
function search(_, q) {
	if (!q || /^\s*$/.test(q)) return "Please enter a text to search";
	// pass it to Google
	var json = ez.devices.http.client({
		url: 'http://ajax.googleapis.com/ajax/services/search/web?v=1.0&q=' + q,
		proxy: process.env.http_proxy
	}).end().response(_).checkStatus(200).readAll(_);
	// parse JSON response
	var parsed = JSON.parse(json);
	// Google may refuse our request. Return the message then.
	if (!parsed.responseData) return "GOOGLE ERROR: " + parsed.responseDetails;
	// format result in HTML
	return '<ul>' + parsed.responseData.results.map(function(entry) {
		return '<li><a href="' + entry.url + '">' + entry.titleNoFormatting + '</a></li>';
	}).join('') + '</ul>';
}
```

`ez.devices.http.client` is a small wrapper around node's `http.request` call. It allows us to obtain the response with a simple `response(_)` asynchronous call, and to read from this response with a simple asynchronous `readAll(_)` call (there is also an asynchronous `read` call which would let us read one chunk at a time, or read up to a given length). Notice how the calls can be naturally chained to obtain the response data.

In this example we do not need to post any data to the remote URL. But this would not be difficult either. It would just be a matter of calling asynchronous `write(_, data)` methods before calling the `end()` method.

## [Dealing with errors](tuto4-catch._js)

If our `search` function fails, an exception will be propagated. If we don't do anything special, the exception will bubble up to the request dispatcher created by `ez.devices.http.server(...)`. This dispatcher will catch it and generate a 500 response with the error message.

This is probably a bit rude to our users. But we can do a better job by trapping the error and injecting the error message into our HTML page. All we need is a `try/catch` inside our `search` function:

```javascript
function search(_, q) {
	if (!q || /^\s*$/.test(q)) return "Please enter a text to search";
	// pass it to Google
	try {
		var json = ez.devices.http.client({
			url: 'http://ajax.googleapis.com/ajax/services/search/web?v=1.0&q=' + q,
			proxy: process.env.http_proxy
		}).end().response(_).checkStatus(200).readAll(_);
		// parse JSON response
		var parsed = JSON.parse(json);
		// Google may refuse our request. Return the message then.
		if (!parsed.responseData) return "GOOGLE ERROR: " + parsed.responseDetails;
		// format result in HTML
		return '<ul>' + parsed.responseData.results.map(function(entry) {
			return '<li><a href="' + entry.url + '">' + entry.titleNoFormatting + '</a></li>';
		}).join('') + '</ul>';
	} catch (ex) {
		return 'an error occured. Retry or contact the site admin: ' + ex.message;
	}
}
```

## [Searching through files](tuto5-files._js)

Now, we are going to extend our search to also search the text in local files. Our `search` function becomes:

```javascript
function search(_, q) {
	if (!q || /^\s*$/.test(q)) return "Please enter a text to search";
	try {
		return '<h2>Web</h2>' + googleSearch(_, q) + '<hr/><h2>Files</h2>' + fileSearch(_, q);
	} catch (ex) {
		return 'an error occured. Retry or contact the site admin: ' + ex.stack;
	}
}

function googleSearch(_, q) {
	var json = ez.devices.http.client(...
	...
	return '<ul>' + ...
}

function fileSearch(_, q) {
	var t0 = new Date();
	var results = '';

	function doDir(_, dir) {
		fs.readdir(dir, _).forEach_(_, function(_, file) {
			var f = dir + '/' + file;
			var stat = fs.stat(f, _);
			if (stat.isFile()) {
				fs.readFile(f, 'utf8', _).split('\n').forEach(function(line, i) {
					if (line.indexOf(q) >= 0) results += '<br/>' + f + ':' + i + ':' + line;
				});
			} else if (stat.isDirectory()) {
				doDir(_, f);
			}
		});
	}
	doDir(_, __dirname);
	return results + '<br/>completed in ' + (new Date() - t0) + ' ms';;
}
```

The `forEach_` function is streamline's asynchronous variant of the standard EcmaScript 5 `forEach` array function. It is needed here because the body of the loop contains asynchronous calls. And steamline would give us an error if we were to use the synchronous `forEach` with an asynchronous loop body. Note that streamline also provides asynchronous variants for the other ES5 array functions: `map`, `some`, `every`, `filter`, `reduce` and `reduceRight`.

Otherwise, there is not much to say about `fileSearch`. It uses a simple recursive directory traversal logic. 

## [Searching in MongoDB](tuto6-mongo._js)

Now, we are going to extend our search to a MongoDB database.

To run this you need to install MongoDB and start the mongod daemon. You also have to install the node MongoDB driver:

```sh
npm install mongodb
```

We have to modify our `search` function again:

```javascript
function search(_, q) {
	if (!q || /^\s*$/.test(q)) return "Please enter a text to search";
	// pass it to Google
	try {
		return '<h2>Web</h2>' + googleSearch(_, q) //
		+ '<hr/><h2>Files</h2>' + fileSearch(_, q) //
		+ '<hr/><h2>Mongo</h2>' + mongoSearch(_, q);
	} catch (ex) {
		return 'an error occured. Retry or contact the site admin: ' + ex.stack;
	}
}
```

Here comes `mongoSearch`:

``` javascript
var mongodb = require('mongodb');

function mongoSearch(_, q) {
	var t0 = new Date();
	var db = new mongodb.Db('tutorial', new mongodb.Server("127.0.0.1", 27017, {}));
	db.open(_);
	try {
		var coln = db.collection('movies', _);
		if (coln.count(_) === 0) coln.insert(MOVIES, _);
		var re = new RegExp(".*" + q + ".*");
		return coln.find({
			$or: [{
				title: re
			}, {
				director: re
			}]
		}, _).toArray(_).map(function(movie) {
			return movie.title + ': ' + movie.director;
		}).join('<br/>') + '<br/>completed in ' + (new Date() - t0) + ' ms';;
	} finally {
		db.close();
	}
}
```

where `MOVIES` is used to initialize our little movies database:

```javascript
var MOVIES = [{
	title: 'To be or not to be',
	director: 'Ernst Lubitsch'
}, {
	title: 'La Strada',
	director: 'Federico Fellini'
}, {
	...
}];
```

The `mongoSearch` function is rather straightforwards once you know the mongodb API. The `try/finally` is rather interesting: it guarantees that the database will be closed regardless of whether the `try` block completes successfully or throws an exception.

## [Parallelizing](tuto7-parallel._js)

So far so good. But the code that we have written executes completely sequentially. So we only start the directory search after having obtained the response from Google and we only start the Mongo search after having completed the directory search. This is very inefficient. We should run these 3 independent search operations in parallel.

This is where _futures_ come into play. The principle is simple: if you call an asynchronous function with `!_` instead of `_`, the function returns a _future_ `f` that you can call later as `f(_)` to obtain the result.

So, to parallelize, we just need a small change to our `search` function:

```javascript
function search(_, q) {
	if (!q || /^\s*$/.test(q)) return "Please enter a text to search";
	try {
		// start the 3 futures
		var googleFuture = googleSearch(!_, q);
		var fileFuture = fileSearch(!_, q);
		var mongoFuture = mongoSearch(!_, q);
		// join the results
		return '<h2>Web</h2>' + googleFuture(_) //
		+ '<hr/><h2>Files</h2>' + fileFuture(_) //
		+ '<hr/><h2>Mongo</h2>' + mongoFuture(_);
	} catch (ex) {
		return 'an error occured. Retry or contact the site admin: ' + ex.stack;
	}
}
```

We can also go further and parallelize the directory traversal. This could be done with futures but there is a simpler way to do it: passing the number of parallel operations as second argument to the `forEach_` call:

```javascript
	function doDir(_, dir) {
		fs.readdir(dir, _).forEach_(_, 4, function(_, file) {
			var stat = fs.stat(dir + '/' + file, _);
			...
		});
	}
```

We could pass -1 instead of 4 to execute all iterations in parallel. But then we would have a risk of running out of file descriptors when traversing large trees. The best way to do it then is to pass -1 and use the `flows.funnel` function to limit concurrency in the low level function. Here is the modified function:

```javascript
var fs = require('fs'),
	flows = require('streamline/lib/util/flows');

function fileSearch(_, q) {
	var t0 = new Date();
	var results = '';
	// allocate a funnel for 20 concurrent executions
	var filesFunnel = flows.funnel(20);

	function doDir(_, dir) {
		fs.readdir(dir, _).forEach_(_, -1, function(_, file) {
			var stat = fs.stat(dir + '/' + file, _);
			if (stat.isFile()) {
				// use the funnel to limit the number of open files 
				filesFunnel(_, function(_) {
					fs.readFile(dir + '/' + file, 'utf8', _).split('\n').forEach(function(line, i) {
						if (line.indexOf(q) >= 0) results += '<br/>' + dir + '/' + file + ':' + i + ':' + line;
					});
				});
			} else if (stat.isDirectory()) {
				doDir(_, dir + '/' + file);
			}
		});
	}
	doDir(_, __dirname);
	return results + '<br/>completed in ' + (new Date() - t0) + ' ms';;
}
```

The `filesFunnel` function acts like a semaphore. It limits the number of concurrent entries in its inner function to 20. 

With this implementation, each call to `fileSearch` opens 20 files at most but we could still run out of file descriptors when lots of requests are handled concurrently. The fix is simple though: move the `filesFunnel` declaration one level up, just after the declaration of `flows`. And also bump the limit to 100 because this is now a global funnel:

```javascript
var fs = require('fs'),
	flows = require('streamline/lib/util/flows');
// allocate a funnel for 100 concurrent open files
var filesFunnel = flows.funnel(100);

function fileSearch(_, q) {
	// same as above, without the filesFunnel var declaration
}
```

## Fixing race conditions

And, last but not least, there is a concurrency bug in this code! Let's fix it.

 The problem is in the code that initializes the movies collection in MongoDB:

 ```javascript
 		if (coln.count(_) === 0) coln.insert(MOVIES, _);
 ```

The problem is that the code yields everywhere we have an `_` in the code. So this code can get interrupted between the `coln.count(_)` call and the `coln.insert(MOVIES, _)` call. And we can get into the unfortunate situation where two requests or more will get a count of 0, which would lead to multiple insertions of the `MOVIES` list.

This is easy to fix, though. All we need is a little funnel to restrict access to this critical section:

```javascript
var mongodb = require('mongodb'),
	mongoFunnel = flows.funnel(1);

function mongoSearch(_, q) {
	...
	db.open(_);
	try {
		var coln = db.collection('movies', _);
		mongoFunnel(_, function(_) {
			if (coln.count(_) === 0) coln.insert(MOVIES, _);
		});
		var re = new RegExp(".*" + q + ".*");
		return ...
	} finally {
		db.close();
	}
}
```

## Wrapping up

In this tutorial we have done the following:

* [Create a simple web server](tuto1-hello._js)
* [Set up a little search form](tuto2-form._js)
* [Call a Google API to handle the search](tuto3-google._js) 
* [Handle errors](tuto4-catch._js) 
* [Search a tree of files](tuto5-files._js) 
* [Search inside MongoDB](tuto6-mongo._js) 
* [Parallelize and fix race conditions](tuto7-parallel._js)

This should give you a flavor of what _streamline.js_ programming looks like. Don't forget to read the [README](../README.md) and the [FAQ](../FAQ.md).



