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

function nodeDeferred(fn) {
  return function() {
    return require('streamline/lib/callbacks/runtime').deferred(fn, arguments, arguments.length);
  }
}

var fs = {
  stat: nodeDeferred(fs1.stat),
  readdir: nodeDeferred(fs1.readdir),
  readFile: nodeDeferred(fs1.readFile)
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
  du(p).then(function(result) {
    console.log("completed in " + (Date.now() - t0) + " ms");
  }, function(err) {
    console.error(err.stack);
  });
} catch (ex) {
  console.error(ex.stack);
}