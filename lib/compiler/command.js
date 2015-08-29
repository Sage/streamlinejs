"use strict";

var path = require('path');
var util = require('./util');

exports.getOptions = function(argv) {
	var program = require('commander');
	var options = program.version(require('../../package').version, '-v, --version')
		.usage('[options] [script] [arguments]')
		.option('-c, --compile', "compile [script] files and save as *.js files")
		.option('--cache', "caches the transformed files (faster startup)")
		.option('--cache-dir <dir>', "sets the cache directory (implies --cache)")
		.option('-f --force', "force recompilation")
		.option('--runtime <name>', "target runtime", /(await|fibers|galaxy)/)
		.option('--aggressive', "enable aggressive optimization")
		.option('-m --map', "generate source maps")
		.option('--source-map <file>', "output file for source map")
		.option('-o --output-dir <dir>', "save compiled .js files in the given directory")
		.option('-v --verbose', "enable verbose output")
		.option('--standalone', "generate standalone modules which include the streamline runtime")
		.option('--nodejs <opt>', "passes opt to node.js. Useful to pass --debug or --harmony")
		.option('--fibers', "(deprecated) target fibers runtime")
		.option('--generators', "(deprecated) target generators runtime")
		.option('--fast', "(obsolete)")
		.option('--cb <ident>', "(obsolete)")
		.option('-lm --lines-mark', "(obsolete)")
		.option('-li --lines-ignore', "(obsolete)")
		.option('-lp --lines-preserve', "(obsolete)")
		.option('--old-style-futures', "(obsolete)")
		.option('--promise', "(obsolete)")
		.parse(argv); // commander skips 2 first args, not just first one.

	options = util.getOptions(options);
	return options;
};

exports.run = function() {
	// require cluster here so that it gets process.argv before we shift it.
	if (require('cluster').setupMaster) require('cluster').setupMaster();
	var argv = process.argv;

	var prog = /\w*$/.exec(argv[1])[0];

	var options = exports.getOptions(argv);

	if (options.compile) {
		require('./register').register(options);
		require('./compile').compile(function(err) {
			if (err) {
				console.error(err.message + "\n" + err.stack); /* eslint-disable no-process-exit */
				process.exit(1);
			}
		}, options.args, options);		
	} else {
		if (options.args.length === 0) {
			require('./register').register(options);
			return require("./repl").run(prog, options);
		}
		require('./register').register(options, true);		
	}
};