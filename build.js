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
	}).pipe(fs.createWriteStream(dst)).on('finish', function() {
		finish(to);
	});
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

/*build("node_modules/streamline-runtime/lib/runtime-callbacks.js", "lib/callbacks/runtime-all.js");
build("test/common/stack-test._js", "test/common/callbacks/stack-test.js", streamlineOpts);
build("test/common/eval-test._js", "test/common/callbacks/eval-test.js", streamlineOpts);
bu*ild("test/common/flows-test._js", "test/common/callbacks/flows-test.js", streamlineOpts);
build("test/common/futures-test._js", "test/common/callbacks/futures-test.js", streamlineOpts);
build("test/common/stack-test._js", "test/common/callbacks/stack-test.js", streamlineOpts);
*/
build("lib/callbacks/browser-transform.js", "lib/callbacks/transform-all.js");

function finish(name) {
	if (!/transform-all/.test(name)) return;
	var tall = fsp.join(__dirname, "lib/callbacks/transform-all.js");
	var s = fs.readFileSync(tall, "utf8");
	s = s.replace(/(nonASCIIidentifier(?:Start)?Chars) = .*/g, "$1 = ''")
	fs.writeFileSync(tall, s, "utf8");
}