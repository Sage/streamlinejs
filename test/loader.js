"use strict";
// install streamline hooks
require('..').register();

// patch asyncTest because streamline test function needs a callback.
var original = global.asyncTest;
global.asyncTest = function(name, expect, fn) {
	if (typeof expect === 'function') {
		fn = expect;
		expect = null;
	}
	original(name, expect, function() {
		fn(function(err) {
			if (err) throw err;
		});
	});
}