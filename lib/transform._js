"use strict";

/// !doc
/// 
/// # Compiler and file loader
///  
/// `var compiler = require('streamline/lib/compile')`
/// 
var fs = require("fs");
var fspath = require("path");
var babel = require('babel');
var util = require('./util');
var cache = require('./cache');
var transformSync = require('./transformSync');

exports.transformFile = function(_, path, options) {
	path = path.replace(/\\/g, '/');
	options = util.getOptions(options, path);
	return cache.get(_, path, options, function(_) {
		if (options.verbose) util.log("transforming: " + path);
		return transformSync.transform(fs.readFile(path, 'utf8', _), options);
	});
};
