"use strict";

var fs = require("fs");
var fsp = require("path");
var util = require('./util');
var cacheSync = require('./cacheSync');

// babel uses process.cwd() to locate its plugins. 
// We have to fool it so that globally installed _node / _coffee can load the streamline plugin.
// Fortunately it caches the result of the first process.cwd() call (see tryRequire implementation)
// So we monkey patch process.cwd, execute a dummy transform, and then restore process.cwd
var dummyTransform = function() {
	var cwd = process.cwd;
	process.cwd = function() {
		return fsp.join(__dirname, '..');
	}
	try {
		require('babel').transform("(function(_) {})", {
			plugins: ['streamline'],
			extra: {
				streamline: {
					quiet: true,
				}
			}
		});
	} catch (ex) {}
	process.cwd = cwd;
	dummyTransform = null;
}

function babelTransform(source, babelOptions) {
	if (dummyTransform) dummyTransform();
	require("babel-plugin-streamline");
	return require('babel').transform(source, babelOptions);	
}

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
		return babelTransform(decaf.js, babelOptions);
	} else {
		if (options.ignore && path && options.ignore(path)) {
			return {
				code: source,
			};
		}
		if (!options.quiet) util.log("transforming (" + options.runtime + "): " + path);
		return babelTransform(util.removeShebang(source), babelOptions);
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
