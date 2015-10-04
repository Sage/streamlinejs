"use strict";

/// !doc
var fs = require("fs");
var path = require("path");
var util = require('./util');
var path = require("path");
var cache = require('./cacheSync');
var babel = require('babel');
var Module = require("module");
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

/// 
/// # Streamline registration API
///  
/// * `require('streamline').register(options)`  
///   registers streamline's require hooks.
exports.register = function(apiOptions) {
	if (registered) return;
	registered = true;

	// load legacy options
	var options = [loadOptions(), apiOptions || {}].reduce(function(allOpts, opts) {
		for (var opt in opts || {}) {
			allOpts[opt] = opts[opt];
		}
		return allOpts;
	}, {});
	options = util.getOptions(options);

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
//util.deprecate(module, 'use babel API instead');