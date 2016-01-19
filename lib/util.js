"use strict";
/* @flow */
var pluginVersion = require('babel-plugin-streamline/package').version;
var fs = require('fs');
var fsp = require("path");

var util = exports;

exports.idem = function/*:: <T> */(x/*: T*/) /* : T*/ {
	return x;
}

var colors;
try {
	var req = require;
	colors = req("colors/safe");
} catch (ex) {
	colors = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray'] //
	.reduce(function(r, c) {
		r[c] = util.idem;
		return r;
	}, {});
}

exports.log = function(message /*: string*/) {
	console.log(colors.gray("[STREAMLINE] " + message));
};
exports.warn = function(message /*: string*/) {
	console.warn(colors.yellow("[STREAMLINE] " + message));
};
exports.error = function(message /*: string*/) {
	console.error(colors.magenta("[STREAMLINE] " + message));
};

exports.extend = function(dst /*: any*/, src /*: any*/) /*: any*/ {
	dst = dst || {};
	Array.prototype.slice.call(arguments, 1).forEach(function(src) {
		src && Object.keys(src).forEach(function(k) {
			dst[k] = src[k];
		});
	});
	return dst;
};

function homeDir() {
	if (process.env.HOME) return process.env.HOME;
	if (process.env.HOMEDRIVE && process.env.HOMEPATH) return process.env.HOMEDRIVE + process.env.HOMEPATH;
	return null;
}

// Loads the first `.streamline.json` options file found (searching in priority
// order), or an empty object if no such file found.

exports.envOptions = function() /*: StreamlineApiOptions*/ {
	var dirs = ['.'];
	if (require.main) { // REPL doesn't have a require.main
		dirs.push(fsp.dirname(require.main.filename));
	}
	var home = homeDir();
	if (home) dirs.push(home);
	for (var i = 0; i < dirs.length; i++) {
		var dir = dirs[i];
		if (dir && fs.existsSync(fsp.join(dir, '.streamline.json'))) {
			return JSON.parse(fs.readFileSync(fsp.join(dir, '.streamline.json'), 'utf8'));
		}
	}
	return {};
}

// straighten options and warns about obsolete ones
exports.getOptions = function(options /*: StreamlineApiOptions*/) /*: StreamlineOptions*/ {
	var opts /*: StreamlineOptions*/ = {
		runtime: require('streamline-runtime').runtime,
		cache: true,
		quiet: false,
	};
	Object.keys(options || {}).forEach(function(opt) {
		if (/^(fibers|generators)$/.test(opt)) {
			if (!opts.quiet) util.warn('obsolete option: ' + opt + ', use runtime instead');
			opts.runtime = opt;
		} else if (/^(sourceMap|map)$/.test(opt)) {
			if (!opts.quiet) util.warn('obsolete option: ' + opt + ', use sourceMaps instead');
			opts.sourceMaps = !! options.sourceMap;
		} else if (opt === 'sourceMapFile') {
			if (!opts.quiet) util.warn('obsolete option: sourceMapFile, use sourceMapTarget instead');
			opts.sourceMapTarget = options.sourceMapFile;
		} else if (opt === 'outputDir') {
			if (!opts.quiet) util.warn('obsolete option: outputDir, use outDir instead');
			opts.outDir = options.outputDir;
		} else if (opt === 'verbose') {
			opts.quiet = !options.verbose;
			if (!opts.quiet) util.warn('obsolete option: verbose, use quiet instead');
		} else if (/^(lines|standalone|fast|old-style-future|promise|cb|aggressive)$/.test(opt)) {
			if (!opts.quiet) util.warn('ignoring obsolete option: ' + opt);
		} else if (/^(compile|outDir|cache|cacheDir|cacheKeep|force|runtime|sourceMaps|sourceMapTarget|flow|quiet|preload|ignore)$/.test(opt) || //
		/^(args|babel|ext|extensions|sourceRoot)$/.test(opt)) {
			// valid option
			opts[opt] = options[opt];
		} else if (/^(program|options|rawArgs|args|commands|filename)$/.test(opt)) {
			// discard silently
		} else {
			if (!opts.quiet) util.warn('invalid option: ' + opt);
		}
	});
	return opts;
};

function tryRequire(prefix, name) {
	try {
		return require(prefix + name);				
	} catch (ex) {
		return require(name);
	}
}

exports.babelOptions = function(options /*: StreamlineOptions*/, filename /*: string*/) /*: BabelOptions*/ {
	var babelIn = options.babel || {};

	function resolvePlugin(plugin) {
		if (typeof plugin === 'string') {
			// intercept streamline plugin to add options.
			if (/^(babel-plugin-)?streamline$/.test(plugin)) {
				return [require('babel-plugin-streamline'), {
					runtime: options.runtime,
					quiet: options.quiet,
					forceTransform: !/\.(coffee|js)$/.test(options.ext || filename || ''),
				}];
			} else {
				return tryRequire('babel-plugin-', plugin);
			}
		} else if (Array.isArray(plugin)) {
			// [plugin, options]
			plugin[0] = resolvePlugin(plugin[0]);
			// generators transform is enabled by default in es2015 preset
			// disable it if streamline `generators` option is on
			if (plugin[1] && plugin[1].asyncGenerators === false && options.runtime === 'generators') {
				plugin[1].generators = false;
			}
			return plugin;
		} else {
			return plugin;
		}
	}

	function resolvePreset(preset) {
		if (typeof preset === 'string') {
			preset = tryRequire('babel-preset-', preset);
		}
		if (preset && preset.plugins) {
			preset.plugins = preset.plugins.map(resolvePlugin);
			return preset;
		} else {
			throw new Error('invalid preset: ' + preset);
		}
	}

	// enable es2015 preset and streamline plugin by default - can be overridden by options.
	var babelOpts /*: BabelOptions*/ = {
		plugins: ['flow-comments', 'streamline'],
		presets: ['es2015'],
		sourceMaps: true,
	};
	Object.keys(babelIn).forEach(function(opt) {
		if (babelIn[opt] != null) babelOpts[opt] = babelIn[opt];
	});
	// resolve plugins and presets locally (we need this for globally installed streamline)
	babelOpts.plugins = babelOpts.plugins.map(resolvePlugin);
	babelOpts.presets = babelOpts.presets.map(resolvePreset);

	// always return source maps - cache needs them
	// special options like inline and both are handled post-transform, in compile logic
	babelOpts.sourceMaps = true;
	if (filename) {
		babelOpts.filename = filename;
		babelOpts.sourceFileName = filename;
	}
	return babelOpts;
};

exports.canCompile = function(path /*: string*/) /*: boolean*/ {
	return /\._(js|coffee)$/.test(path);
};

exports.removeShebang = function(code /*: string*/) /*: string*/ {
	// replace #! by // - preserves offsets in file
	return (code[0] === '#' && code[1] === '!') ? '//' + code.substring(2) : code;
}

function cacheRoot(options) {
	if (options.cacheDir) return options.cacheDir;
	var home = homeDir();
	if (!home) throw new Error("HOME not found, unable to store Streamline callback cache");
	return fsp.join(home, ".streamline");
}

function delCache(path) {
	fs.readdirSync(path).forEach(function(name) {
		var p = fsp.join(path, name);
		if (fs.statSync(p).isDirectory()) delCache(p);
		else fs.unlinkSync(p);
	});
	fs.rmdirSync(path);
}

// cache subdir changes every time plugin version changes so we need to cleanup old plugin caches
var cleanedUp = false;

function cleanup(dir, max) {
	// do it only once
	if (cleanedUp) return dir;
	cleanedUp = true;
	if (!fs.existsSync(dir)) return dir;
	var paths = fs.readdirSync(dir).map(function(name) {
		return fsp.join(dir, name);
	});
	if (paths.length <= max) return dir;
	paths = paths.sort(function(p1, p2) {
		return fs.statSync(p2).mtime - fs.statSync(p1).mtime;
	});
	paths.slice(max).forEach(delCache);
	return dir;
}

function fastHash(str) {
	var hash = 0;
	for (var i = 0, len = str.length; i < len; i++) hash = (((hash << 5) - hash) + str.charCodeAt(i) | 0);
	return hash + 0x7fffffff; // make it positive
}

exports.cacheDir = function(options /*: StreamlineOptions*/) /*: string*/ {
	var subdir = 'v' + pluginVersion + '-' + options.runtime + '-' + fastHash(JSON.stringify({
		// options that influence code generation should be listed below.
		version: pluginVersion,
		runtime: options.runtime,
	}));
	return fsp.join(cleanup(cacheRoot(options), options.cacheKeep || 6), subdir)
}

exports.deprecate = function(module /*: any*/, message /*: string*/, redirected /*: boolean*/) {
	util.warn("Module " + module.id + " is deprecated: " + message);
	if (!redirected) Object.keys(module.exports).forEach(function(name) {
		var fn = module.exports[name];
		if (typeof fn === 'function') {
			module.exports[name] = function() {
				if (!module.exports[name].warned) util.warn("Module " + module.id + ": calling deprecated function: " + name);
				module.exports[name].warned = true;
				return fn.apply(this, arguments);
			};
		}
	})
};