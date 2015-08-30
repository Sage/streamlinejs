"use strict";

/*@flow*/
/*::import type { StreamlineOptions } from './types';*/
var path = require('path');

exports.getOptions = function(argv /*:string[]*/) /*:StreamlineOptions*/ {
	var options /*:StreamlineOptions*/ = {
		action: "run",
		lines: "preserve"
	};
	while (argv[1] && argv[1][0] === '-') {
		var arg = argv.splice(1, 1)[0];
		switch (arg) {
		case '-c':
		case '--compile':
			options.action = "compile";
			options.inputs = argv.splice(1, argv.length - 1);
			break;
		case '--cb':
			options.callback = argv.splice(1, 1)[0];
			break;
		case '--cache':
			options.cache = true;
			break;
		case '-f':
		case '--force':
			options.force = true;
			break;
		case '-v':
		case '--verbose':
			options.verbose = true;
			break;
		case '-lm':
		case '--lines-mark':
			options.lines = "mark";
			break;
		case '-li':
		case '--lines-ignore':
			options.lines = "ignore";
			break;
		case '-lp':
		case '--lines-preserve':
			options.lines = "preserve";
			break;
		case '-h':
		case '--help':
			options.action = "help";
			break;
		case '--version':
			options.action = "version";
			break;
		case '--fibers':
			options.fibers = true;
			break;
		case '--generators':
			options.generators = true;
			break;
		case '--fast':
			options.fast = true;
			break;
		case '--aggressive':
			options.aggressive = true;
			break;
		case '--source-map':
			options.sourceMap = true;
			options.sourceMapFile = argv.splice(1, 1)[0];
			break;
		case '-m':
		case '--map':
			options.sourceMap = true;
			options.lines = "sourcemap";
			break;
		case '-o':
		case '--output-dir':
			options.outputDir = argv.splice(1, 1)[0];
			break;
		case '--cache-dir':
			options.cacheDir = argv.splice(1, 1)[0];
			options.cache = true;
			break;
		case '--old-style-futures':
			options.oldStyleFutures = true;
			break;
		case '--promise':
			options.promise = true;
			break;
		case '--standalone':
			options.standalone = true;
			break;
		case '--internal': // undocumented - for internal build.sh script
			options.internal = true;
			break;
		default:
			throw new Error("unknown option " + arg + ". Try -h for help");
		}
	}
	return options;
};

exports.run = function() {
	// require cluster here so that it gets process.argv before we shift it.
	if (require('cluster').setupMaster) require('cluster').setupMaster();
	var argv = process.argv;
	argv.shift();

	var prog = /\w*$/.exec(argv[0])[0];

	var options = exports.getOptions(argv);

	switch (options.action) {
	case "run":
		if (argv.length < 2) {
			try {
				var coffee = require("../util/require")("coffee-script");
				if (typeof coffee.register === 'function') { coffee.register(); }
			} catch (err) {}
			require('./register').register(options);
			return require("./repl").run(prog, options);
		}
		if (/-streamline$/.test(argv[0])) {
			require('./register').register(options);
			require(path.resolve(process.cwd(), argv[1]));
		} else {
			require('./register').register(options, /*runAlso:*/ true);
		}
		break;
	case "compile":
		require('../callbacks/compile').compile(function(err) {
			if (err) {
				console.error(err.message + "\n" + err.stack);
				/* eslint-disable no-process-exit */
				process.exit(1);
			}
		}, options.inputs, options);
		break;
	case "help":
		console.log("Usage:");
		console.log("  " + prog + " module\n");
		console.log("Available options:");
		console.log("  -c, --compile          compile *_.js files and save as *.js files");
		console.log("  --cache                caches the transformed files (faster startup)");
		console.log("  --cb                   set callback identifier when compiling. only valid with -c");
		console.log("  -f, --force            force recompilation");
		console.log("  --fibers               target fibers runtime");
		console.log("  --generators           target generators runtime");
		//console.log("  --source-map <file>    generate a source map");
		console.log("  -m, --map              generate a source map with a .map extension for every compiled file");
		console.log("  -o, --output-dir <dir> save compiled .js files in the given directory");
		console.log("  --cache-dir <dir>      cache directory (implies --cache)");
		console.log("  -v, --verbose          verbose");
		console.log("  -li, --lines-ignore    ignore line numbers");
		console.log("  -lm, --lines-mark      mark with line numbers");
		console.log("  -lp, --lines-preserve  preserve line numbers");
		console.log("  --promise              enables promise support");
		console.log("  --old-style-futures    compatibility with original futures syntax");
		console.log("  --standalone           generate standalone modules which include the streamline runtime");
		console.log("  --nodejs  --xyz        passes --xyz option to node. Useful to pass --debug or --harmony");
		console.log("  --version              displays the streamline version");
		console.log("  -h, --help             displays this help message");
		console.log("");
		break;
	case "version":
		console.log("streamline v" + require("../version.js").version);
		break;
	}
};
