/**
 * Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
"use strict";
var fs = require("fs");
var path = require("path");
try {
	var coffee = require('coffee-script');
} catch (ex) {
}
var transform = require("./transform");
var registered = false;

exports.register = function(options) {
	if (registered)
		return;
	registered = true;

	require.extensions[".js"] = function(module, filename) {
		var content = exports.loadFile(filename, options);
		module._compile(content, filename);
	};
	if (coffee) {
		require.extensions['.coffee'] = function(module, filename) {
			// coffee compiles by default with a function wrapper.
			// this breaks streamline since the function wrapper doesn't
			// have the necessary callback parameter. we could manually
			// add it, but the good news is we don't need the function
			// wrapper in this case -- streamline adds its own.
			var content = fs.readFileSync(filename, 'utf8');
			if (filename.match(/_\.coffee$/)) {
				content = transform.transform(coffee.compile(content, {
					bare: true
				}));
			} else {
				content = coffee.compile(content);
			}
			module._compile(content, filename);
		};
	}
};
exports.loadFile = function(filename, options) {
	options = options || {};
	options.sourceName = filename;

	var dirname = path.dirname(filename);
	var ext = path.extname(filename);
	var basename = path.basename(filename, ext);
	var filename_;
	var endsWithUnderscore = basename[basename.length - 1] == '_';
	if (endsWithUnderscore) {
		filename_ = filename;
		filename = path.join(dirname, basename.substring(0, basename.length - 1) + ext);
		options.lines = options.lines || "preserve";
	} else {
		filename_  = path.join(dirname, basename + '_' + ext);
		options.lines = options.lines || "mark";
	}
	var mtime = function(fname) {
		try {
			return fs.statSync(fname).mtime;
		} catch (err) {
			return 0;
		}
	}
	var underscore_mtime = mtime(filename_);

	var banner = transform.banner();
	if (options.lines !== "preserve") {
		banner += "\n";
	}

	function _transformIt() {
		if (options.verbose)
			console.log("streamline: transforming: " + filename)
		var content = fs.readFileSync(filename_, 'utf8');
		var transformed = transform.transform(content, options);
		transformed = banner + transformed;
		if (!endsWithUnderscore)
			fs.writeFileSync(filename, transformed, 'utf8');
		return transformed;
	}

	if (underscore_mtime != 0) {
		if (endsWithUnderscore || (!options.forceTransform && underscore_mtime > mtime(filename))) {
			return _transformIt();
		} else {
			var content = fs.readFileSync(filename, 'utf8');
			if (content.substring(0, banner.length) == banner) {
				if (options.verbose)
					console.log("streamline: from cache: " + filename)
				return content;
			} else {
				return _transformIt();
			}
		}
	} else {
		return fs.readFileSync(filename, 'utf8');
	}
}
