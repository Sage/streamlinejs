"use strict";
~~~streamline();
var fs = require('fs')
var flows = require('streamline/lib/util/flows')
var fileFunnel = flows.funnel(20);
function du(_, path) {
    var total = 0;
    var stat = fs.stat(path, _);
    if(stat.isFile()) {
        fileFunnel(_, function (_) {
            total += fs.readFile(path, _).length;
        });
    } else {
        if(stat.isDirectory()) {
            var files = fs.readdir(path, _);
            total += array_(files.map(function (file) {
                return du(null, path + "/" + file);
            })).reduce_(_, function (_, val, future) {
                return val + future(_);
            }, 0);
            console.log(path + ": " + total);
        } else {
            console.log(path + ": odd file");
        }
    }
    return total;
}
try  {
    var p = process.argv.length > 2 ? process.argv[2] : ".";
    var t0 = Date.now();
    du(_, p);
    console.log("completed in " + (Date.now() - t0) + " ms");
} catch (ex) {
    console.error(ex.stack);
}

