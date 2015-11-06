"use strict";

var fs = require('fs');
var fsp = require('path');

var root = fsp.join(__dirname, 'common');
var tests = fs.readdirSync(root).filter(function(file) {
	return /\._js$/.test(file);
}).map(function(file) {
	return fsp.join(root, file);
});

require('..').register();

var testrunner = require("qunit");

testrunner.run({
	code: fsp.join(__dirname, 'loader.js'),
    tests: tests,
    maxBlockDuration: 10 * 1000,
}, function(err) {
	if (err) throw err;
});
