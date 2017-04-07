"use strict";

var fs = require("fs");
var fsp = require("path");
var util = require('./util');
var cacheSync = require('./cacheSync');

function tsCheck(result, path) {
	if (result.diagnostics.length > 0) {
		result.diagnostics.forEach(function(diag) {
			var lines = diag.file.text.substring(0, diag.start).split('\n');
			var line = lines.length;
			var col = lines[line - 1].length;
			console.error(diag.file.path + ': ' + diag.messageText + ' (' + line + ':' + col + ')');
		});
		throw new Error(path + ': typescript transpilation failed (' + result.diagnostics.length + ' error(s))');
	}
	return result;
}

function tsCompile(source, path, options) {
	var ts = require('typescript');
	var tsOptions = {
		compilerOptions: options.typescript || {
			target: ts.ScriptTarget.ES2015,
			module: ts.ModuleKind.ES2015,
			sourceMap: true,
		},
		fileName: path,
		reportDiagnostics: true,
	};
	return tsCheck(ts.transpileModule(source, tsOptions), path);
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
