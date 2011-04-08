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
var transform = require("./transform");
var registered = false;

exports.register = function(options) {
	if (registered)
		return;
	registered = true;

	if (require.extensions) {
		require.extensions[".js"] = function(module, filename) {
			var content = exports.loadFile(filename, options);
			module._compile(content, filename);
		};
	} else {
		module.constructor.prototype._loadScriptSync = function(filename) {
			var content = exports.loadFile(filename, options);
			this._compile(content, filename);
			this.loaded = true;
		}
	}
};
exports.loadFile = function(filename, options) {
	options = options || {};
	options.sourceName = filename;
	options.lines = options.lines || "mark";

	var dirname = path.dirname(filename);
	var ext = path.extname(filename);
	var basename = path.basename(filename, ext);
	var filename_;
	if (basename[basename.length - 1] == '_') {
		filename_ = filename;
		filename = path.join(dirname, basename.substring(0, basename.length - 1) + ext);
	} else {
		filename_  = path.join(dirname, basename + '_' + ext);
	}
	var mtime = function(fname) {
		try {
			return fs.statSync(fname).mtime;
		} catch (err) {
			return 0;
		}
	}
	var underscore_mtime = mtime(filename_);

	var banner = transform.banner(options);

	function _transformIt() {
		if (options.verbose)
			console.log("streamline: transforming: " + filename)
		var content = fs.readFileSync(filename_, 'utf8');
		var transformed = transform.transform(content, options);
		transformed = banner + transformed;
		fs.writeFileSync(filename, transformed, 'utf8');
		return transformed;
	}

	if (underscore_mtime != 0) {
		if (!options.forceTransform && underscore_mtime > mtime(filename)) {
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
		var content = fs.readFileSync(filename, 'utf8');
		if (content.indexOf("!!STREAMLINE!!") >= 0) {
			options.lines = "preserve";
			return transform.transform(content, options);
		} else {
			return content;
		}
	}
}
