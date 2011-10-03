//streamline.options = { "lines" : "preserve" }
"use strict";

/// !doc
/// 
/// # streamline/lib/compiler/compile
///  
/// Streamline compiler and file loader
/// 
var fs = require("fs");
var fspath = require("path");
var transform = require('./transform');

function _exists(callback, fname) {
	fspath.exists(fname, function(result) {
		callback(null, result);
	})
}

function _mkdir(dir, mode, _) {
	var p = fspath.dirname(dir);
	if (!_exists(p, _))
		_mkdir(p, mode, _);
	fs.mkdir(dir, mode, _);
}

function mtime(_, fname) {
	return _exists(_, fname) ? fs.stat(fname, _).mtime : 0;
}
function parseShebang(content) {
	if (content[0] === '#' && content[1] === '!') {
		var n = content.indexOf("\n");
		var le = "\n";
		if (n != -1) {
			var shebang = content.substr(0, n);
			if (shebang[shebang.length-1] == "\r") {
				le = "\r\n";
				shebang = shebang.substr(0, shebang.length-1);
			}
			content = content.substr(n+1);
			return [shebang, content, le];
		}
	}
	return ['', content, ''];
}
/// * `script = compile.loadFile(_, path, options)`  
///   Loads Javascript file and transforms it if necessary.  
///   Returns the transformed source.  
///   If `path` is `foo_.js`, the source is transformed and the result
///   is *not* saved to disk.  
///   If `path` is `foo.js` and if a `foo_.js` file exists,
///   `foo_.js` is transformed if necessary and saved as `foo.js`.  
///   If `path` is `foo.js` and `foo_.js` does not exist, the contents
///   of `foo.js` is returned.  
///   `options` is a set of options passed to the transformation engine.  
///   If `options.force` is set, `foo_.js` is transformed even if 
///   `foo.js` is more recent.
exports.loadFile = function(_, path, options) {
	options = options || {};
	options.sourceName = path;
	
	var ext = fspath.extname(path);
	var basename = fspath.basename(path, ext);
	var dirname = fspath.dirname(path);
	
	var js, js_;
	
	var dontSave = basename[basename.length - 1] == '_';
	if (dontSave) {
		path = path.substring(0, path.length - 1);
		js   = dirname + '/' + basename.substr(basename.length -1) + ext;
		js_  = path;
		options.lines = options.lines || "preserve";
	}
	else {
		js  = path;
		js_ = dirname + '/' + basename + '_' + ext;
		options.lines = options.lines || "mark";
	}

	var mtimejs = mtime(_, js);
	var mtimejs_ = mtime(_, js_);

	var banner = transform.banner();
	if (mtimejs_) {
		var content = fs.readFile(js_, 'utf8', _);
		var shebangparse = parseShebang(content);
		var shebang = shebangparse[0];
		var le      = shebangparse[2];
		content     = shebangparse[1];
		
		banner = shebang + le + banner;
		var transformed = mtimejs && fs.readFile(js, 'utf8', _);
		if (transformed 
			&& mtimejs_ < mtimejs 
			&& transformed.substring(0, banner.length) == banner
			&& !options.force) {
			return transformed;
		}
		if (options.verbose) {
			console.log("streamline: transforming: " + js_ + " to " + js)
		}
		var transformed = shebang + banner + transform.transform(content, options);
		if (!dontSave) {
			// try/catch because write will fail if file was installed globally (npm -g)
			try {
				fs.writeFile(js, transformed, 'utf8');
			}
			catch (ex) {
			}
		}
		return transformed;
	}
	else {
		var content = fs.readFile(js, 'utf8', _);
		if (options.compileAnyways) {
			// we don't care about shebang here, but keep line ending if it had a shebang for line counts
			var shebangparse = parseShebang(content);
			var shebang = shebangparse[0];
			content     = shebangparse[2] + shebangparse[1];
			return transform.transform(content, options);
		} else {
			return content;
		}
	}
}

function mtimeSync(fname) {
	try {
		return fs.statSync(fname).mtime;
	}
	catch (ex) {
		return 0;
	}
}

/// * `script = compile.transformModule(path, options)`  
///   Synchronous version of `compile.loadFile`.  
///   Used by `require` logic.
exports.transformModule = function(content, path, options) {
	options = options || {};
	options.sourceName = path;
	
	var ext = fspath.extname(path);
	var basename = fspath.basename(path, ext);
	var dirname = fspath.dirname(path);
	
	var js, js_;
	
	var dontSave = basename[basename.length - 1] == '_';
	if (dontSave) {
		path = path.substring(0, path.length - 1);
		js   = dirname + '/' + basename.substr(basename.length -1) + ext;
		js_  = path;
		options.lines = options.lines || "preserve";
	}
	else {
		js  = path;
		js_ = dirname + '/' + basename + '_' + ext;
		options.lines = options.lines || "mark";
	}
	
	var mtimejs = mtimeSync(js);
	var mtimejs_ = mtimeSync(js_);

	var banner = transform.banner();
		
	if (mtimejs_) {
		if (!dontSave) // reload content from js_ file.
			content = fs.readFileSync(js_, 'utf8');
		var shebangparse = parseShebang(content);
		var shebang = shebangparse[0];
		var le      = shebangparse[2];
		content     = shebangparse[1];
		
		banner = shebang + le + banner;
		var transformed = mtimejs && fs.readFileSync(js, 'utf8');
		if (transformed 
			&& mtimejs_ < mtimejs 
			&& transformed.substring(0, banner.length) == banner
			&& !options.force)
			return transformed;
		if (options.verbose)
			console.log("streamline: transforming: " + js_)
		var transformed = banner + transform.transform(content, options);
		if (!dontSave) {
			// try/catch because write will fail if file was installed globally (npm -g)
			try {
				fs.writeFileSync(js, transformed, 'utf8');
			}
			catch (ex) {
			}
		}
		return transformed;
	}
	else {
		if (options.compileAnyways) {
			// we don't care about shebang here, but keep line ending if it had a shebang for line counts
			var shebangparse = parseShebang(content);
			var shebang = shebangparse[0];
			content     = shebangparse[2] + shebangparse[1];
			return transform.transform(content, options);
		} else {
			return content;
		}
	}
}

/// * `compile.compile(_, paths, options)`  
///   Compiles streamline source files in `paths`.  
///   Generates a `foo.js` file for each `foo_.js` file found in `paths`.
///   `paths` may be a list of files or a list of directories which
///   will be traversed recursively.  
///   `options`  is a set of options for the `transform` operation.
exports.compile = function(_, paths, options) {
	// require flows after register so that flows module gets recompiled automatically
	var flows = require('../util/flows');
	function _compile(_, path, options) {
		var stat = fs.stat(path, _);
		if (stat.isDirectory()) {
			flows.each(_, fs.readdir(path, _), function(_, f) {
				_compile(_, path + "/" + f, options)
			});
		} else if (stat.isFile()) {
			try {
				exports.loadFile(_, path, options);
			} catch (ex) {
				console.error(ex.message);
				failed++;
			}
		}
		// else ignore
	}

	var failed = 0;
	options = options || {};
	if (options.verbose)
		console.log("transform version: " + transform.version)
	if (!paths || paths.length == 0)
		throw new Error("cannot compile: no files specified");
	var cwd = process.cwd;
	flows.each(_, paths, function(_, path) {
		_compile(_, fspath.resolve(cwd, path), options);
	});
	if (failed)
		throw new Error("errors found in " + failed + " files");
}
