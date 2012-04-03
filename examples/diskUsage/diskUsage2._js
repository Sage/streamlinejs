/*
 * Usage: _node diskUsage2 [path]
 *
 * This file is a parallelized version of the `diskUsage.js` example.
 *
 * The fileFunnel call limits the number of concurrent open files to 20.
 *
 * Note: You can disable the funnel by setting its size to -1.
 *
 * On my machine, the parallel version is almost twice faster than the sequential version.
 */
"use strict";

var fs = require('fs');
var flows = require('streamline/lib/util/flows');

var fileFunnel = flows.funnel(20);

function du(_, path) {
  var total = 0;
  var stat = fs.stat(path, _);
  if (stat.isFile()) {
    fileFunnel(_, function(_) {
      total += fs.readFile(path, _).length;
    });
  } else if (stat.isDirectory()) {
    var files = fs.readdir(path, _);
    total += files.map(function(file) {
      return du(null, path + "/" + file);
    }).reduce_(_, function(_, val, future) {
      return val + future(_);
    }, 0);
    console.log(path + ": " + total);
  } else {
    console.log(path + ": odd file");
  }
  return total;
}

try {
  var p = process.argv.length > 2 ? process.argv[2] : ".";

  var t0 = Date.now();
  du(_, p);
  console.log("completed in " + (Date.now() - t0) + " ms");
} catch (ex) {
  console.error(ex.stack);
}