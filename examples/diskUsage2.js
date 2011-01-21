/*
 * Usage: node ../lib/node-init.js diskUsage2 [path]
 *
 * This file is a parralelized version of the `diskUsage.js` example. 
 * 
 * The `spray` function is used to parallelize the processing on all the entries under a directory.
 * We use it with `collectAll_` because we want to continue the algorithm when all the 
 * entries have been processed. 
 * 
 * Without any additional preventive measure, this 'sprayed' implementation quickly exhausts  
 * file descriptors because of the number of concurrently open file increases exponentially
 * as we go deeper in the tree.
 * 
 * The remedy is to channel the call that opens the file through a funnel.
 * With the funnel there won't be more that 20 files concurrently open at any time 
 * 
 * Note: You can disable the funnel by setting its size to -1.
 * 
 * On my machine, the parallel version is almost twice faster than the sequential version.
 * 
 * !!STREAMLINE!!
 */

var fs = require('fs');
var flows = require('../lib/flows');

var fileFunnel = flows.funnel(20);

function du(path, _){
	var total = 0;
	var stat = fs.stat(path, _);
	if (stat.isFile()) {
		fileFunnel.channel(function(_){
			total += fs.readFile(path, _).length;
		}, _);
	}
	else 
		if (stat.isDirectory()) {
			var files = fs.readdir(path, _);
			flows.spray(files.map(function(file){
				return function(_){
					total += du(path + "/" + file, _);
				}
			})).collectAll(_);
			console.log(path + ": " + total);
		}
		else {
			console.log(path + ": odd file");
		}
	return total;
}

var p = process.argv.length > 3 ? process.argv[3] : ".";

var t0 = Date.now();
du(p, function(err, result){
	if (err) 
		console.log(err.toString() + "\n" + err.stack);
	console.log("completed in " + (Date.now() - t0) + " ms");
})
