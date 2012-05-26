"use strict";
var path = require("path");
var fs = require("fs");

// Used for debugging. If this method is not called, it means this module is
// entirely bug free.

function die(message) {
	console.log.apply(console, [message]);
	process.exit(1);
}

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
			var cachedTransform = require("streamline/lib/compiler/compile").cachedTransformSync;
			var streamlined = options.cache ? cachedTransform(code, filename, streamline, options) : streamline(code, options);
			module._compile(streamlined, filename)
		},
		_coffee: function(module, filename, code) {
			code = grind(code, filename);
			streamliners._js(module, filename, code, options);
		}
	};

	// If Streamlined CoffeeScript is used, load CoffeeScript and register a new
	// handler for the `._coffee` extension.
	require.extensions['._coffee'] = function(module, filename) {
		var code = fs.readFileSync(filename, "utf8");
		streamliners._coffee(module, filename, code);
	}

	// Streamlined JavaScript extension handler.
	require.extensions['._js'] = function(module, filename) {
		var code = fs.readFileSync(filename, "utf8");
		// If there's a shebang, strip it while preserving line count:
		var match = /^#!.*([^\u0000]*)$/.exec(code);
		if (match) code = match[1];
		streamliners._js(module, filename, code);
	}

	// If we were asked to register extension handlers only, we're done:
	if (options.registerOnly) return;

	// Otherwise, we're being asked to execute (run) a file too:
	var extension = path.basename(process.argv[0]) === '_coffee' ? '._coffee' : '._js';
	var filename = process.argv[1];

	process.execPath = require.main.filename;

	var mainModule = require.main;

	// Clear the main module cache.
	if (mainModule.moduleCache) {
		mainModule.moduleCache = {};
	}

	// Set the module paths.
	mainModule.paths = require("module")._nodeModulePaths(path.dirname(filename));

	function locateFile() {
		if (path.existsSync(filename + extension)) filename += extension;
		else if (path.existsSync(filename + extension.replace('_', ''))) filename += (extension = extension.replace('_', ''));
		else throw new Error("file not found: " + filename);
	}
	// Handle the case where filename is just the module name, add extensions
	if (!path.existsSync(filename)) {
		locateFile();
	} else if (fs.statSync(filename).isDirectory()) {
		var pkg, pkgname = path.join(filename, "package.json");
		if (path.existsSync(pkgname)) {
			pkg = JSON.parse(fs.readFileSync(pkgname, "utf8"));
			if (pkg.main) {
				filename = path.join(filename, pkg.main);
				if (!path.existsSync(filename)) {
					locateFile();
				}
			}
		}
		if (!pkg || !pkg.main) {
			filename = path.join(filename, "index");
			locateFile();
		}
	}

	mainModule.filename = filename ? fs.realpathSync(filename) : '.';
	process.argv.splice(1, 1, mainModule.filename)

	// Load the target file and evaluate it.
	fs.readFile(filename, "utf8", function(error, code) {
		streamliners[extension.substring(1)](mainModule, mainModule.filename, code);
	});
}

module.exports.run = run;