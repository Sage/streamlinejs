/*
 * Compile:   tsc diskUsage5.ts
 * Run:       _node diskUsage5 [path]
 *
 * Recursively computes the size of directories.
 *
 * Demonstrates how standard asynchronous node.js functions
 * like fs.stat, fs.readdir, fs.readFile can be called from 'streamlined'
 * Javascript code.
 */
///<reference path='../../typescript/streamline-node.d.ts'/>
///<reference path='../../typescript/streamline-main.d.ts'/>
"use strict";

// tell streamline that this file needs to be transformed
~~~streamline();

import fs = module('fs');

function du(_: async,
path: string): number {
  var total = 0;
  var stat = fs.stat(path, _);
  if (stat.isFile()) {
    total += fs.readFile(path, _).length;
  } else if (stat.isDirectory()) {
    var files = fs.readdir(path, _);
    for (var i = 0; i < files.length; i++) {
      total += du(_, path + "/" + files[i]);
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
  du(_, p);
  console.log("completed in " + (Date.now() - t0) + " ms");
} catch (ex) {
  console.error(ex.stack);
}