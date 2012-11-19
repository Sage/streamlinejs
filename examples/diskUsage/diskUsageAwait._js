/*
 * Usage: _node diskUsage [path]
 *
 * Recursively computes the size of directories.
 *
 * Demonstrates how standard asynchronous node.js functions
 * like fs.stat, fs.readdir, fs.readFile can be called from 'streamlined'
 * Javascript code.
 */
"use strict";

var fs1 = require('fs');

var fs = {
  stat: function(path, _) { return fs1.stat(path, _); },
  readdir: function(path, _) { return fs1.readdir(path, _); },
  readFile: function(path, _) { return fs1.readFile(path, _); },
}

function du(path) {
  var total = 0;
  var stat = await fs.stat(path);
  if (stat.isFile()) {
    total += (await fs.readFile(path)).length;
  } else if (stat.isDirectory()) {
    var files = await fs.readdir(path);
    for (var i = 0; i < files.length; i++) {
      total += await du(path + "/" + files[i]);
    }
    console.log(path + ": " + total);
  } else {
    console.log(path + ": odd file");
  }
  return total;
}

try {
  var p = process.argv.length > 2 ? process.argv[2] : ".";

  var t0 = Date.now();
  du(p)(function(err, result) {
    if (err) throw err;
    console.log("completed in " + (Date.now() - t0) + " ms");    
  });
} catch (ex) {
  console.error(ex.stack);
}