/**
 * Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */
"use strict";

/// !nodoc -- experimental combo streams
/// 


function copy(src, dst) {
	Object.keys(src).forEach(function(key) {
		dst[key] = src[key]
	})
}
if (typeof process === "object" && typeof process.cwd === "function") {
	var req = require; // trick to skip this dependency when serving client side requires
	copy(req('./server/streams'), exports);
} else {
	copy(require('./client/streams'), exports);
}