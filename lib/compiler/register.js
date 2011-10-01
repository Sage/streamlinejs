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
var compile = require("./compile");
var registered = false;
var options = {};
/// !doc
/// 
/// # streamline/lib/compiler/register
///  
/// Streamline `require` handler registration
/// 
/// * `register.register(options)`  
///   Registers `require` handlers for streamline.  
///   `options` is a set of default options passed to the `transform` function.
exports.register = function(setoptions) {
	options = setoptions || {};
	if (registered)
		return;
	registered = true;
	var pModule = require('module').prototype;
	var orig = pModule._compile;
	pModule._compile = function(content, filename) {
		content = compile.transformModule(content, filename, options);
		return orig.call(this, content, filename);
	}
};

