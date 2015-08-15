"use strict";

var fs = require("fs");
var path = require("path");
var util = require('./util');
var registered = false;

function homeDir() {
	if ((process.env.HOME === undefined) && (process.env.HOMEDRIVE === undefined)) return null;
	return process.env.HOME || ((process.env.HOMEDRIVE + process.env.HOMEPATH)).replace(/\\/g, "/");
}

// Loads the first `.streamline.json` options file found (searching in priority
// order), or an empty object if no such file found.


function loadOptions() {
	var dirs = ['.'];
	if (require.main) { // REPL doesn't have a require.main
		dirs.push(path.dirname(require.main.filename));
	}
	dirs.push(homeDir());
	for (var i = 0; i < dirs.length; i++) {
		var dir = dirs[i];
		if (dir && fs.existsSync(dir + '/.streamline.json')) {
			return JSON.parse(fs.readFileSync(dir + '/.streamline.json', 'utf8'));
		}
	}
	return {};
}

exports.options = {};

exports.register = function(apiOptions, runIt) {
	if (registered) return;
	registered = true;

	var options = exports.options;
	// load legacy options
	[loadOptions(), apiOptions || {}].forEach(function(opts) {
		for (var opt in opts || {}) {
			options[opt] = opts[opt];
		}
	});
	options = exports.options = util.getOptions(options);
	require("./underscored").run(options, !runIt);
}
util.deprecate(module, 'use babel API instead');