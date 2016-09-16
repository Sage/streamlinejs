"use strict";
var fs = require("fs");
var path = require("path");
var util = require('./util');
var path = require("path");
var sourceMaps = require('./sourceMaps');
var transformFileSync = require('./transformSync').transformFileSync;
var Module = require("module");
var registered = false;

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
  	var map = sourceMaps.get(source);
    return map ? {
        url: null,
        map: map
      } : null;
  },
});

// coffee-script clobbers prepareStackTrace, which breaks our source-map-support hook just above
// So we monkey-patch Module.prototype._compile to restore prepareStackTrace after loading coffee-script. 
(function() {
	var _compile = Module.prototype._compile;
	Module.prototype._compile = function(content, filename) {
		var prepareStackTrace = Error.prepareStackTrace;
		_compile.call(this, content, filename);
		// maybe we should be doing this unconditionallly - but for now only coffee-script harms us.
		if (/[\\\/]coffee-script\.js$/.test(filename)) Error.prepareStackTrace = prepareStackTrace;
	}
})();

function requireHook(options, ext) {
	// register ._js extension
	return function(module, filename) {
		var opts = util.extend({}, options);
		opts.filename = filename;
		opts.ext = ext;
		var js = transformFileSync(filename, opts).code;
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
	require.extensions[ext] = requireHook(options, ext);
}

exports.register = function(apiOptions) {
	if (registered) return;
	registered = true;

	// apiOptions have priority over environment opptions (we don't combine them)
	var options = util.getOptions(apiOptions || util.envOptions());

	try {
		var extensions = options.onlyExtensions || ['._js', '._coffee', '.ts'].concat(options.extensions || []);
		// handle CoffeeScript first
		if (extensions.indexOf('.coffee') >= 0)
			registerCoffee(options, '.coffee');
		if (extensions.indexOf('._coffee') >= 0)
			registerCoffee(options, '._coffee');
		if (extensions.indexOf('.js') >= 0)
			require.extensions['.js'] = requireHook(options, '.js');
		// always register ._Js when compile option is true, because streamline needs it for itself.
		if (options.compile || extensions.indexOf('._js') >= 0)
			require.extensions['._js'] = requireHook(options, '._js');
		if (extensions.indexOf('.ts') >= 0)
			require.extensions['.ts'] = requireHook(options, '.ts');

		// get globals to ensure requested runtime will be the default
		require('streamline-runtime/lib/util').getGlobals(options.runtime);
	} catch (ex) {
		console.error(ex.stack);
		throw ex;
	}
}
//util.deprecate(module, 'use babel API instead');