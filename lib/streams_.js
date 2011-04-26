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

function InputStreamWrapper(stream, options) {
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
		_onEvent(err);
	});
	stream.on('data', function(chunk) {
		_onEvent(null, chunk);
	});
	stream.on('end', function() {
		_onEvent(null, null);
	});
	function trackEvent(err, chunk) {
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

	var _onEvent = trackEvent;

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
			_onEvent = function(err, chunk) {
				if (err)
					_error = err;
				else if (!chunk)
					_done = true;
				_onEvent = trackEvent; // restore it
				_reply(callback, err, chunk);
			};
	}

	function concat(chunks, total) {
		if (_encoding)
			return chunks.join('');
		var result = new Buffer(total);
		chunks.reduce( function(val, chunk) {
			chunk.copy(result, val);
			return val + chunk.length;
		}, 0);
		return result;
	}

	this.setEncoding = function(enc) {
		_encoding = enc;
		if (enc)
			stream.setEncoding(enc);
		return this;
	}
	this.read = function(_, len) {
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
}

function ServerRequestWrapper(req, options) {
	InputStreamWrapper.call(this, req, options);
	this._request = req;
	this.setEncoding(_getEncoding(req.headers));
}

["method", "url", "headers", "trailers", "httpVersion", "connection", "socket"].forEach( function(name) {
	ServerRequestWrapper.prototype.__defineGetter__(name, function() {
		return this._request[name];
	})
});
exports.httpServerRequest = function(req, options) {
	return new ServerRequestWrapper(req, options);
};
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

function ClientResponseWrapper(resp, options) {
	InputStreamWrapper.call(this, resp, options);
	this._response = resp;
	this.setEncoding(_getEncoding(resp.headers));
}

["statusCode", "headers"].forEach( function(name) {
	ClientResponseWrapper.prototype.__defineGetter__(name, function() {
		return this._response[name];
	})
});
ClientResponseWrapper.prototype.checkStatus = function(statuses) {
	if (typeof statuses === 'number')
		statuses = [statuses];
	if (statuses.indexOf(this.statusCode) < 0)
		throw new Error("invalid status: " + this.statusCode);
	return this;
};
function _fixOptions(options) {
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

function ClientRequestWrapper(options) {
	options = _fixOptions(options);
	var _request = options.module.request(options, function(resp) {
		_onEvent(null, resp && new ClientResponseWrapper(resp, options));
	});
	var _response;
	var _error;
	var _done = false;

	_request.on('error', function(err) {
		// TODO: add context to error
		_onEvent(err);
	});
	function trackEvent(err, resp) {
		_done = true;
		_error = err;
		_response =  resp;
	};

	var _onEvent = trackEvent;
	this.write = function(data, enc) {
		_request.write(data, enc);
		return this;
	}
	this.end = function(data, enc) {
		_request.end(data, enc);
		return this;
	}
	this.response = function(callback) {
		if (!callback)
			return __future.call(this, this.response, arguments, 0);
		if (_done)
			return _reply(callback, _error,  _response);
		else
			_onEvent = function(err, resp) {
				_reply(callback, err, resp);
			};
	}
}

exports.httpRequest = function(options) {
	return new ClientRequestWrapper(options);
};

