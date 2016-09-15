"use strict";
// call preload hooks at the very beginning as they may help require other modules (including commander!)
// register will call them again but it shouldn't hurt because require caches.
(function() {
	var i = process.argv.indexOf('--preload') + 1;
	if (i > 0 && process.argv[i]) process.argv[i].split(',').forEach(function(m) {
		require(m);
	});
})();

// handles _node and _coffee command line options
var fs = require('fs');
var fsp = require('path');
var util = require('./util');
var register = require('./register');
var Module = require('module');

function parseOptions(argv) {
	var program = require('commander');

	var prog = program.version(require('../package').version, '-v, --version')
		.usage('[options] [script] [arguments]')
		.option('-c, --compile', "compile [script] files and save as *.js files")
		.option('-d, --out-dir <dir>', "save compiled .js files in the given directory")
		.option('--no-cache', "turns caching off", true)
		.option('--cache-dir <dir>', "sets the cache directory")
		.option('-f, --force', "force transformation (even if found in cache)")
		.option('--runtime <name>', "target runtime")
		.option('-s, --source-maps <true|false|inline|both>', "(see babel)", /^(true|false|inline|both)$/)
		.option('--source-map-target <file>', "output file for source map")
		.option('--only-extensions <exts>', "list of extensions to process (comma-separated)")
		.option('-q, --quiet', "don't log")
		.option('--preload <modules>', "hook to preload a specified list of modules (comma-separated)");

	// Arguments that follow the script or filename should not be intercepted by commander but passed
	// verbatim to the script (https://github.com/Sage/streamlinejs/issues/297)
	// There may be a clever way to do this with commander but the following hack should do for now
	// I'm handling compat in the same loop to cut correctly if script accepts obsolete streamline options (-o for ex).
	// commander skips 2 first args, not just first one.
	var args = argv.slice(0, 2);
	var cut = 2;
	while (cut < argv.length) {
		var arg = argv[cut];
		if (arg[0] !== '-') break;
		cut++;
		var opt = prog.options.filter(function(o) {
			return o.short === arg || o.long === arg;
		})[0];
		if (opt) {
			args.push(arg);
			if (opt.flags.indexOf('<') >= 0 && cut < argv.length) {
				args.push(argv[cut++]);
			}
		} else {
			// handle compat options
			if (arg === '--cache') {
				// ignore silently - cache is now on by default.
			} else if (/^(-l(m|i|p)|--(lines-(mark|ignore|preserve)|standalone|fast|old-style-future|promise|cb|aggressive))$/.test(arg)) {
				util.warn('obsolete option ignored: ' + arg);
				return;
			} else if (arg === '--map') {
				util.warn('obsolete option: --map, use -s or --source-maps instead');
				args.push('--source-maps');
				args.push('true');
				return;
			} else if (arg === '--source-map') {
				util.warn('obsolete option: --source-map, use --source-map-target instead');
				args.push('--source-map-target');
			} else if (/^--(fibers|generators)$/.test(arg)) {
				util.warn('obsolete option: ' + arg + ', use --runtime ' + arg.substring(2) + ' instead');
				args.push('--runtime');
				args.push(arg.substring(2));
			} else if (/^(-o|--output-dir)$/.test(arg)) {
				util.warn('obsolete option: ' + arg + ', use -d or --out-dir instead');
				args.push('-d');
				if (cut < argv.length) args.push(argv[cut++]);
			} else if (arg === '-v') {
				util.warn('obsolete option: -v, verbose is on by default, use -q to turn it off');
			} else {
				// push invalid option - commander will deal with it
				args.push(arg);
			}
		}
	}
		
	var options = prog.parse(args);
	options.args = options.args.concat(argv.slice(cut));

	options = Object.keys(options).filter(function(opt) {
		return !/^([A-Z]|_)/.test(opt);
	}).reduce(function(opts, key) {
		opts[key] = options[key];
		return opts;
	}, {});
	if (options.onlyExtensions) options.onlyExtensions = options.onlyExtensions.split(',');
	return util.getOptions(util.extend(util.envOptions(), options));
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
	filename = fsp.resolve(filename || '.');
	mainModule.filename = filename = Module._resolveFilename(filename);
	var localPaths = Module._nodeModulePaths(fsp.join(process.cwd(), 'node_modules'));
	var globalPaths = Module._nodeModulePaths(fsp.join(__dirname, '../node_modules'));
	mainModule.paths = localPaths.slice(0, localPaths.length - 1).concat(globalPaths);

	//process.execPath = filename;
	// Load the target file and evaluate it as the main module.
	// The input path should have been resolved to a file, so use its extension.
	// If the file doesn't have an extension (e.g. scripts with a shebang),
	// go by what executable this was called as.
	var ext = fsp.extname(filename);
	if (!/(\._?(js|coffee)|ts)$/.test(ext)) ext = /^_coffee/.test(fsp.basename(process.argv[1])) ? '._coffee' : '._js';
	// Update the process argv and execPath too.
	process.argv = [process.argv[1], filename].concat(options.args.slice(1));
	if (!require.extensions[ext]) throw new Error("unsupported extension: " + ext);
	require.extensions[ext](mainModule, filename);
}

exports.run = function() {
	// require cluster here so that it gets process.argv before we shift it.
	if (require('cluster').setupMaster) require('cluster').setupMaster();
	var argv = process.argv;

	var prog = /\w*$/.exec(argv[1])[0];

	var options = parseOptions(argv);
	register.register(options);
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