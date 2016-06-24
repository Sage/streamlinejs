"use strict";

var fs = require("fs");
var fsp = require("path");
var util = require('./util');
var cacheSync = require('./cacheSync');

function tsCompile(source, path, options) {
	var ts = require('typescript');
	var tsOptions = {
		compilerOptions: options.typescript || {
			target: ts.ScriptTarget.ES2015,
			module: ts.ModuleKind.ES2015,
			sourceMap: true,
		},
		fileName: path,
	};
	return ts.transpileModule(source, tsOptions);
}

exports.transform = function(source, options) {
	var path = options.filename;
	if (options.ignore && path && options.ignore(path)) {
		return {
			code: source,
		};
	}
	if (!options.quiet) util.log("transforming (" + options.runtime + "): " + path);
	var babelOptions = util.babelOptions(options, path);
	var extHint = options.ext || path;
	if (/\._?coffee$/.test(extHint)) {
		var decaf = require('coffee-script').compile(source, {
			sourceMap: true,
			generatedFile: path.replace(/\._coffee$/, '.coffee'),
			sourceFiles: [path],
		});
		if (/\.coffee$/.test(extHint)) {
			return {
				code: decaf.js,
				map: JSON.parse(decaf.v3SourceMap),
			};
		}
		babelOptions.inputSourceMap = JSON.parse(decaf.v3SourceMap);
		return require('babel-core').transform(decaf.js, babelOptions);
	} else if (/\.ts$/.test(extHint)) {
		// use the typescript transpiler to strip type annotations
		var transpiled = tsCompile(source, path, options);
		// pass the result to babel (for streamline transform)
		babelOptions.inputSourceMap = JSON.parse(transpiled.sourceMapText);
		return require('babel-core').transform(transpiled.outputText, babelOptions);
	} else {
		return require('babel-core').transform(util.removeShebang(source), babelOptions);
	}
}

exports.transformFileSync = function(path, options) {
	path = path.replace(/\\/g, '/');
	options = util.getOptions(options);
	if (options.ignore && path && options.ignore(path)) {
		return {
			code: fs.readFileSync(path, 'utf8'),
		};
	}
	return cacheSync.get(path, options, function() {
		options.filename = path;
		return exports.transform(fs.readFileSync(path, 'utf8'), options);
	});
};
