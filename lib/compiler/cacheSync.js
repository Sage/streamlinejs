"use strict";

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

module.exports = function(path, options, transform) {
	if (!options.cache) return transform();
	path = path.replace(/\\/g, '/');

	var i = path.indexOf('node_modules/');
	if (i < 0) i = path.lastIndexOf('/');
	else i += 'node_modules'.length;

	var dir = cacheRoot(options) + '/' + subdir(options);
	dir += '/' + path.substring(0, i).replace(/[\/\:]/g, '__');
	var f = dir + path.substring(i);
	mkdirsSync(f);
	if (!options.force && mtimeSync(f) > mtimeSync(path)) return fs.readFileSync(f, "utf8");
	var contents = transform();
	fs.writeFileSync(f, contents, "utf8");
	return contents;
}
