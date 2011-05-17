//streamline.options = { "lines" : "ignore" }
"use strict";
var fs = require("fs");
var fspath = require("path");
var transform = require('./transform');
var flows = require('../deps/streamlib/lib/flows');

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

exports.loadFile = function(_, path, options) {
	if (path.indexOf(".js") == path.length - 3)
		path = path.substring(0, path.length - 3);
	options = options || {};
	options.sourceName = path;
	var dontSave = path[path.length - 1] == '_';
	if (dontSave) {
		path = path.substring(0, path.length - 1);
		options.lines = options.lines || "preserve";
	}
	else {
		options.lines = options.lines || "mark";
	}
	var js = path + ".js";
	var js_ = path + "_.js";

	var mtimejs = mtime(_, js);
	var mtimejs_ = mtime(_, js_);

	var banner = transform.banner();
	if (options.lines !== "preserve") 
		banner += "\n";
		
	if (mtimejs_) {
		var content = fs.readFile(js_, 'utf8', _);
		var transformed = mtimejs && fs.readFile(js, 'utf8', _);
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
				fs.writeFile(js, transformed, 'utf8', _);
			}
			catch (ex) {
			}
		}
		return transformed;
	}
	else {
		return fs.readFile(js, 'utf8', _);		
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

exports.loadFileSync = function(path, options) {
	if (path.indexOf(".js") == path.length - 3)
		path = path.substring(0, path.length - 3);
	options = options || {};
	options.sourceName = path;
	var dontSave = path[path.length - 1] == '_';
	if (dontSave) {
		path = path.substring(0, path.length - 1);
		options.lines = options.lines || "preserve";
	}
	else {
		options.lines = options.lines || "mark";
	}
	var js = path + ".js";
	var js_ = path + "_.js";
	
	var mtimejs = mtimeSync(js);
	var mtimejs_ = mtimeSync(js_);

	var banner = transform.banner();
	if (options.lines !== "preserve") 
		banner += "\n";
		
	if (mtimejs_) {
		var content = fs.readFileSync(js_, 'utf8');
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
		return fs.readFileSync(js, 'utf8');		
	}
}

exports.compile = function(options, _) {
	function _compile(_, path, options) {
		var stat = fs.stat(path, _);
		if (stat.isDirectory()) {
			flows.each(_, fs.readdir(path, _), function(_, f) {
				_compile(_, path + "/" + f, options)
			});
		} else if (stat.isFile() && path.match(/_\.js$/)) {
			try {
				var js = path.substring(0, path.length - 4) + ".js";
				exports.loadFile(_, js, options);
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
	if (options.inputs.length == 0)
		throw new Error("cannot compile: no files specified");
	var cwd = process.cwd;
	flows.each(_, options.inputs, function(_, path) {
		_compile(_, fspath.join(cwd, path), options);
	});
	if (failed)
		throw new Error("errors found in " + failed + " files");
}
