"use strict";

var fs = require("fs");
var fsp = require("path");
var util = require('./util');
var cacheSync = require('./cacheSync');

exports.transform = function(source, options) {
	var path = options.filename;
	var babelOptions = util.babelOptions(options, path);
	if (/\._?coffee$/.test(options.ext || path)) {
		var decaf = require('coffee-script').compile(source, {
			sourceMap: true,
			generatedFile: path.replace(/\._coffee$/, '.coffee'),
			sourceFiles: [path],
		});
		if (options.ignore && options.ignore(path)) {
			return {
				code: decaf.js,
				map: JSON.parse(decaf.v3SourceMap),
			};
		}
		babelOptions.inputSourceMap = JSON.parse(decaf.v3SourceMap);
		if (!options.quiet) util.log("transforming (" + options.runtime + "): " + path);
		return require('babel-core').transform(decaf.js, babelOptions);
	} else {
		if (options.ignore && path && options.ignore(path)) {
			return {
				code: source,
			};
		}
		if (!options.quiet) util.log("transforming (" + options.runtime + "): " + path);
		return require('babel-core').transform(util.removeShebang(source), babelOptions);
	}
}

exports.transformFileSync = function(path, options) {
	path = path.replace(/\\/g, '/');
	options = util.getOptions(options);
	return cacheSync.get(path, options, function() {
		options.filename = path;
		return exports.transform(fs.readFileSync(path, 'utf8'), options);
	});
};
