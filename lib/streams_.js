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
	var lowMark = Math.max(options.lowMark || 0, 0);
	var highMark = Math.max(options.highMark || 0, lowMark);
	var paused = false;
	var current = 0;
	var chunks = [];
	var error;
	var done = false;
	stream.on('error', function(err) {
		onEvent(err);
	});
	stream.on('data', function(chunk) {
		onEvent(null, chunk);
	});
	stream.on('end', function() {
		onEvent(null, null);
	});
	var trackEvent = function(err, chunk) {
		if (err)
			error = err;
		else if (chunk) {
			chunks.push(chunk);
			current += chunk.length;
			if (current > highMark && !paused) {
				stream.pause();
				paused = true;
			}
		} else
			done = true;
	};
	var onEvent = trackEvent;
	this.read = function read(callback) {
		if (!callback)
			return __future.call(this, read, arguments, 0);
		if (chunks.length > 0) {
			var chunk = chunks.splice(0, 1)[0];
			current -= chunk.length;
			if (current <= lowMark && paused) {
				stream.resume();
				paused = false;
			}
			return _reply(callback, null, chunk);
		} else if (done)
			return _reply(callback, null, null);
		else if (error)
			return _reply(callback, error);
		else
			onEvent = function(err, chunk) {
				onEvent = trackEvent; // restore it
				_reply(callback, err, chunk);
			};
	}
	function concat(chunks, total) {
		if (chunks[0] instanceof Buffer) {
			var result = new Buffer(total);
			chunks.reduce( function(val, chunk) {
				chunk.copy(result, val);
				return val + chunk.length;
			}, 0);
			return result;
		} else
			return chunks.join('');
	}

	this.readAll = function(_) {
		var chunk, chunks = [], total = 0;
		while (chunk = this.read(_)) {
			chunks.push(chunk);
			total += chunk.length;
		}
		return concat(chunks, total);
	}
}

function ServerRequestWrapper(req, options) {
	InputStreamWrapper.call(this, req, options);
	this._req = req;
}

["method", "url", "headers", "trailers", "httpVersion", "connection", "socket"].forEach( function(name) {
	ServerRequestWrapper.prototype.__defineGetter__(name, function() {
		return this._req[name];
	})
});
exports.httpServerRequest = function(req, options) {
	return new ServerRequestWrapper(req, options);
};
function ClientResponseWrapper(resp, options) {
	InputStreamWrapper.call(this, resp, options);
	this._resp = resp;
}

["statusCode", "headers"].forEach( function(name) {
	ClientResponseWrapper.prototype.__defineGetter__(name, function() {
		return this._resp[name];
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

	if (options.protocol === "https:")
		options.proxy = options.proxy || process.env.https_proxy || process.env.HTTPS_PROXY;
	options.proxy = options.proxy || process.env.http_proxy || process.env.HTTP_PROXY;

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
	var req = options.module.request(options, function(resp) {
		onEvent(null, resp && new ClientResponseWrapper(resp, options));
	})
	var response;
	var error;
	var done = false;
	req.on('error', function(err) {
		// TODO: add context to error
		onEvent(err);
	});
	var trackEvent = function(err, resp) {
		done = true;
		error = err;
		response =  resp;
	};
	var onEvent = trackEvent;
	this.write = function(data, enc) {
		req.write(data, enc);
		return this;
	}
	this.end = function(data, enc) {
		req.end(data, enc);
		return this;
	}
	this.response = function response(callback) {
		if (!callback)
			return __future.call(this, response, arguments, 0);
		if (done)
			return _reply(callback, error,  response);
		else
			onEvent = function(err, resp) {
				_reply(callback, err, resp);
			};
	}
}

exports.httpRequest = function(options) {
	return new ClientRequestWrapper(options);
};

