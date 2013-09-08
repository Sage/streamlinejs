"use strict";

var path = require('path');

exports.run = function() {
	var argv = process.argv;
	var inputs;
	argv.shift();

	if (argv.length <= 1) return require("repl").start("_node> ");

	// for now!
	//return require(path.join(process.cwd(), argv[1]));
	var options = {
		action: "run",
		lines: "preserve"
	};
	while (argv[1] && argv[1][0] == '-') {
		var arg = argv.splice(1, 1)[0];
		switch (arg) {
		case '-c':
		case '--compile':
			options.action = "compile";
			inputs = argv.splice(1, argv.length - 1);
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
		case '--source-map':
			options.sourceMap = argv.splice(1, 1)[0];
			break;
		case '--cache-dir':
			options.cacheDir = argv.splice(1, 1)[0];
			options.cache = true;
			break;
		default:
			throw new Error("unknown option " + arg + ". Try -h for help");
		}
	}
	switch (options.action) {
	case "run":
		if (argv.length < 1) {
			throw new Error("invalid command line. Try -h for help");
		}
		if (/-streamline$/.test(argv[0])) {
			require('./register').register(options);
			require(path.resolve(process.cwd(), argv[1]));
		} else {
			require('./underscored').run(options);
		}
		break;
	case "compile":
		require('streamline/lib/callbacks/compile').compile(function(err) {
			err && console.error(err.message + "\n" + err.stack);
		}, inputs, options);
		break;
	case "help":
		console.log("Usage:");
		console.log("  node-streamline module\n");
		console.log("Available options:");
		console.log("  -c, --compile          compile *_.js files and save as *.js files");
		console.log("  --cache                caches the transformed files (faster startup)");
		console.log("  --cb                   set callback identifier when compiling. only valid with -c");
		console.log("  -f, --force            force recompilation");
		console.log("  --fibers               target fibers runtime");
		console.log("  --generators           target generators runtime");
		console.log("  --source-map <file>    generate a source map");
		console.log("  --cache-dir <dir>      cache directory (implies --cache)");
		console.log("  -v, --verbose          verbose");
		console.log("  -li, --lines-ignore    ignore line numbers");
		console.log("  -lm, --lines-mark      mark with line numbers");
		console.log("  -lp, --lines-preserve  preserve line numbers");
		console.log("  --version              displays the streamline version");
		console.log("  -h, --help             displays this help message");
		console.log("");
		break;
	case "version":
		console.log("streamline v" + require("../version.js").version);
		break;
	}
}
