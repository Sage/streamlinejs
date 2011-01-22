/*
 * Usage: node ../lib/node-init.js diskUsage [path]
 *
 * Recursively computes the size of directories.
 * 
 * Demonstrates how standard asynchronous node.js functions 
 * like fs.stat, fs.readdir, fs.readFile can be called from 'streamlined'
 * Javascript code.  
 *
 * !!STREAMLINE!!
 */

var fs = require('fs');

function du(_, path) {
	var total = 0;
	var stat = fs.stat(path, _);
	if (stat.isFile()) {
		total += fs.readFile(path, _).length;
	}
	else if (stat.isDirectory()) {
		var files = fs.readdir(path, _);
		for (var i = 0; i < files.length; i++) {
			total += du(_, path + "/" + files[i]);
		}
		console.log(path + ": " + total);
	}
	else {
		console.log(path + ": odd file");
	}
	return total;
}

var p = process.argv.length > 3 ? process.argv[3] : ".";

var t0 = Date.now();
function report(err, result) {
	if (err)
		console.log(err.toString() + "\n" + err.stack);
	console.log("completed in " + (Date.now() - t0) + " ms");
}
du(report, p);

