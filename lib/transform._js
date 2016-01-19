"use strict";
/* @flow */

var fs = require("fs");
var fspath = require("path");
var util = require('./util');
var cache = require('./cache');
var transformSync = require('./transformSync');

exports.transformFile = function(_: _<TransformResult>, path: string, options: StreamlineOptions) : void {
	path = path.replace(/\\/g, '/');
	options = util.getOptions(options);
	return cache.get(_, path, options, function(_) {
		options.filename = path;
		return transformSync.transform(fs.readFile(path, 'utf8', _), options);
	});
};
