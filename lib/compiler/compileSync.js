"use strict";
/// !doc
/// 
/// # Compiler and file loader (sync version)
///  
/// `var compiler = require('streamline/lib/compiler/compile')`
/// 
var fs = require("fs");
var fspath = require("path");
var util = require("./util");
var cache = require('./cacheSync');

exports.transformModule = function(content, path, options) {
	options = util.getOptions(options);
	options.sourceName = path;
	var babelOptions = util.babelOptions(options);
	return require('babel').transform(util.removeShebang(content), babelOptions).code;
};

exports.cachedTransformSync = function(content, path, options) {
	options = util.getOptions(options);
	path = path.replace(/\\/g, '/');
	if (options.verbose) util.log("transforming: " + path);
	var babelOptions = util.babelOptions(options);
	return cache.getCode(path, options, function() {
		return require('babel').transform(util.removeShebang(content), babelOptions);
	});
};

util.deprecate(module, 'use babel API instead');