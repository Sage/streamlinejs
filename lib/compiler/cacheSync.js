"use strict";
// manages cache for require hooks
var fs = require('fs');
var version = require('../version').version;

function cacheRoot(options) {
	if (options.cacheDir) return options.cacheDir;
	if (process.env.HOME === undefined && process.env.HOMEDRIVE === undefined) throw new Error("HOME not found, unable to store Streamline callback cache");
	return (process.env.HOME || (process.env.HOMEDRIVE + process.env.HOMEPATH).replace(/\\/g, '/')) + "/.streamline";
}

var dirMode = parseInt('777', 8);

function mkdirsSync(path) {
	var p = "",
		i = 0;
	var segs = path.split('/').slice(0, -1);
	while (i < segs.length) {
		var seg = segs[i];
		p += (i++ ? '/' : '') + seg;
		if (!fs.existsSync(p)) {
			try {
				fs.mkdirSync(p, dirMode);
			} catch(err) {
				if (i > 1 && err.code !== 'EEXIST') {
					throw err;
				}
			}
		}
	}
}

function mtimeSync(fname) {
	return fs.existsSync(fname) ? fs.statSync(fname).mtime : 0;
}

var _0755 = parseInt("0755", 8);


function subdir(options) {
	var d = options.runtime;
	if (options.aggressive) d += '-aggressive';
	d += "-" + version;
	return d;
}

var _sourceMaps = {};

// assumes getCode was called before with same path
exports.getSourceMap = function(path) {
	var p = _sourceMaps[path];
	if (!p) return null;
	if (p.map) return p.map;
	else if (p.path) return p.map = JSON.parse(fs.readFileSync(p.path));
	else return null;
}

exports.getCode = function(path, options, transform) {
	var result;
	if (!options.cache) {
		result = transform();
		if (result.map) _sourceMaps[path] = {
			map: result.map,
		};
		return result.code;
	}
	path = path.replace(/\\/g, '/');

	var i = path.indexOf('node_modules/');
	if (i < 0) i = path.lastIndexOf('/');
	else i += 'node_modules'.length;

	var dir = cacheRoot(options) + '/' + subdir(options);
	dir += '/' + path.substring(0, i).replace(/[\/\:]/g, '__');
	var f = dir + path.substring(i);
	mkdirsSync(f);
	if (!options.force && mtimeSync(f) > mtimeSync(path)) {
		return fs.readFileSync(f, "utf8");
	}
	var result = transform();
	fs.writeFileSync(f, result.code, "utf8");
	if (result.map) {
		// always write map to cache, this call may not need it but another one may later
		var mapPath = f + '.map';
		_sourceMaps[path] = {
			path: mapPath,
		};
		if (result.map) fs.writeFileSync(mapPath, JSON.stringify(result.map, null, '\t'), "utf8");
	}
	return result.code;
}

