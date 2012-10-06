/*
 * Compile:   tsc diskUsage5.ts
 * Run:       _node diskUsage5 [path]
 *
 * This file is a parallelized version of the `diskUsage5.ts` example.
 *
 * Demonstrates the use of futures with TypeScript.
 */
"use strict";

///<reference path='../../typescript/streamline-node.d.ts'/>
///<reference path='../../typescript/streamline-main.d.ts'/>
"use strict";

// tell streamline that this file needs to be transformed
~~~streamline();

import fs = module('fs');
import flows = module('streamline/lib/util/flows')

var fileFunnel = flows.funnel(20);

function du(_: async, path: string) {
  var total = 0;
  var stat = fs.stat(path, _);
  if (stat.isFile()) {
    fileFunnel(_, function(_) {
      total += fs.readFile(path, _).length;
    });
  } else if (stat.isDirectory()) {
    var files = fs.readdir(path, _);
    total += array_(files.map(function(file) {
      return du(null, path + "/" + file);
    })).reduce_(_, function(_, val, future) {
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