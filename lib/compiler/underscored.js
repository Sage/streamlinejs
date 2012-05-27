"use strict";
var path = require("path");
var fs = require("fs");

function run(options) {
	var transformer = "streamline/lib/" + (options.generators ? "generators" : options.fibers ? "fibers" : "callbacks") + "/transform";
	var streamline = require(transformer).transform;

	// If CoffeeScript is used, we load it and duck.
	if (!require.extensions['.coffee']) {
		require.extensions['.coffee'] = function(module, filename) {
			try {
				require("coffee-script")
			} catch (e) {
				throw new Error("Cannot load CoffeeScript to compile: '" + filename + "'");
			}
			require.extensions['.coffee'](module, filename);
		}
	}

	function grind(coffee, filename) {
		try {
			var CS = require("coffee-script");
		} catch (e) {
			throw new Error("Cannot load CoffeeScript to compile: '" + filename + "'");
		}
		return CS.compile(coffee, {
			filename: filename
		});
	}

	var streamliners = {
		_js: function(module, filename, code) {
			if (!code) code = fs.readFileSync(filename, "utf8");

			// If there's a shebang, strip it while preserving line count.
			var match = /^#!.*([^\u0000]*)$/.exec(code);
			if (match) code = match[1];

			var cachedTransform = require("streamline/lib/compiler/compile").cachedTransformSync;
			var streamlined = options.cache ? cachedTransform(code, filename, streamline, options) : streamline(code, options);
			module._compile(streamlined, filename)
		},
		_coffee: function(module, filename, code) {
			if (!code) code = fs.readFileSync(filename, "utf8");
			var compiled = grind(code, filename);
			streamliners._js(module, filename, compiled);
		}
	};

	// Register require() extension handlers for ._js and ._coffee.
	require.extensions['._js'] = streamliners._js;
	require.extensions['._coffee'] = streamliners._coffee;

	// If we were asked to register extension handlers only, we're done.
	if (options.registerOnly) return;

	// Otherwise, we're being asked to execute (run) a file too.
	var filename = process.argv[1];

	// We'll make that file the "main" module by reusing the current one.
	var mainModule = require.main;

	// Clear the main module's require cache.
	if (mainModule.moduleCache) {
		mainModule.moduleCache = {};
	}

	// Set the module's paths and filename. Luckily, Node exposes its native
	// helper functions to resolve these guys!
	// https://github.com/joyent/node/blob/master/lib/module.js
	// Except we need to tell Node that these are paths, not native modules.
	filename = path.resolve(filename || '.');
	mainModule.filename = filename = require("module")._resolveFilename(filename);
	mainModule.paths = require("module")._nodeModulePaths(path.dirname(filename));

	// And update the process argv and execPath too.
	process.argv.splice(1, 1, filename)
	process.execPath = filename;

	// Load the target file and evaluate it.
	var ext = path.basename(process.argv[0]) === '_coffee' ? '_coffee' : '_js';
	streamliners[ext](mainModule, filename);
}

module.exports.run = run;
