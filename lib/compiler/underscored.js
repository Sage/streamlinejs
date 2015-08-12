"use strict";
/*@flow*/
/*::import type { StreamlineOptions } from './types';*/

var path = require("path");
var fs = require("fs");
var sourceMap = require('source-map');

var sourceMaps = {};
var coffeeMaps = {};

var registered = false;
function registerErrorHandler() {
	if (registered) return;
	registered = true;
	function mungeStackFrame(frame) {
		if (frame.isNative()) return;
		var fileLocation = '';
		var fileName;
		if (frame.isEval()) {
			fileName = frame.getScriptNameOrSourceURL();
		} else {
			fileName = frame.getFileName();
		}
		fileName = fileName || "<anonymous>";
		var line = frame.getLineNumber();
		var column = frame.getColumnNumber();
		var map = sourceMaps[path.resolve(fileName)];
		// V8 gives 1-indexed column numbers, but source-map expects 0-indexed columns.
		var source = map && map.originalPositionFor({line: line, column: column - 1});
		if (source && source.line) {
			line = source.line;
			column = source.column + 1;
		} else if (map) {
			fileName += " <generated>";
		} else {
			return;
		}
		Object.defineProperties(frame, {
			getFileName: { value: function() { return fileName; } },
			getLineNumber: { value: function() { return line; } },
			getColumnNumber: { value: function() { return column; } }
		});
	}
	/* $FlowIssue - prepareStackTrace missing in core defs */
	var old = Error.prepareStackTrace;
	if (!old) {
		// No existing handler? Use a default-ish one.
		// Copied from http://v8.googlecode.com/svn/branches/bleeding_edge/src/messages.js.
		old = function(err, stack) {
			var buf = [];
			for (var i = 0; i < stack.length; i++) {
				var line;
				try {
					line = "    at " + stack[i].toString();
				} catch (e) {
					try {
						line = "<error: " + e + ">";
					} catch (e) {
						line = "<error>";
					}
				}
				buf.push(line);
			}
			return (err.name || err.message ? err.name + ": " + (err.message || '') + "\n" : "") + //
				buf.join("\n") + "\n";
		};
	}
	/* $FlowIssue - prepareStackTrace missing in core defs */
	Error.prepareStackTrace = function(err, stack) {
		var frames = [];
		for (var i = 0; i < stack.length; i++) {
			var frame = stack[i];
			if (frame.getFunction() === exports.run) break;
			mungeStackFrame(frame);
			frames.push(frame);
		}
		return old(err, stack);
	};
}

function babelLoaded() {
	return require.cache[require.resolve('babel/register')];
}

function run(options /*:StreamlineOptions*/, registerOnly /*::?:boolean*/) {
	var subdir = "callbacks";
	if (options.generators) subdir = options.fast ? "generators-fast" : "generators";
	else if (options.fibers) subdir = options.fast ? "fibers-fast" : "fibers";
	var transformer = "../" + 	subdir + "/transform";
	var transform = require(transformer).transform;
	if (babelLoaded()) {
		transform = function(source, options) {
			try {
			// TODO: combine sourcemaps
			return require(transformer).transform(require('babel').transform(source, {
					blacklist: ["es6.tailCall"], // messes up _
				}).code, options);
			}
			catch (ex) {
				console.error(require('babel').transform(source, options.babel).code.split('\n').map(function(l, i) {
					return i + ":\t" + l;
				}).join('\n'));
				throw ex;
			}
		}
	}

	function streamline(source, options) {
		try {
			return transform(source, options);
		} catch (err) {
			if (options.sourceName && err.message.indexOf(options.sourceName) >= 0) throw err;
			throw new Error("error streamlining " + (options.sourceName || '<unknown>') + ": " + err.stack);
		}
	}

	function clone(obj) {
		return Object.keys(obj).reduce(function(val, key) {
			/* $FlowIssue - 709 */
			val[key] = obj[key];
			return val;
		}, {});
	}

	var streamliners = {
		_js: function(module, filename, code, prevMap) {
			registerErrorHandler();

			if (!code) code = fs.readFileSync(filename, "utf8");

			// If there's a shebang, strip it while preserving line count.
			var match = /^#!.*([^\u0000]*)$/.exec(code);
			if (match) code = match[1];

			var cachedTransform = require("../compiler/compileSync").cachedTransformSync;
			var opts = clone(options);
			opts.sourceName = filename;
			opts.lines = opts.lines || 'sourcemap';
			opts.prevMap = prevMap;
			var streamlined = options.cache ?
				cachedTransform(code, filename, streamline, opts) :
				streamline(code, opts);
			if (streamlined instanceof sourceMap.SourceNode) {
				streamlined = streamlined.toStringWithSourceMap({
					file: filename
				});
				var map = streamlined.map;
				if (prevMap) {
					map.applySourceMap(prevMap, filename);
				}
				sourceMaps[path.resolve(filename)] = new sourceMap.SourceMapConsumer(map.toString());
				module._compile(streamlined.code, filename);
			} else {
				module._compile(streamlined, filename);
			}
		},
		_coffee: function(module, filename, code) {
			registerErrorHandler();

			if (!code) code = fs.readFileSync(filename, "utf8");

			// Test for cached version so that we shortcircuit CS re-compilation, not just streamline pass
			var cachedTransform = require("../compiler/compileSync").cachedTransformSync;
			var opts = clone(options);
			opts.sourceName = filename;
			opts.lines = opts.lines || 'sourcemap';
			var cached = cachedTransform(code, filename, streamline, opts, true);
			if (cached) return module._compile(cached, filename);

			// Compile the source CoffeeScript to regular JS. We make sure to
			// use the module's local instance of CoffeeScript if possible.
			var coffee = require("../util/require")("coffee-script", module.filename);
			var ground = coffee.compile(code, {
				filename: filename,
				sourceFiles: [module.filename],
				sourceMap: 1
			});
			if (ground.v3SourceMap) {
				var coffeeMap = new sourceMap.SourceMapConsumer(ground.v3SourceMap);
				coffeeMaps[filename] = coffeeMap;
				ground = ground.js;
			}

			// Then transform it like regular JS.
			streamliners._js(module, filename, ground, coffeeMap);
		}
	};

	// Is CoffeeScript being used? Could be through our own _coffee binary,
	// through its coffee binary, or through require('coffee-script').
	// The latter two add a .coffee require extension handler.
	var executable = path.basename(process.argv[0]);
	var coffeeRegistered = require.extensions['.coffee'];
	var coffeeExecuting = executable === '_coffee';
	var coffeePresent = coffeeRegistered || coffeeExecuting;

	// Register require() extension handlers for ._js and ._coffee, but only
	// register ._coffee if CoffeeScript is being used.
	require.extensions['._js'] = streamliners._js;
	if (coffeePresent) require.extensions['._coffee'] = streamliners._coffee;

	// If we were asked to register extension handlers only, we're done.
	if (registerOnly) return;

	// Otherwise, we're being asked to execute (run) a file too.
	var filename = process.argv[1];

	// If we're running via _coffee, we should run CoffeeScript ourselves so
	// that it can register its regular .coffee handler. We make sure to do
	// this relative to the caller's working directory instead of from here.
	// (CoffeeScript 1.7+ no longer registers a handler automatically.)
	if (coffeeExecuting && !coffeeRegistered) {
		var coffee = require("../util/require")("coffee-script");
		if (typeof coffee.register === 'function') {
			coffee.register();
		}
	}

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
	/* $FlowIssue - module "module" not supported */
	mainModule.paths = require("module")._nodeModulePaths(path.dirname(filename));

	// if node is installed with NVM, NODE_PATH is not defined so we add it to our paths
	if (!process.env.NODE_PATH) mainModule.paths.push(path.join(__dirname, '../../..'));

	// And update the process argv and execPath too.
	process.argv.splice(1, 1, filename);
	//process.execPath = filename;

	// Load the target file and evaluate it as the main module.
	// The input path should have been resolved to a file, so use its extension.
	// If the file doesn't have an extension (e.g. scripts with a shebang),
	// go by what executable this was called as.
	var ext = path.extname(filename) || (coffeeExecuting ? '._coffee' : '._js');
	require.extensions[ext](mainModule, filename);
}

module.exports.run = run;
