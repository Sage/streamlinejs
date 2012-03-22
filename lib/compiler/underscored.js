var path = require("path");
var fs = require("fs");

// Used for debugging. If this method is not called, it means this module is
// entirely bug free.
function die(message) {
	console.log.apply(console, [ message ]);
	process.exit(1);
}

function run(options) {
	var transformer = options.fibers ? "streamline/lib/fibers/transform"
																	 : "streamline/lib/callbacks/transform";
	var streamline = require(transformer).transform;

	var extension = "." + path.basename(process.argv[0]);
	var filename = process.argv[1];

	process.execPath = require.main.filename;

	// If CoffeeScript is used, we load it and duck.
	if (! require.extensions['.coffee']) {
		require.extensions['.coffee'] = function (module, filename) {
			try {
				require("coffee-script")
			} catch (e) {
				throw new Error("Cannot load CoffeeScript to compile: '" + filename + "'");
			}
			require.extensions['.coffee'](module, filename);
		}
	}

	var streamliners = {
		node: function (module, filename, code) {
			var cachedTransform = require("streamline/lib/compiler/compile").cachedTransformSync;
			streamlined = options.cache ? cachedTransform(code, filename, streamline, options) : streamline(code, options);
			module._compile(streamlined, filename)
		},
		coffee: function (module, filename, code) {
			try {
				coffee = require("coffee-script");
			} catch (e) {
				throw new Error("Cannot load CoffeeScript to compile: '" + filename + "'");
			}
			var code = coffee.compile(fs.readFileSync(filename, "utf8"), { filename: filename });
			streamliners.node(module, filename, code, options); 
		}
	};

	// If Streamlined CoffeeScript is used, load CoffeeScript and register a new
	// handler for the `._coffee` extension.
	require.extensions['._coffee'] = function (module, filename) {
		var code = fs.readFileSync(filename, "utf8");
		streamliners.coffee(module, filename, code);
	}

	// Streamlined JavaScript extension handler.
	require.extensions['._js'] = function (module, filename) {
		var code = fs.readFileSync(filename, "utf8");
		streamliners.node(module, filename, code);
	}

	if (options.registerOnly) return;

	var mainModule = require.main;

	// Clear th emain module cache.
	if (mainModule.moduleCache) {
		mainModule.moduleCache = {};
	}

	// Set the module paths.
	mainModule.paths = require("module")._nodeModulePaths(path.dirname(filename));

	mainModule.filename = filename ? fs.realpathSync(filename) : '.';
	process.argv.splice(1, 1, mainModule.filename)

	// Load the target file and evaluate it.
	fs.readFile(filename, "utf8", function (error, code) {
		var streamlined, javacript, match;
		// Strip the shebang line, while preserving line count.
		if (match = /^#!.*([^\u0000]*)$/.exec(code)) code = match[1];
		// Execute the code.
		streamliners[extension.substring(2)](mainModule, filename, code);
	});
}

module.exports.run = run;
