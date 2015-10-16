"use strict";
var version = require('../package').version;
var util = exports;

exports.idem = function(x) {
	return x;
}

var colors;
try {
	colors = require(util.idem("colors/safe"));
} catch (ex) {}
if (!colors) colors = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray']//
	.reduce(function(r, c) {
	r[c] = util.idem;
	return r;
}, {});

exports.log = function(message) {
	console.log(colors.gray("[STREAMLINE] " + message));
};
exports.warn = function(message) {
	console.warn(colors.yellow("[STREAMLINE] " + message));
};
exports.error = function(message) {
	console.error(colors.magenta("[STREAMLINE] " + message));
};

exports.extend = function(dst, src) {
	dst = dst || {};
	Array.prototype.slice.call(arguments, 1).forEach(function(src) {
		src && Object.keys(src).forEach(function(k) {
			dst[k] = src[k];
		});
	});
	return dst;
};

function defaultRuntime() {
	var _defRT;
	return _defRT || (_defRT = (function() {
		try {
			require(util.idem('fibers'));
			return 'fibers';
		} catch (ex) {}
		try {
			eval("(function*(){})");
			return 'generators';
		} catch (ex) {}
		return "callbacks";		
	})());
}

// straighten options and warns about obsolete ones
exports.getOptions = function(options, filename) {
		var opts = {
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
			} else if (/^(compile|outDir|cache|cacheDir|force|runtime|sourceMaps|sourceMapTarget|quiet|preload|ignore)$/.test(opt) || //
			/^(args|babel|ext|extensions|sourceRoot)$/.test(opt)) {
				// valid option
				opts[opt] = options[opt];
			} else if (/^(program|options|rawArgs|args|commands|filename)$/.test(opt)) {
				// discard silently
			} else {
				if (!opts.quiet) util.warn('invalid option: ' + opt);
			}
		});
		opts.runtime = opts.runtime || defaultRuntime();
		opts.filename = filename;
		return opts;
	};

exports.babelOptions = function(options, filename) {
	options.babel = options.babel || {};
	var babelOpts = {
		plugins: [],
	};
	Object.keys(options.babel).forEach(function(opt) {
		if (options.babel[opt] != null) babelOpts[opt] = options.babel[opt];
	});
	if (babelOpts.plugins.indexOf('streamline') < 0) babelOpts.plugins.push('streamline');
	// see https://github.com/babel/babel/issues/1833
	babelOpts.extra = {
		streamline: {
			runtime: options.runtime,
			quiet: options.quiet,
			forceTransform: !/\.(coffee|js)$/.test(options.ext || filename || ''),
		},
	};
	if (options.runtime !== 'callbacks') {
		babelOpts.blacklist = babelOpts.blacklist || [];
		if (babelOpts.blacklist.indexOf('regenerator') < 0) babelOpts.blacklist.push('regenerator');
	}
	// always return source maps - cache needs them
	babelOpts.sourceMaps = true;
	if (filename) {
		babelOpts.filename = filename;
		babelOpts.sourceFileName = filename;
	}
	return babelOpts;
};

exports.canCompile = function(path) {
	return /\._(js|coffee)$/.test(path);
};

exports.removeShebang = function(code) {
	// replace #! by // - preserves offsets in file
	return (code[0] === '#' && code[1] === '!') ? '//' + code.substring(2) : code;
}

exports.deprecate = function(module, message, redirected) {
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