
# Wrappers for node.js streams

The `streams` module contains _pull mode_ wrappers around node streams.

These wrappers implement a _pull style_ API. 
For readable streams, instead of having the stream _push_ the data to its consumer by emitting `data` and `end` events, 
the wrapper lets the consumer _pull_ the data from the stream by calling asynchronous `read` methods.
The wrapper takes care of the low level `pause`/`resume` logic.

Similarly, for writable streams, the wrapper provides a simple asynchronous `write` method and takes
care of the low level `drain` logic.

For more information on this design,
see [this blog post](http://bjouhier.wordpress.com/2011/04/25/asynchronous-episode-3-adventures-in-event-land/)

For a simple example of this API in action, 
see the [google client example](../../../examples/streams/googleClient._js)

## Wrapper

Base wrapper for all objects that emit an `end` or `close` event.  
All stream wrappers derive from this wrapper.

* `wrapper = new streams.Wrapper(stream)`  
  creates a wrapper.
* `emitter = wrapper.emitter`  
   returns the underlying emitter. The emitter stream can be used to attach additional observers.
* `closed = wrapper.closed`   
   returns true if the `close` event has been received.
* `emitter = wrapper.unwrap()`  
   unwraps and returns the underlying emitter.  
   The wrapper should not be used after this call.

## ReadableStream

All readable stream wrappers derive from this wrapper. 

* `stream = new streams.ReadableStream(stream[, options])`  
  creates a readable stream wrapper.
* `stream.setEncoding(enc)`  
  sets the encoding.
  returns `this` for chaining.
* `data = stream.read(_[, len])`  
  reads asynchronously from the stream and returns a `string` or a `Buffer` depending on the encoding.  
  If a `len` argument is passed, the `read` call returns when `len` characters or bytes 
  (depending on encoding) have been read, or when the underlying stream has emitted its `end` event 
  (so it may return less than `len` bytes or chars).
  Reads till the end if `len` is negative.  
  Without `len`, the read calls returns the data chunks as they have been emitted by the underlying stream.  
  Once the end of stream has been reached, the `read` call returns `null`.
* `data = stream.readAll(_)`  
  reads till the end of stream.  
  Equivalent to `stream.read(_, -1)`.
* `stream.unread(chunk)`  
  pushes the chunk back to the stream.  
  returns `this` for chaining.

## WritableStream

All writable stream wrappers derive from this wrapper. 

* `stream = new streams.WritableStream(stream[, options])`  
  creates a writable stream wrapper.
* `stream.write(_, data[, enc])`  
  Writes the data.  
  This operation is asynchronous because it _drains_ the stream if necessary.  
  Returns `this` for chaining.
* `stream.end()`  
  signals the end of the send operation.  
  Returns `this` for chaining.

## HttpServerRequest

This is a wrapper around node's `http.ServerRequest`:
This stream is readable (see `ReadableStream` above).

* `request = new streams.HttpServerRequest(req[, options])`  
   returns a wrapper around `req`, an `http.ServerRequest` object.   
   The `options` parameter can be used to pass `lowMark` and `highMark` values.
* `method = request.method` 
* `url = request.url` 
* `headers = request.headers` 
* `trailers = request.trailers` 
* `httpVersion = request.httpVersion` 
* `connection = request.connection` 
* `socket = request.socket`  
  (same as `http.ServerRequest`)

## HttpServerResponse

This is a wrapper around node's `http.ServerResponse`.  
This stream is writable (see `WritableStream` above).

* `response = new streams.HttpServerResponse(resp[, options])`  
  returns a wrapper around `resp`, an `http.ServerResponse` object.
* `response.writeContinue()` 
* `response.writeHead(head)` 
* `response.setHeader(name, value)` 
* `value = response.getHeader(head)` 
* `response.removeHeader(name)` 
* `response.addTrailers(trailers)` 
* `response.statusCode = value`  
  (same as `http.ServerResponse`)

## HttpServer

This is a wrapper around node's `http.Server` object:

* `server = streams.createHttpServer(requestListener[, options])`    
  creates the wrapper.  
  `requestListener` is called as `requestListener(request, response, _)` 
  where `request` and `response` are wrappers around `http.ServerRequest` and `http.ServerResponse`.  
  A fresh empty global context is set before every call to `requestListener`. See [streamline/lib/globals](../../globals.md).
* `server.listen(_, port[, host])`
* `server.listen(_, path)`  
  (same as `http.Server`)

## HttpClientResponse

This is a wrapper around node's `http.ClientResponse`

This stream is readable (see `ReadableStream` above).

* `response = request.response(_)`  
   returns the response stream.
* `status = response.statusCode`  
   returns the HTTP status code.
* `version = response.httpVersion`  
   returns the HTTP version.
* `headers = response.headers`  
   returns the HTTP response headers.
* `trailers = response.trailers`  
   returns the HTTP response trailers.
* `response.checkStatus(statuses)`  
   throws an error if the status is not in the `statuses` array.  
   If only one status is expected, it may be passed directly as an integer rather than as an array.  
   Returns `this` for chaining.

## HttpClientRequest

This is a wrapper around node's `http.ClientRequest`.

This stream is writable (see `WritableStream` above).

* `request = streams.httpRequest(options)`  
   creates the wrapper.  
   The options are the following:
   * `method`: the HTTP method, `'GET'` by default.
   * `headers`: the HTTP headers.
   * `url`: the requested URL (with query string if necessary).
   * `proxy.url`: the proxy URL.
   * `lowMark` and `highMark`: low and high water mark values for buffering (in bytes or characters depending
     on encoding).  
     Note that these values are only hints as the data is received in chunks.
* `response = request.response(_)`  
   returns the response. 
* `request.abort()`  
   aborts the request. 

## NetStream

This is a wrapper around streams returned by TCP and socket clients:

These streams are both readable and writable (see `ReadableStream` and `WritableStream` above).

* `stream = new streams.NetStream(stream[, options])`  
   creates a network stream wrapper.

## TCP and Socket clients

These are wrappers around node's `net.createConnection`:

* `client = streams.tcpClient(port, host[, options])`  
   returns a TCP connection client.
* `client = streams.socketClient(path[, options])`  
   returns a socket client.  
   The `options` parameter of the constructor provide options for the stream (`lowMark` and `highMark`). 
   If you want different options for `read` and `write` operations, you can specify them by creating `options.read` and `options.write` sub-objects inside `options`.
* `stream = client.connect(_)`  
   connects the client and returns a network stream.

## NetServer

This is a wrapper around node's `net.Server` object:

* `server = streams.createNetServer([serverOptions,] connectionListener [, streamOptions])`    
  creates the wrapper.  
  `connectionListener` is called as `connectionListener(stream, _)` 
  where `stream` is a `NetStream` wrapper around the native connection.  
  A fresh empty global context is set before every call to `connectionListener`. See [streamline/lib/globals](../../globals.md).
* `server.listen(_, port[, host])`  
* `server.listen(_, path)`  
  (same as `net.Server`)

## try/finally wrappers and pump

* `result = streams.using(_, constructor, stream[, options], fn)`  
   wraps `stream` with an instance of `constructor`;
   passes the wrapper to `fn(_, wrapper)` and closes the stream after `fn` returns.  
   `fn` is called inside a `try/finally` block to guarantee that the stream is closed in all cases.  
   Returns the value returned by `fn`.
* `result = streams.usingReadable(_, stream[, options], fn)`  
   shortcut for `streams.using(_, streams.ReadableStream, stream, options, fn)` 
* `result = streams.usingWritable(_, stream[, options], fn)`  
   shortcut for `streams.using(_, streams.WritableStream, stream, options, fn)` 
* `streams.pump(_, inStream, outStream)`  
   Pumps from `inStream` to `outStream`.  
   Does not close the streams at the end.
