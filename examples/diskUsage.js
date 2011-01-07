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

function du_(path) {
	var total = 0;
	var stat = fs.stat_(path);
	if (stat.isFile()) {
		total += fs.readFile_(path).length;
	}
	else if (stat.isDirectory()) {
		var files = fs.readdir_(path);
		for (var i = 0; i < files.length; i++) {
			total += du_(path + "/" + files[i]);
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
du(p, function(err, result) {
	if (err)
		console.log(err.toString() + "\n" + err.stack);
	console.log("completed in " + (Date.now() - t0) + " ms");
});

