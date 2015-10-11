"use strict";
var fs = require('fs');

var _maps = {};

// assumes put was called before with same path
exports.get = function(path) {
	var p = _maps[path];
	if (!p) return null;
	if (p.map) return p.map;
	else if (p.filename) return p.map = JSON.parse(fs.readFileSync(p.filename));
	else return null;
}

exports.put = function(path, filename, map) {
	_maps[path] = {
		filename: filename,
		map: map,
	};
}