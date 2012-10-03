// Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
"use strict";

exports.transform = transform;
exports.version = "0.4.5 (spoon)";
// hack to fix #123
exports.transform.version = exports.version;


function transform(source, options) {
	var spoon = require("spoon"),
		esprima = require("esprima"),
		uglify = require("uglify-js");

	var ast = esprima.parse(source);

	var cfg = spoon.construct(ast);
	//console.log("CFG=" + cfg);

	cfg.asyncify([], { marker: '_' });

	var out = spoon.render(cfg);
	var code = uglify.uglify.gen_code(out, {
		beautify: true
	});
	return "(function(__$callback) {\n" + code + "\n})(function(__$e) { if (__$e) console.log(__$e); });";
}