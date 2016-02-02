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
    maxBlockDuration: 30 * 1000,
    log: {
		errors: true,
		globalSummary: true,
		globalCoverage: true,
    },
    coverage: {
    	files: [
    		fsp.join(__dirname, '../lib'), 
    		fsp.join(__dirname, '../node_modules/babel-plugin-streamline/lib'), 
    		fsp.join(__dirname, '../node_modules/streamline-runtime/lib')
    	],
    },
}, function(err, stats) {
	if (err) throw err;
	if (stats.failed) process.exit(1);
});
