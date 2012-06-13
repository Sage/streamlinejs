"use strict";
var path = require("path");
var fs = require("fs");

function run(options) {
	var transformer = "streamline/lib/" + (options.generators ? "generators" : options.fibers ? "fibers" : "callbacks") + "/transform";
	var streamline = require(transformer).transform;

	function clone(obj) {
		return Object.keys(obj).reduce(function(val, key) {
			val[key] = obj[key];
			return val;
		}, {});
	}

	var streamliners = {
		_js: function(module, filename, code) {
			if (!code) code = fs.readFileSync(filename, "utf8");

			// If there's a shebang, strip it while preserving line count.
			var match = /^#!.*([^\u0000]*)$/.exec(code);
			if (match) code = match[1];

			var cachedTransform = require("streamline/lib/compiler/compile").cachedTransformSync;
			var opts = clone(options);
			opts.sourceName = filename;
			var streamlined = options.cache ? cachedTransform(code, filename, streamline, opts) : streamline(code, opts);
			module._compile(streamlined, filename)
		},
		_coffee: function(module, filename, code) {
			if (!code) code = fs.readFileSync(filename, "utf8");

			// Compile the source CoffeeScript to regular JS. We make sure to
			// use the module's local instance of CoffeeScript if possible.
			var coffee = require("../util/require")("coffee-script", module.filename);
			var ground = coffee.compile(code, {
				filename: filename
			});

			// Then transform it like regular JS.
			streamliners._js(module, filename, ground);
		}
	};

	// Is CoffeeScript being used? Could be through our own _coffee binary,
	// through its coffee binary, or through require('coffee-script').
	// The latter two add a .coffee require extension handler.
	var executable = path.basename(process.argv[0]);
	var coffeePresent = executable === '_coffee' || require.extensions['.coffee'];

	// Register require() extension handlers for ._js and ._coffee, but only
	// register ._coffee if CoffeeScript is being used.
	require.extensions['._js'] = streamliners._js;
	if (coffeePresent) require.extensions['._coffee'] = streamliners._coffee;

	// If we were asked to register extension handlers only, we're done.
	if (options.registerOnly) return;

	// Otherwise, we're being asked to execute (run) a file too.
	var filename = process.argv[1];

	// If we're running via _coffee, we should run CoffeeScript ourselves so
	// that it can register its regular .coffee handler. We make sure to do
	// this relative to the caller's working directory instead of from here.
	if (coffeePresent) require("../util/require")("coffee-script");

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

	// if node is installed with NVM, NODE_PATH is not defined so we add it to our paths
	if (!process.env.NODE_PATH) mainModule.paths.push(path.join(__dirname, '../../..'));

	// And update the process argv and execPath too.
	process.argv.splice(1, 1, filename)
	process.execPath = filename;

	// Load the target file and evaluate it as the main module.
	require.extensions[coffeePresent ? '._coffee' : '._js'](mainModule, filename);
}

module.exports.run = run;
