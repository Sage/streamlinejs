"use strict";

var fs = require('fs');
var fsp = require('path');

var templ = fs.readFileSync(fsp.join(__dirname, 'escodegen-template.js'), 'utf8');
templ = templ.replace(/\{\{'([^']*)'\}\}/g, function(all, path) {
	return fs.readFileSync(fsp.join(__dirname, path), 'utf8');
});
fs.writeFileSync(fsp.join(__dirname, 'escodegen-browser.js'), templ, 'utf8');