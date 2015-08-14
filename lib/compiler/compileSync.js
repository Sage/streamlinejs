"use strict";
"use strict";
/// !doc
/// 
/// # Compiler and file loader (sync version)
///  
/// `var compiler = require('streamline/lib/compiler/compile')`
/// 
var fs = require("fs");
var fspath = require("path");
var util = require("./util");

exports.transformModule = function(content, path, options) {
	options = options || {};

	var ext = fspath.extname(path);
	var basename = fspath.basename(path, ext);
	var dirname = fspath.dirname(path);

	var js = dirname + '/' + basename + ext;

	var banner = util.banner(options);

	options.sourceName = path;
	var matches;
	if (ext !== '.js' && ext !== '.coffee') {
		// we don't care about shebang here, but keep line ending if it had a shebang for line counts
		var shebangparse = util.parseShebang(content);
		var shebang = shebangparse[0];
		content = shebangparse[2] + shebangparse[1];

		var babelOptions = util.babelOptions(options);
		return banner + babel.transform(content, babelOptions, _).code;
	} else {
		return content;
	}
};

exports.cachedTransformSync = function(content, path, transform, options, testOnly) {
	if (testOnly) return null;
	var banner = util.banner(options);
	path = path.replace(/\\/g, '/');
	if (options.verbose) console.log("streamline: transforming: " + path);
	var babelOptions = util.babelOptions(options);
	return banner + babel.transformFileSync(path, babelOptions).code;
};

util.deprecate(module, 'use babel API instead');