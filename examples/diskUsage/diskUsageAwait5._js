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

var rawfs = require('fs'), 
  rt = require('streamline/lib/callbacks/runtime');

function nodeDeferred(fn) {
  return function() {
    return rt.deferred(fn, arguments, arguments.length);
  }
}

var fs = {
  stat: nodeDeferred(rawfs.stat),
  readdir: nodeDeferred(rawfs.readdir),
  readFile: nodeDeferred(rawfs.readFile)
}

async function du(path) {
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