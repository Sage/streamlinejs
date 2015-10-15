var fs = require("fs");
var fspath = require("path");
var util = require('./util');
var transform = require('./transform');
var transformSync = require('./transformSync');

var _0755 = parseInt("0755", 8);

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
	if (options.outDir) {
		if (options.sourceRoot) {
			outDir = fspath.join(options.outputDir, fspath.relative(options.sourceRoot, dirname));
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

/// Transform streamline source
function _compileFile(_, path, options) {
	var transformed = transformSync.transform(fs.readFile(path, 'utf8', _), options);
	if (options.sourceMaps) {
		var mapFile = options.sourceMapTarget || path.replace(/\.\w+$/, '.map');
		transformed.code += '\n//# sourceMappingURL=' + (options.sourceMapTarget ? mapFile : fspath.basename(mapFile)); 
	}
	var dstName = outputFile(_, path, options);
	if (!options.quiet) util.log("creating: " + dstName);
	fs.writeFile(dstName, transformed.code, 'utf8', _);

	if (options.sourceMaps && transformed.map) {
		if (!options.quiet) util.log("creating: " + mapFile);
		fs.writeFile(mapFile, JSON.stringify(transformed.map), 'utf8', _);
	}
};

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
				options.sourceRoot = options.sourceRoot || base;
				options.filename = path;
				if (util.canCompile(path)) _compileFile(_, path, options);
			} catch (ex) {
				console.error(ex.stack);
				failed++;
			}
		}
		// else ignore
	}

	var failed = 0;
	if (!options.quiet) util.log("transform version: " + require('../package').version);
	if (!paths || paths.length === 0) throw new Error("cannot compile: no files specified");
	var cwd = process.cwd();
	paths.forEach_(_, function(_, path) {
		_compile(_, fspath.resolve(cwd, path), null, options);
	});
	if (failed) throw new Error("errors found in " + failed + " files");
};
