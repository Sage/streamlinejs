"use strict";
// handles _node and _coffee command line options
var fs = require('fs');
var path = require('path');
var util = require('./util');

exports.getOptions = function(argv) {
	var program = require('commander');
	var options = program.version(require('../../package').version, '-v, --version')
		.usage('[options] [script] [arguments]')
		.option('-c, --compile', "compile [script] files and save as *.js files")
		.option('--cache', "caches the transformed files (faster startup)")
		.option('--cache-dir <dir>', "sets the cache directory (implies --cache)")
		.option('-f, --force', "force recompilation")
		.option('--runtime <name>', "target runtime", /(await|fibers|generators|callbacks)/)
		.option('--aggressive', "enable aggressive optimization")
		.option('-m, --map', "generate source maps")
		.option('--source-map <file>', "output file for source map")
		.option('-o, --output-dir <dir>', "save compiled .js files in the given directory")
		.option('-v, --verbose', "enable verbose output")
		.option('--fibers', "(deprecated - use --runtime fibers)")
		.option('--generators', "(deprecated - use --runtime generators)")
		.option('--standalone', "(obsolete - use browserify instead)")
		.option('--fast', "(obsolete)")
		.option('--cb <ident>', "(obsolete)")
		.option('-lm, --lines-mark', "(obsolete)")
		.option('-li, --lines-ignore', "(obsolete)")
		.option('-lp, --lines-preserve', "(obsolete)")
		.option('--old-style-futures', "(obsolete)")
		.option('--promise', "(obsolete)")
		.parse(argv); // commander skips 2 first args, not just first one.

	return util.getOptions(options);
};

function runScript(options) {
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
	if (!/\._?(js|coffee)$/.test(ext)) ext = /^_coffee/.test(path.basename(process.argv[1])) ? '._coffee' : '._js';
	// Update the process argv and execPath too.
	process.argv = [process.argv[1], filename].concat(options.args.slice(1));
	var code = fs.readFileSync(filename, 'utf8');
	if (ext === '._js') code = util.removeShebang(code);
	require.extensions[ext](mainModule, filename, code);
}

exports.run = function() {
	// require cluster here so that it gets process.argv before we shift it.
	if (require('cluster').setupMaster) require('cluster').setupMaster();
	var argv = process.argv;

	var prog = /\w*$/.exec(argv[1])[0];

	var options = exports.getOptions(argv);
	require('./register').register(options);
	if (options.compile) {
		require('./compile').compile(function(err) {
			if (err) {
				console.error(err.message + "\n" + err.stack); /* eslint-disable no-process-exit */
				process.exit(1);
			}
		}, options.args, options);		
	} else if (options.args.length === 0) {
		require("./repl").run(prog, options);
	} else {
		runScript(options);		
	}
};