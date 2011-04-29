/**
 * Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */
"use strict";
//streamline.options = { "tryCatch" : "fast", "lines" : "ignore" }
var parseUrl = require("url").parse;

function _reply(callback, err, value) {
	try {
		callback(err, value);
	} catch (ex) {
		__propagate(callback, ex);
	}
}

function checkOpen(stream) {
	if (!stream)
		throw new Error("invalid operation on closed stream")
}

function wrapProperties(constr, writable, props) {
	props.forEach( function(name) {
		constr.prototype.__defineGetter__(name, function() {
			return this.stream[name];
		})
	});
	writable && props.forEach( function(name) {
		constr.prototype.__defineSetter__(name, function(val) {
			this.stream[name] = val;
			return this;
		})
	});
}

function wrapMethods(constr, methods) {
	methods.forEach( function(name) {
		constr.prototype[name] = function() {
			return this.stream[name].apply(this.stream, arguments);
		}
	});
}

function wrapChainMethods(constr, methods) {
	methods.forEach( function(name) {
		constr.prototype[name] = function() {
			this.stream[name].apply(this.stream, arguments);
			return this;
		}
	});
}

function unwrap(stream, events) {
	events.forEach( function(event) {
		stream.removeAllListeners(event);
	});
	return null;
}

function ReadableStream(stream, options) {
	options = options || {}
	var _low = Math.max(options.lowMark || 0, 0);
	var _high = Math.max(options.highMark || 0, _low);
	var _paused = false;
	var _current = 0;
	var _chunks = [];
	var _error;
	var _done = false;
	var _encoding;
	var _chunk;

	stream.on('error', function(err) {
		_onData(err);
	});
	stream.on('data', function(chunk) {
		_onData(null, chunk);
	});
	stream.on('end', function() {
		_onData(null, null);
	});
	stream.on('close', function() {
		stream = null;
	});
	function trackData(err, chunk) {
		if (err)
			_error = err;
		else if (chunk) {
			_chunks.push(chunk);
			_current += chunk.length;
			if (_current > _high && !_paused && !_done && !_error) {
				stream.pause();
				_paused = true;
			}
		} else
			_done = true;
	};

	var _onData = trackData;

	function readChunk(callback) {
		if (_chunks.length > 0) {
			var chunk = _chunks.splice(0, 1)[0];
			_current -= chunk.length;
			if (_current <= _low && _paused && !_done && !_error) {
				stream.resume();
				_paused = false;
			}
			return _reply(callback, null, chunk);
		} else if (_done)
			return _reply(callback, null, null);
		else if (_error)
			return _reply(callback, _error);
		else
			_onData = function(err, chunk) {
				if (err)
					_error = err;
				else if (!chunk)
					_done = true;
				_onData = trackData; // restore it
				_reply(callback, err, chunk);
			};
	}

	function concat(chunks, total) {
		if (_encoding)
			return chunks.join('');
		if (chunks.length == 1)
			return chunks[0];
		var result = new Buffer(total);
		chunks.reduce( function(val, chunk) {
			chunk.copy(result, val);
			return val + chunk.length;
		}, 0);
		return result;
	}

	this.setEncoding = function(enc) {
		checkOpen(stream);
		_encoding = enc;
		if (enc)
			stream.setEncoding(enc);
		return this;
	}
	this.read = function(_, len) {
		if (!stream)
			return null;
		if (len == null)
			return readChunk(_);
		if (len < 0)
			len = Infinity;
		if (len == 0)
			return _encoding ? "" : new Buffer(0);
		var chunks = [], total = 0;
		while (total < len) {
			if (!_chunk)
				_chunk = readChunk(_);
			if (!_chunk)
				return chunks.length == 0 ? null : concat(chunks, total);
			if (total + _chunk.length <= len) {
				chunks.push(_chunk);
				total += _chunk.length;
				_chunk = null;
			} else {
				chunks.push(_chunk.slice(0, len - total));
				_chunk = _chunk.slice(len - total);
				total = len;
			}
		}
		return concat(chunks, total);
	}
	this.readAll = function(_) {
		return this.read(_, -1);
	}
	// expose stream so that other listeners can be installed
	this.__defineGetter__("stream", function() {
		return stream;
	})
	this.events = ["error", "data", "end", "close"];
	this.unwrap = function() {
		stream = unwrap(stream, this.events);
	}
}

exports.ReadableStream = ReadableStream;

function WritableStream(stream, options) {
	options = options || {}
	var _drainCallback;

	stream.on('drain', function() {
		var callback = _drainCallback;
		if (callback) {
			_drainCallback = null;
			_reply(callback);
		}
	})
	stream.on('close', function() {
		stream = null;
	});
	function _drain(callback) {
		_drainCallback = callback;
	}

	this.write = function(_, data, enc) {
		checkOpen(stream);
		if (!stream.write(data, enc))
			_drain(_);
		return this;
	}
	this.end = function(data, enc) {
		checkOpen(stream);
		stream.end(data, enc);
		return this;
	}
	// expose stream so that other listeners can be installed
	this.__defineGetter__("stream", function() {
		return stream;
	})
	this.events = ["drain", "close"];
	this.unwrap = function() {
		stream = unwrap(stream, this.events);
	}
}

exports.WritableStream = WritableStream;

function _getEncoding(headers) {
	var comps = (headers['content-type'] || 'text/plain').split(';');
	var ctype = comps[0];
	for (var i = 1; i < comps.length; i++) {
		var pair = comps[i].split('=');
		if (pair.length == 2 && pair[0].trim() == 'charset')
			return pair[1].trim();
	}
	if (ctype.indexOf('text') >= 0 || ctype.indexOf('json') >= 0)
		return "utf8";
	return null;
}

function HttpServerRequest(req, options) {
	ReadableStream.call(this, req, options);
	this._request = req;
	this.setEncoding(_getEncoding(req.headers));
}

// TODO: all properties may not be writable - check
wrapProperties(HttpServerRequest, true, ["method", "url", "headers", "trailers", "httpVersion", "connection", "socket"]);

exports.httpServerRequest = function(req, options) {
	return new HttpServerRequest(req, options);
};
function HttpServerResponse(resp, options) {
	WritableStream.call(this, resp, options);
	this._response = resp;
}

wrapChainMethods(HttpServerResponse, ["writeContinue", "writeHead", "setHeader", "getHeader", "removeHeader", "addTrailers"])
wrapProperties(HttpServerResponse, true, ["statusCode"]);

function _fixHttpServerOptions(options) {
	options = options || {};
	options.module = require(options.secure ? "https" : "http");
	return options;
}

exports.httpServer = function(requestListener, options) {
	options = _fixHttpServerOptions(options);
	return options.module.createServer( function(request, response) {
		return requestListener(new HttpServerRequest(request, options), new HttpServerResponse(response, options));
	})
}
function HttpClientResponse(resp, options) {
	ReadableStream.call(this, resp, options);
	this._response = resp;
	this.setEncoding(_getEncoding(resp.headers));
}

wrapProperties(HttpClientResponse, false, ["statusCode", "httpVersion", "headers", "trailers"]);

HttpClientResponse.prototype.checkStatus = function(statuses) {
	if (typeof statuses === 'number')
		statuses = [statuses];
	if (statuses.indexOf(this.statusCode) < 0)
		throw new Error("invalid status: " + this.statusCode);
	return this;
}
function _fixHttpClientOptions(options) {
	if (!options)
		throw new Error("request error: no options");
	if (typeof options === "string")
		options = { url: options };
	if (options.url) {
		var parsed = parseUrl(options.url);
		options.protocol = parsed.protocol;
		options.host = parsed.hostname;
		options.port = parsed.port;
		options.path = parsed.pathname + (parsed.query ? "?" + parsed.query : "");
	}
	options.protocol = options.protocol || "http:";
	options.port = options.port || (options.protocol === "https:" ? 443 : 80);
	options.path = options.path || "/";
	if (!options.host)
		throw new Error("request error: no host");
	options.method = options.method  || "GET";
	options.headers = options.headers || {};
	options.module = require(options.protocol.substring(0, options.protocol.length - 1));

	if (options.proxy) {
		if (typeof options.proxy === "string") {
			options.proxy = parseUrl(options.proxy);
			options.proxy.host = options.proxy.hostname;
		}
		options.proxy.port = options.proxy.port || options.port;
		if (!options.proxy.host)
			throw new Error("proxy configuration error: no host");
		options.path = options.protocol + "//" + options.host + ":" + options.port + options.path;
		options.headers.host = options.host;
		options.host = options.proxy.host;
		options.port = options.proxy.port;
		// will worry about authenticated proxy later
	}
	return options;
}

function HttpClientRequest(options) {
	options = _fixHttpClientOptions(options);
	var _request = options.module.request(options, function(resp) {
		_onResponse(null, resp && new HttpClientResponse(resp, options));
	});
	WritableStream.call(this, _request, options);
	var _response;
	var _error;
	var _done = false;

	_request.on('error', function(err) {
		// TODO: add context to error
		!_response && _onResponse(err);
	});
	function trackResponse(err, resp) {
		_done = true;
		_error = err;
		_response =  resp;
	};

	var _onResponse = trackResponse;
	this.response = function(callback) {
		if (!callback)
			return __future.call(this, this.response, arguments, 0);
		if (_done)
			return _reply(callback, _error,  _response);
		else
			_onResponse = function(err, resp) {
				_reply(callback, err, resp);
			};
	}
}

wrapChainMethods(HttpClientRequest, ["abort"]);

exports.httpRequest = function(options) {
	return new HttpClientRequest(options);
};
function NetStream(stream, options) {
	ReadableStream.call(this, stream, options.read || options);
	WritableStream.call(this, stream, options.write || options);
}

var net; // lazy require

function NetClient(options, args) {
	args = Array.prototype.slice.call(arguments, 1);
	net = net || require("net");
	var _connection = net.createConnection.apply(net, args);
	var _error;
	var _done = false;

	_connection.on('error', function(err) {
		// TODO: add context to error
		_onConnect(err);
	});
	_connection.on('connect', function() {
		_onConnect(null);
	});
	function trackConnect(err) {
		_done = true;
		_error = err;
	};

	var _onConnect = trackConnect;

	this.connect = function(callback) {
		if (!callback)
			return __future.call(this, this.connect, arguments, 0);
		if (_done)
			return _reply(callback, _error, new NetStream(_connection, options));
		else
			_onConnect = function(err) {
				_reply(callback, err, new NetStream(_connection, options));
			};
	}
}

exports.tcpClient = function(port, host, options) {
	host = host || "localhost";
	options = options || {};
	return new NetClient(options, port, host);
}
exports.socketClient = function(path, options) {
	options = options || {};
	return new NetClient(options, path);
}
