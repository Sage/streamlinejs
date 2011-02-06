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
require("../../narcissus/lib/jsdefs");
require("../../narcissus/lib/jslex");
require("../../narcissus/lib/jsparse");
require("../../narcissus/lib/jsdecomp");
var fs = require("fs");
var path = require("path");

var transform = require("./transform").transform;

if (require.extensions) {
	require.extensions[".js"] = function(module, filename){
		var content = streamline_file(filename);
		module._compile(content, filename);
	};
}
else {
	module.constructor.prototype._loadScriptSync = function (filename) {
		var content = streamline_file(filename);
		this._compile(content, filename);
		this.loaded = true;
	}
}

if (process.mainModule.filename === __filename) {
	if (process.argv.length > 2) {
		require(path.join(process.cwd(), process.argv[2]));
	}
}

function streamline_file(filename) {
	var dirname = path.dirname(filename);
	var ext = path.extname(filename);
	var basename = path.basename(filename, ext);
	var filename_ = path.join(dirname, basename + '_' + ext);

	var underscore_file_exists;
	try {
		fs.statSync(filename_);
		underscore_file_exists = true;
	} catch (err) {
		underscore_file_exists = false;
	}

	if (underscore_file_exists) {
		var content = fs.readFileSync(filename_, 'utf8');
		var transformed = transform(content);
		fs.writeFileSync(filename, transformed, 'utf8');
		return transformed
	} else {
		var content = fs.readFileSync(filename, 'utf8');
		if (content.indexOf("!!STREAMLINE!!") >= 0) {
			return transform(content);
		} else {
			return content
		}
	}
}
