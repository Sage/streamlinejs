"use strict";
var path = require("path");
var fs = require("fs");
var util = require('./util');
var registered = false;

exports.run = function run(options, registerOnly) {
	// Is CoffeeScript being used? Could be through our own _coffee binary,
	// through its coffee binary, or through require('coffee-script').
	// The latter two add a .coffee require extension handler.
	var executable = path.basename(process.argv[0]);
	var coffeeRegistered = require.extensions['.coffee'];
	var coffeeExecuting = executable === '_coffee';
	var coffeePresent = coffeeRegistered || coffeeExecuting;

	if (!registered) {
		registered = true;
		// minimal babel options
		try {
			var babelOptions = util.babelOptions(options, "register");

			// Register require() extension handlers for ._js and ._coffee, but only
			// register ._coffee if CoffeeScript is being used.
			if (coffeePresent && babelOptions.extensions.indexOf('._coffee') < 0) babelOptions.extensions.push("._coffee");

			// now we are ready to require babel
			babelOptions.plugins.forEach(function(plugin) {
				require(plugin);
			});
			require("streamline-plugin");
			require("babel/register")(babelOptions);
			if (options.verbose) util.log("streamline registered");
		} catch (ex) {
			console.error(ex.stack);
			throw ex;
		}
	}

	// If we were asked to register extension handlers only, we're done.
	if (registerOnly) return;

	// Otherwise, we're being asked to execute (run) a file too.
	var filename = process.argv[1];

	// TODO: review CoffeeScript registration below. 
	// We should delegate this to babel. 
	// If we're running via _coffee, we should run CoffeeScript ourselves so
	// that it can register its regular .coffee handler. We make sure to do
	// this relative to the caller's working directory instead of from here.
	// (CoffeeScript 1.7+ no longer registers a handler automatically.)
	if (coffeeExecuting && !coffeeRegistered) {
		var coffee = require("../util/require")("coffee-script");
		if (typeof coffee.register === 'function') {
			coffee.register();
		}
	}

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
	process.argv.splice(1, 1, filename);
	//process.execPath = filename;
	// Load the target file and evaluate it as the main module.
	// The input path should have been resolved to a file, so use its extension.
	// If the file doesn't have an extension (e.g. scripts with a shebang),
	// go by what executable this was called as.
	var ext = path.extname(filename) || (coffeeExecuting ? '._coffee' : '._js');
	require.extensions[ext](mainModule, filename);
}