"use strict";
var fs = require("fs");
var path = require("path");
var transform = require('./transform');
var flows = require('../deps/streamlib/lib/flows');

function _exists(fname, callback) {
	path.exists(fname, function(result) {
		callback(null, result);
	})
}

function _mkdir(dir, mode, _) {
	var p = path.dirname(dir);
	if (!_exists(p, _))
		_mkdir(p, mode, _);
	fs.mkdir(dir, mode, _);
}

exports.compile = function(options, _) {
	function _compile(_, input, output, options) {
		var stat = fs.stat(input, _);
		if (stat.isDirectory()) {
			output = output || input;
			flows.each(_, fs.readdir(input, _), function(_, f) {
				_compile(_, path.join(input, f), path.join(output, f), options)
			});
		} else if (stat.isFile() && input.match(/_\.js$/)) {
			try {
				output = output || input;
				if (!output.match(/\.js$/))
					output = path.join(output, path.basename(input))
				output = output.replace(/_\.js$/, ".js");
				//console.log("COMPILE " + input + " TO " + output);
				var source = fs.readFile(input, "utf8", _);
				var outDir = path.dirname(output);
				if (!_exists(outDir, _))
					_mkdir(outDir, 0777, _);
				var banner = transform.banner();
				if (!options.force && _exists(output, _) && fs.stat(output, _).mtime >= stat.mtime &&
				fs.readFile(output, "utf8", _).substring(0, banner.length) == banner) {
					return;
				}
				if (options.verbose)
					console.log("compiling " + input);
				options.sourceName = input;
				var transformed = transform.transform(source, options);
				fs.writeFile(output, banner + transformed, 'utf8', _);
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
	flows.each(_, options.inputs, function(_, input) {
		_compile(_, path.join(cwd, input), options.output, options);
	});
	if (failed)
		throw new Error("errors found in " + failed + " files");
}
