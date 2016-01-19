"use strict";
/* @flow */
var fs = require('fs');

var _maps = {};

function normalize(path) {
	return path.toLowerCase().replace(/\\/g, '/');
}

// assumes put was called before with same path
exports.get = function(path /*: string*/) /*: any*/ {
	var p = _maps[normalize(path)];
	if (!p) return null;
	if (p.map) return p.map;
	else if (p.filename) return p.map = JSON.parse(fs.readFileSync(p.filename));
	else return null;
}

exports.put = function(path /*: string*/, filename /*: ?string*/, map /*: any*/) /*: void*/ {
	_maps[normalize(path)] = {
		filename: filename,
		map: map,
	};
}