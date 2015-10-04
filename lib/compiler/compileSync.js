"use strict";
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

	var ext = fspath.extname(path);
	var basename = fspath.basename(path, ext);
	var dirname = fspath.dirname(path);

	var js = dirname + '/' + basename + ext;

	var banner = util.banner(options);

	options.sourceName = path;
	var matches;
	var babelOptions = util.babelOptions(options);
	return banner + require('babel').transform(util.removeShebang(content), babelOptions).code;
};

exports.cachedTransformSync = function(content, path, transform, options, testOnly) {
	options = util.getOptions(options);
	if (testOnly) return null;
	var banner = util.banner(options);
	path = path.replace(/\\/g, '/');
	if (options.verbose) util.log("transforming: " + path);
	var babelOptions = util.babelOptions(options);
	return banner + cache.getCode(path, options, function() {
		return require('babel').transform(util.removeShebang(content), babelOptions);
	});
};

util.deprecate(module, 'use babel API instead');