"use strict";
var path = require("path");
var fs = require("fs");
var util = require('./util');
var cache = require('./cacheSync');
var babel = require('babel');
var registered = false;
var Module = require("module");

// special require for CoffeeScript registration
function specialRequire(name, fromDir) {
	if (!fromDir) fromDir = process.cwd();
	var paths = Module._nodeModulePaths(fromDir);
	var path = Module._findPath(name, paths);
	return path ? require(path) : require(name);
};

// add streamline to require paths
(function() {
	var original = Module._nodeModulePaths;
	Module._nodeModulePaths = function() {
		var paths = original.apply(this, arguments);
		paths.push(path.join(__dirname, '../../node_modules'));
		return paths;
	}	
})();

function coffeeExecuting() {
	var executable = path.basename(process.argv[1]);
	return executable === '_coffee';
}

// install source-map-support to get correct stack traces
require('source-map-support').install({
  handleUncaughtExceptions: false,
  retrieveSourceMap: function retrieveSourceMap(source) {
  	var map = cache.getSourceMap(source);
    return map ? {
        url: null,
        map: map
      } : null;
  },
});

function registerJs(options, ext) {
	// register ._js extension
	require.extensions[ext] = function(module, filename, code) {
		if (!code) code = fs.readFileSync(filename, "utf8");

		var js = cache.getCode(filename, options, function() {
			if (options.ignore && options.ignore(filename)) return {
				code: code,
			};
			var babelOptions = util.babelOptions(options, filename);
			babelOptions.extra.streamline.forceTransform = ext[1] === '_';
			return babel.transform(code, babelOptions);
		});
		module._compile(js, filename);
	}
}

function registerCoffee(options, ext) {
	// Is CoffeeScript being used? Could be through our own _coffee binary,
	// through its coffee binary, or through require('coffee-script').
	// The latter two add a .coffee require extension handler.
	var coffeeRegistered = require.extensions['.coffee'];
	if (!coffeeRegistered && !coffeeExecuting()) return;

	// load coffee
	var coffee = specialRequire("coffee-script");
	if (!coffee.register) throw new Error('cannot register coffee-script: register method not found');

	// ensure that .coffee extension is registered
	// If we're running via _coffee, we should run CoffeeScript ourselves so
	// that it can register its regular .coffee handler. We make sure to do
	// this relative to the caller's working directory instead of from here.
	// (CoffeeScript 1.7+ no longer registers a handler automatically.)
	if (!coffeeRegistered) coffee.register();
	coffeeRegistered = true;

	// register ._coffee extension
	require.extensions[ext] = function(module, filename, code) {
		if (!code) code = fs.readFileSync(filename, "utf8");

		var js = cache.getCode(filename, options, function() {
			var decaf = coffee.compile(code, {
				sourceMap: true,
				generatedFile: filename.replace(/\._coffee$/, '.coffee'),
				sourceFiles: [filename],
			});
			if (options.ignore && options.ignore(filename)) return decaf;
			var babelOptions = util.babelOptions(options, filename);
			babelOptions.extra.streamline.forceTransform = ext[1] === '_';
			babelOptions.inputSourceMap = JSON.parse(decaf.v3SourceMap);
			// use babel's inline option for source maps
			return  babel.transform(decaf.js, babelOptions);
		});
		module._compile(js, filename);
	}
}

exports.register = function(options) {
	if (registered) return;
	registered = true;
	// minimal babel options
	try {
		var babelOptions = util.babelOptions(options);
		require("babel-plugin-streamline");

		// handle CoffeeScript first
		if (options.extensions && options.extensions.indexOf('.coffee') >= 0)
			registerCoffee(options, '.coffee');
		registerCoffee(options, '._coffee');
		if (options.extensions && options.extensions.indexOf('.js') >= 0)
			registerJs(options, '.js');
		registerJs(options, '._js');
	} catch (ex) {
		console.error(ex.stack);
		throw ex;
	}
}

exports.run = function(options) {
	var filename = options.args[0];

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

	//process.execPath = filename;
	// Load the target file and evaluate it as the main module.
	// The input path should have been resolved to a file, so use its extension.
	// If the file doesn't have an extension (e.g. scripts with a shebang),
	// go by what executable this was called as.
	var ext = path.extname(filename);
	if (!/\._?(js|coffee)$/.test(ext)) ext = coffeeExecuting() ? '._coffee' : '._js';
	// Update the process argv and execPath too.
	process.argv = [process.argv[1], filename].concat(options.args.slice(1));
	var code = fs.readFileSync(filename, 'utf8');
	if (ext === '._js') code = util.removeShebang(code);
	require.extensions[ext](mainModule, filename, code);
}