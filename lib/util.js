"use strict";
var version = require('./version').version;
var util = exports;

function idem(x) { return x; }
var colors;
try {
	colors = require(idem("colors/safe"));
} catch (ex) {}
if (!colors) colors = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray'].reduce(function(r, c) {
	r[c] = idem;
	return r;
}, {});

exports.log = function(message) {
	console.log(colors.gray("[STREAMLINE] " + message));
}
exports.warn = function(message) {
	console.warn(colors.yellow("[STREAMLINE] " + message));
}
exports.error = function(message) {
	console.error(colors.magenta("[STREAMLINE] " + message));
}

// straighten options and warns about obsolete ones
exports.getOptions = function(options, filename) {
	var opts = {
		runtime: "callbacks",
		cache: true,
	};
	Object.keys(options = options || {}).forEach(function(opt) {
		if (/^(fast|cb|lines\w+)$/.test(opt)) {
			util.warn("Ignoring obsolete option: " + opt);
			return;
		}
		if (/^([a-z])/.test(opt) && !/^options$/.test(opt)) opts[opt] = options[opt];
	});
	if (opts.fibers) opts.runtime = "fibers";
	delete opts.fibers;
	if (opts.generators) opts.runtime = "generators";
	delete opts.generators;

	// normalize option names to match babel
	if (typeof opts.sourceMap === 'string') {
		opts.sourceMapFile = opts.sourceMap;
		delete opts.sourceMap;
		opts.sourceMaps = true;
	} else if (opts.map) {
		opts.sourceMaps = true;
		delete opts.map;
	}

	if (opts.cacheDir) opts.cache = true;
	opts.filename = filename;

	return opts;
}

exports.babelOptions = function(options, filename) {
	options.babel = options.babel || {};
	var babelOpts = {
		plugins: [],
	};
	Object.keys(options.babel).forEach(function(opt) {
		if (options.babel[opt] != null) babelOpts[opt] = options.babel[opt];
	});
	if (babelOpts.plugins.indexOf('streamline') < 0)
		babelOpts.plugins.push('streamline');
	// see https://github.com/babel/babel/issues/1833
	babelOpts.extra = {
		streamline: {
			runtime: options.runtime,
			verbose: !!options.verbose,
			forceTransform: /\._(coffee|js)$/.test(filename || ''),
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