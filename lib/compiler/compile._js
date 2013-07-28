"use strict";

/// !doc
/// 
/// # Compiler and file loader
///  
/// `var compiler = require('streamline/lib/compiler/compile')`
/// 
var fs = require("fs");
var fspath = require("path");
var compileSync = require('streamline/lib/compiler/compileSync');

function _exists(_, fname) {
	return (function(cb) {
		fs.exists(fname, function(result) {
			cb(null, result);
		})
	})(~_);
}

function mtime(_, fname) {
	return _exists(_, fname) ? fs.stat(fname, ~_).mtime : 0;
}

function _getTransform(options) {
	// req variable prevents client side require from getting it as a dependency
	var req = require;
	if (options.generators) {
		if (options.fast) return req("streamline/lib/generators-fast/transform");
		else return req("streamline/lib/generators/transform");
	} else if (options.fibers) {
		if (options.fast) return req("streamline/lib/fibers-fast/transform");
		else return req("streamline/lib/fibers/transform");
	} else {
		return require("streamline/lib/callbacks/transform");
	}
}

function _banner(version) {
	// important: no newline, to support lines-preserve option!
	return "/*** Generated by streamline " + version + " - DO NOT EDIT ***/";
}

function _extend(obj, other) {
	for (var i in other) {
		obj[i] = other[i];
	}
	return obj;
}

function _transform(transform, source, options) {
	var sourceOptions = /streamline\.options\s*=\s*(\{.*\})/.exec(source);
	if (sourceOptions) {
		_extend(options, JSON.parse(sourceOptions[1]));
	}
	options.source = source;
	options.callback = options.callback || "_";
	options.lines = options.lines || "preserve";
	return transform.transform(source, options);
}

function parseShebang(content) {
	if (content[0] === '#' && content[1] === '!') {
		var n = content.indexOf("\n");
		var le = "\n";
		if (n != -1) {
			var shebang = content.substr(0, n);
			if (shebang[shebang.length - 1] == "\r") {
				le = "\r\n";
				shebang = shebang.substr(0, shebang.length - 1);
			}
			content = content.substr(n + 1);
			return [shebang, content, le];
		}
	}
	return ['', content, ''];
}

exports.compileFile = function(_, path, options) {
	options = _extend({}, options || {});
	var ext = fspath.extname(path);
	var language = ext.substring(2);
	var basename = fspath.basename(path, ext);
	var dirname = fspath.dirname(path);
	var dstName = dirname + "/" + basename + ".js";
	var mtimeSrc = mtime(_, path);
	var mtimeDst = mtime(_, dstName);
	var transform = _getTransform(options);

	var banner = _banner(transform.version);
	options.sourceName = path;
	var content = fs.readFile(path, 'utf8', ~_);
	var shebangparse = parseShebang(content);
	var shebang = shebangparse[0];
	var le = shebangparse[2];
	content = shebangparse[1];
	var coffeeMap;

	if (language === "coffee") {
		var coffee = require("streamline/lib/util/require")("coffee-script");
		if (options.sourceMap) {
			content = coffee.compile(content, {
				filename: path,
				sourceFiles: [path],
				sourceMap: 1
			});
			coffeeMap = new (require('source-map').SourceMapConsumer)(content.v3SourceMap);
			content = content.js;
		} else {
			content = coffee.compile(content, {
				filename: path,
			});
		}
	}

	if (options.sourceMap) {
		options.lines = 'sourcemap';
	}

	banner = shebang + le + banner;
	var transformed = mtimeDst && fs.readFile(dstName, 'utf8', ~_);
	if (transformed && mtimeSrc < mtimeDst && transformed.substring(0, banner.length) == banner && !options.force) {
		return transformed;
	}
	if (options.verbose) {
		console.log("streamline: transforming: " + path + " to " + dstName)
	}
	var transformed = _transform(transform, content, options);
	if (typeof transformed == 'string') {
		transformed = banner + transformed;
	} else {
		transformed.prepend(banner);
	}
	var sourceMap;
	if (options.sourceMap) {
		transformed.add("\n//# sourceMappingURL=" + options.sourceMap + "\n");
		sourceMap = transformed.toStringWithSourceMap({file: dstName});
		transformed = sourceMap.code;
		sourceMap = sourceMap.map;
	}
	if (options.action === 'compile' || !dontSave) {
		// try/catch because write will fail if file was installed globally (npm -g)
		try {
			fs.writeFile(dstName, transformed, 'utf8', ~_);
		} catch (ex) {}
		if (options.sourceMap) {
			if (coffeeMap) {
				sourceMap.applySourceMap(coffeeMap, options.sourceName);
			}
			try {
				fs.writeFile(options.sourceMap, sourceMap.toString(), 'utf8', ~_);
			} catch (ex) {}
		}
	}
}

var streamlineRE = /require\s*\(\s*['"]streamline\/module['"]\s*\)\s*\(\s*module\s*,?\s*([^)]*)?\s*\)/;
// * `script = compiler.loadFile(_, path, options)`  
//   Loads Javascript file and transforms it if necessary.  
//   Returns the transformed source.  
//   `options` is a set of options passed to the transformation engine.  
//   If `options.force` is set, `foo._js` is transformed even if `foo.js` is more recent.
exports.loadFile = function(_, path, options) {
	options = _extend({}, options || {});

	var ext = fspath.extname(path);
	if (ext !== '.js' && ext !== '._js') {
		// special hack for streamline-require
		if (_exists(_, path + '._js')) path = path + (ext = '._js');
		else if (_exists(_, path + '.js')) path = path + (ext = '.js');
		else return;
	}
	var basename = fspath.basename(path, ext);
	var dirname = fspath.dirname(path);

	var mtimejs;
	var dontSave = basename[basename.length - 1] == '_';
	var jsbase = dontSave ? basename.substr(0, basename.length - 1) : basename;
	var js = dirname + '/' + jsbase + ext;
	var fiberjs = dirname + '/' + jsbase + '--fibers' + ext;
	if (options.fibers && (mtimejs = mtime(_, fiberjs))) {
		js = fiberjs;
	} else {
		mtimejs = mtime(_, js);
	}
	options.lines = options.lines || "preserve";

	var transform = _getTransform(options);
	var banner = _banner(transform.version);
	options.sourceName = js;
	var content = fs.readFile(js, 'utf8', ~_);
	var shebangparse = parseShebang(content);
	var shebang = shebangparse[0];
	var le = shebangparse[2];
	content = shebangparse[1];

	banner = shebang + le + banner;
	var matches;
	if (ext === '._js') {
		return cachedTransform(_, content, path, transform, banner, options);
	} else if (matches = streamlineRE.exec(content)) {
		content = removeMarker(content, matches, options);
		return cachedTransform(_, content, path, transform, banner, options);
	} else {
		return content;
	}
}

function removeMarker(content, matches, options) {
	try {
		matches[1] && _extend(options, JSON.parse(matches[1]));
	} catch (ex) {
		throw new Error("Invalid JSON syntax for streamline options: " + matches[1]);
	}
	return content.substring(0, matches.index) + "true" + content.substring(matches.index + matches[0].length);
}

exports.transformModule = compileSync.transformModule;

if (process.env.HOME === undefined && process.env.HOMEDRIVE === undefined) throw new Error("HOME not found, unable to store Streamline callback cache");
var root = (process.env.HOME || (process.env.HOMEDRIVE + process.env.HOMEPATH).replace(/\\/g, '/')) + "/.streamline";

var dirMode = parseInt('777', 8);

function mkdirs(_, path) {
	var p = "",
		i = 0;
	var segs = path.split('/').slice(0, -1);
	while (i < segs.length) {
		var seg = segs[i];
		p += (i++ ? '/' : '') + seg;
		if (i > 1 && !_exists(_, p)) {
			try {
				fs.mkdir(p, dirMode, ~_);
			} catch(err) {
				if (err.code !== 'EEXIST') {
					throw err;
				}
			}
		}
	}
}

function subdir(options) {
	return options.generators ? (options.fast ? 'generators-fast' : 'generators') //
	: options.fibers ? (options.fast ? 'fibers-fast' : 'fibers') //
	: 'callbacks';
}

function cachedTransform(_, content, path, transform, banner, options) {
	path = path.replace(/\\/g, '/');
	var i = path.indexOf('node_modules/');
	if (i < 0) i = path.lastIndexOf('/');
	else i += 'node_modules'.length;

	var dir = root + '/' + subdir(options);
	dir += '/' + path.substring(0, i).replace(/[\/\:]/g, '__');
	var f = dir + path.substring(i);
	mkdirs(_, f);
	var transformed;
	if (mtime(_, f) > mtime(_, path)) {
		transformed = fs.readFile(f, "utf8", ~_);
		if (transformed.substring(0, banner.length) === banner) return transformed;
	}
	// no luck in cache
	if (options.verbose) console.log("streamline: transforming: " + path);
	options.lines = "preserve";
	transformed = banner + _transform(transform, content, options);
	if (path.indexOf('/tmp--') < 0) fs.writeFile(f, transformed, "utf8", ~_);
	return transformed;
}

exports.cachedTransformSync = compileSync.cachedTransformSync;

/// * `compiler.compile(_, paths, options)`  
///   Compiles streamline source files in `paths`.  
///   Generates a `foo.js` file for each `foo._js` file found in `paths`.
///   `paths` may be a list of files or a list of directories which
///   will be traversed recursively.  
///   `options`  is a set of options for the `transform` operation.
exports.compile = function(_, paths, options) {
	function _compile(_, path, options) {
		var stat = fs.stat(path, ~_);
		if (stat.isDirectory()) {
			fs.readdir(path, ~_).forEach_(_, function(_, f) {
				_compile(_, path + "/" + f, options)
			});
		} else if (stat.isFile()) {
			try {
				exports.loadFile(_, path, options);
				var ext = fspath.extname(path);
				if (ext === "._js" || ext === "._coffee") {
					exports.compileFile(_, path, options);
				} else if (ext === ".coffee" && path[path.length - ext.length - 1] !== '_') {
					var jsPath = path.substring(0, path.length - ext.length) + ".js";
					if (options.force || mtime(_, path) > mtime(_, jsPath)) {
						var source = fs.readFile(path, "utf8", ~_);
						var coffee = require("streamline/lib/util/require")("coffee-script");
						var compiled = coffee.compile(source, {
							filename: path
						});
						var matches = streamlineRE.exec(compiled);
						if (matches) {
							if (options.verbose) console.log("streamline: transforming: " + path + " to " + jsPath);
							compiled = removeMarker(compiled, matches, options);
							compiled = _transform(_getTransform(options), compiled, options);
						} else {
							if (options.verbose) console.log("streamline: coffee compiling: " + path + " to " + jsPath);
						}
						fs.writeFile(jsPath, compiled, "utf8", ~_);
					}
				} else {
					exports.loadFile(_, path, options);
				}
			} catch (ex) {
				console.error(ex.stack);
				failed++;
			}
		}
		// else ignore
	}

	var failed = 0;
	options = options || {};
	var transform = _getTransform(options);
	if (options.verbose) console.log("transform version: " + transform.version)
	if (!paths || paths.length == 0) throw new Error("cannot compile: no files specified");
	var cwd = process.cwd();
	paths.forEach_(_, function(_, path) {
		_compile(_, fspath.resolve(cwd, path), options);
	});
	if (failed) throw new Error("errors found in " + failed + " files");
};
