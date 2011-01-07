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
 * 
 * Note: only tested with 0.2.6
 */
require("../../narcissus/lib/jsdefs");
require("../../narcissus/lib/jslex");
require("../../narcissus/lib/jsparse");
require("../../narcissus/lib/jsdecomp");

var transform = require("./transform").transform;

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

var path = require("path");
var argv = process.argv;
if (argv.length > 2) {
	var i = argv[1].indexOf("/node-init.js");
	if (i >= 0) {
		var p1 = path.normalize(argv[1]);
		var p2 = path.normalize(process.cwd() + "/" + argv[2]);
		var n1 = p1.split('/').length;
		var n2 = p2.split('/').length;
		var n = Math.min(n1, n2) - 1;
		var p = "../".repeat(n) +  p2.split('/').slice(n2 - n).join('/');
		console.log("p=" + p)
		require(p);
	}
}
