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

var transform = require("./transform").transform;

if (require.extensions) {
	require.extensions[".js"] = function(module, filename){
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
			var source = fs.readFileSync(filename_, 'utf8');
			source = transform(source);
			fs.writeFileSync(filename, source, 'utf8');
		} else {
			var source = fs.readFileSync(filename, 'utf8');
			if (source.indexOf("!!STREAMLINE!!") >= 0) 
				source = transform(source);
		}

		module._compile(source, filename);
	};
}
else {
	require.registerExtension(".js", function(content, filename){
		if (content.indexOf("!!STREAMLINE!!") < 0) 
			return content;
		// TODO: cache
		try {
			var transformed = transform(content);
			return transformed;
		} 
		catch (ex) {
			console.log(ex + "\n" + ex.stack);
		}
	})
}

var path = require("path");

if (process.mainModule.filename === __filename) {
	if (process.argv.length > 2) {
		require(path.join(process.cwd(), process.argv[2]));
	}
}
