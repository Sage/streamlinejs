"use strict";

/// !doc
/// 
/// # Compiler and file loader
///  
/// `var compiler = require('streamline/lib/compiler/compile')`
/// 
var fs = require("fs");
var fspath = require("path");
var babel = require('babel');
var util = require('./util');
var cache = require('./cache');
var compileSync = require('../compiler/compileSync');

var _exists = function(cb, fname) {
	fs.exists(fname, function(result) {
		cb(null, result);
	});
};

function mtime(_, fname) {
	return _exists(_, fname) ? fs.stat(fname, _).mtime : 0;
}

var _0755 = parseInt("0755", 8);

function _extend(obj, other) {
	for (var i in other) {
		obj[i] = other[i];
	}
	return obj;
}

function mkdirp(_, path) {
	try {
		fs.mkdir(path, _0755, _);
	} catch (err) {
		if (err.code === 'EEXIST') {
			if (fs.stat(path, _).isDirectory()) {
				return;
			}
			throw err;
		}
		if (err.code === 'ENOENT') {
			mkdirp(_, fspath.join(path, '..'));
			fs.mkdir(path, _0755, _);
			return;
		}
		throw err;
	}
}

function outputFile(_, inFile, options) {
	var dirname = fspath.dirname(inFile);
	var outDir;
	if (options.outputDir) {
		if (options.baseDir) {
			outDir = fspath.join(options.outputDir, fspath.relative(options.baseDir, dirname));
		} else {
			outDir = options.outputDir;
		}
	} else {
		outDir = dirname;
	}
	mkdirp(_, outDir);
	var stripped = fspath.basename(inFile, fspath.extname(inFile));
	return fspath.join(outDir, stripped + ".js");
}

function transformFile(path, options, _) {
	var babelOptions = util.babelOptions(options, "transform");
	if (/\._coffee$/.test(path)) {
		var decaf = require('coffee-script').compile(fs.readFile(path, 'utf8', _), {
			sourceMap: true,
			generatedFile: path.replace(/\._coffee$/, '.coffee'),
			sourceFiles: [path],
		});
		babelOptions.filename = path;
		babelOptions.sourceFileName = path;
		babelOptions.inputSourceMap = JSON.parse(decaf.v3SourceMap);
		return babel.transform(decaf.js, babelOptions);
	} else {
		return babel.transformFile(path, babelOptions, _);	
	}
}

/// Transform streamline source
exports.compileFile = function(_, path, options) {
	options = util.getOptions(options);
	var transformed = transformFile(path, options, _);
	if (options.noWrite) {
		return {
			transformed: transformed.code,
			sourceMap: transformed.map,
		};
	}
	if (options.sourceMap) {
		var mapFile = options.sourceMapFile || path.replace(/\.\w+$/, '.map');
		transformed.code += '\n//@ sourceMappingURL=' + (options.sourceMapFile ? mapFile : fspath.basename(mapFile)); 
	}
	var dstName = outputFile(_, path, options);
	if (options.verbose) util.log("creating: " + dstName);
	fs.writeFile(dstName, transformed.code, 'utf8', _);

	if (options.sourceMap) {
		if (options.verbose) util.log("creating: " + mapFile);
		fs.writeFile(mapFile, JSON.stringify(transformed.map), 'utf8', _);
	}
};

// * `script = compiler.loadFile(_, path, options)`
//   Loads Javascript file and transforms it if necessary.
//   Returns the transformed source.
//   `options` is a set of options passed to the transformation engine.
//   If `options.force` is set, `foo._js` is transformed even if `foo.js` is more recent.
exports.loadFile = function(_, path, options) {
	options = util.getOptions(options);
	return cache.async(_, path, options, function(_) {
		var banner = util.banner(options);
		var content = transformFile(path, options, _).code;
		var shebangparse = util.parseShebang(content);
		var shebang = shebangparse[0];
		var le = shebangparse[2];
		content = shebangparse[1];
		banner = shebang + le + banner;
		return /\._(js|coffee)$/.test(path) ? banner + content : content;
	});
};

exports.transformModule = compileSync.transformModule;
exports.cachedTransformSync = compileSync.cachedTransformSync;

/// Compile streamline or coffee src and return the transformed
/// content.
exports.transform = function(_, path, options) {
	options = util.getOptions(options);
	if (!util.canCompile(path)) return;
	return cache.async(_, path, options, function(_) {
		return transformFile(path, options, _).code;
	});
};

/// * `compiler.compile(_, paths, options)`
///   Compiles streamline source files in `paths`.
///   Generates a `foo.js` file for each `foo._js` file found in `paths`.
///   `paths` may be a list of files or a list of directories which
///   will be traversed recursively.  
///   `options`  is a set of options for the `transform` operation.
exports.compile = function(_, paths, options) {
	options = util.getOptions(options);
	function _compile(_, path, base, options) {
		var stat = fs.stat(path, _);
		if (stat.isDirectory()) {
			base = base || path;
			fs.readdir(path, _).forEach_(_, function(_, f) {
				_compile(_, path + "/" + f, base, options);
			});
		} else if (stat.isFile()) {
			try {
				base = base || fspath.dirname(path);
				options.baseDir = base;
				if (util.canCompile(path)) exports.compileFile(_, path, options);
			} catch (ex) {
				console.error(ex.stack);
				failed++;
			}
		}
		// else ignore
	}

	var failed = 0;
	if (options.verbose) util.log("transform version: " + require('../../package').version);
	if (!paths || paths.length === 0) throw new Error("cannot compile: no files specified");
	var cwd = process.cwd();
	paths.forEach_(_, function(_, path) {
		_compile(_, fspath.resolve(cwd, path), null, options);
	});
	if (failed) throw new Error("errors found in " + failed + " files");
};

//util.deprecate(module, 'use babel API instead');