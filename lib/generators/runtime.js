"use strict";
(function(exports) {
	var globals = exports.globals = require('../globals');
	exports.globals.runtime = 'generators';
	require("../generators/builtins");
	var fut = require("../util/future");
	exports.streamlinify = fut.streamlinify;

	var unstar = exports.unstar;

	exports.unstar = function(fn, options, entering) {
		if (typeof options === "number") options = {
			callbackIndex: options,
		};
		else options = options || {};
		options.promise = options.callbackDefault ? function(fn, args, i) {
			return fut.future.call(this, fn, args, i)(options.callbackDefault());
		} : fut.promise;
		return unstar(fn, options, entering);
	};

	exports.then = exports.star(fut.then, 2);
})(typeof exports !== 'undefined' ? module.exports = Object.create(require('galaxy')) : Streamline.runtime = Streamline.runtime || Object.create(require('galaxy')));
