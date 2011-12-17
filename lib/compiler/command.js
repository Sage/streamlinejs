"use strict";

/// !doc
/// 
/// # streamline/lib/compiler/command
///  
/// Streamline commmand line analyzer / dispatcher
/// 
var compile = require('./compile').compile;
var path = require('path');
var flows = require('../util/flows');

function _run() {
	var argv = process.argv;
	var inputs;
	argv.shift();

	if (argv.length <= 1) return require("repl").start("node-streamline> ");

	// for now!
	//return require(path.join(process.cwd(), argv[1]));
	var options = {
		action: "run",
		lines: "mark"
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
		case '--fibers':
			options.fibers = true;
			break;
		default:
			throw new Error("unkown option " + arg + ". Try -h for help");
		}
	}
	switch (options.action) {
	case "run":
		if (argv.length < 1) {
			throw new Error("invalid command line. Try -h for help");
		}
		require('./register').register(options);
		require(path.resolve(process.cwd(), argv[1]));
		break;
	case "compile":
		compile(function(err) {
			err && console.error(err.message + "\n" + err.stack);
		}, inputs, options);
		break;
	case "help":
		console.log("Usage:");
		console.log("  node-streamline module\n");
		console.log("Available options:");
		console.log("  -c, --compile          compile *_.js files and save as *.js files");
		console.log("  --cb                   set callback identifier when compiling. only valid with -c");
		console.log("  -f, --force            force recompilation");
		console.log("  --fibers               target fibers runtime");
		console.log("  -v, --verbose          verbose");
		console.log("  -li, --lines-ignore    ignore line numbers");
		console.log("  -lm, --lines-mark      mark with line numbers");
		console.log("  -lp, --lines-preserve  preserve line numbers");
		console.log("  -h, --help             displays this help message");
		console.log("");
		break;
	}
}

/// * `command.run()`  
///   runs `node-streamline` command line analyzer / dispatcher
exports.run = function() {
	try {
		_run();
	} catch (ex) {
		console.error(ex.message + "\n" + ex.stack);
	}
}

if (process.argv[2] === '--win-js'){
	process.argv.splice(2, 1);
	exports.run();
} else if (process.argv[2] === '--win-coffee') {
	process.argv.splice(2, 1);
	require('coffee-script');
	require('./register').register({});
	if (process.argv.length >= 3 && process.argv[2][0] != '-') {
		// coffee-streamline myScript.coffee args
		// our compile hook is not called if we pass it to coffee-script command line
		process.argv.shift(); // remove the 'node' arg inserted by the shell
		require(path.join(process.cwd(), process.argv[1]));
	}
	else {
		// coffee-script command line with handle REPL and compiler
		global.error = console.log
		require('coffee-script/lib/command').run();
	}
}