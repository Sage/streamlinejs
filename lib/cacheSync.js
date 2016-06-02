"use strict";
// manages cache for require hooks
var fs = require('fs');
var fsp = require('path');
var sourceMaps = require('./sourceMaps');
var util = require('./util');

var dirMode = parseInt('777', 8);

function mkdirsSync(path) {
	if (fs.existsSync(path)) return;
	mkdirsSync(fsp.join(path, '..'));
	fs.mkdirSync(path, dirMode);
}

function mtimeSync(fname) {
	return fs.existsSync(fname) ? fs.statSync(fname).mtime : 0;
}

exports.get = function(path, options, transform) {
	var result;
	var mapPath;
	if (!options.cache) {
		result = transform();
		if (result.map) sourceMaps.put(path, null, result.map);
	} else {
		path = path.replace(/\\/g, '/');

		var i = path.indexOf('node_modules/');
		if (i < 0) i = path.lastIndexOf('/');
		else i += 'node_modules'.length;

		var dir = util.cacheDir(options);
		dir += '/' + path.substring(0, i).replace(/[\/\:]/g, '__');
		var f = dir + path.substring(i);
		mkdirsSync(fsp.dirname(f));
		mapPath = f.replace(/(\.\w+)?$/, '.map');
		if (!options.force && mtimeSync(f) > mtimeSync(path)) {
			if (!(options.ignore && options.ignore(path))) sourceMaps.put(path, mapPath);
			result = {
				code: fs.readFileSync(f, "utf8"),
				map: options.sourceMaps ? sourceMaps.get(path) : null,
			};
		} else {
			result = transform();
			fs.writeFileSync(f, result.code, "utf8");
			if (result.map) {
				// write map to cache instead of keeping it in memory (maps are only needed for stack traces)
				sourceMaps.put(path, mapPath);
				fs.writeFileSync(mapPath, JSON.stringify(result.map, null, '\t'), "utf8");
			}
		}
	}
	// cached file does not contain sourceMappingURL - we add it on the fly here
	if (result.map && options.sourceMaps) {
		// force inline option if cache is disabled, as the map cannot be fetched from file
		if (options.sourceMaps === 'inline' || options.sourceMaps === 'both' || mapPath == null) {
			var mapData = new Buffer(JSON.stringify(result.map)).toString('base64')
			result.code += '\n//# sourceMappingURL=data:application/json;base64,' + mapData;
		} else {
			result.code += '\n//# sourceMappingURL=file://' + (mapPath[0] === '/' ? mapPath : '/' + mapPath);
		}
	}
	return result;
}
