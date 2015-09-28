"use strict";

// This script rebuilds the browser files
// It is run before publishing to NPM.
var fs = require("fs");
var fsp = require("path");
var browserify = require("browserify");
var babelify = require("babelify");
require('babel-plugin-streamline');

function build(from, to, opts) {
	var src = fsp.join(__dirname, from);
	var dst = fsp.join(__dirname, to);
	browserify(src, {
		//debug: true,
		extensions: ['.js', '._js'],
	}).transform(babelify.configure(opts)).bundle().on("error", function(err) {
		console.log("Error : " + err.message);
	}).pipe(fs.createWriteStream(dst)).on('finish', function(){
		finish(dst);
	});
}

// temporary hack to eliminate regexp error in babel source
function finish(dst) {
	if (!/transform\.js$/.test(dst)) return;
	fs.writeFileSync(dst, fs.readFileSync(dst, 'utf8')
		.replace(/(nonASCIIidentifier(?:Start)?Chars) = .*/g, "$1 = '';"), 'utf8');
}

var streamlineOpts = {
	plugins: ['streamline'],
	extensions: [".js", "._js"],
	extra: {
		streamline: {
			runtime: 'callbacks',
			verbose: 'true',
		}
	}
};

build("lib/browser/runtime-callbacks-source.js", "lib/browser/runtime-callbacks.js");
build("lib/browser/runtime-generators-source.js", "lib/browser/runtime-generators.js");
build("lib/browser/transform-source.js", "lib/browser/transform.js");
build("test/common/eval-test._js", "test/common/callbacks/eval-test.js", streamlineOpts);
build("test/common/flows-test._js", "test/common/callbacks/flows-test.js", streamlineOpts);
build("test/common/futures-test._js", "test/common/callbacks/futures-test.js", streamlineOpts);
build("test/common/stack-test._js", "test/common/callbacks/stack-test.js", streamlineOpts);
