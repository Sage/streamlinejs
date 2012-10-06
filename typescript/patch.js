var fs = require('fs');

var src = __dirname + '/node.d.ts';
var dst = __dirname + '/streamline-node.d.ts';

//var out = fs.readFileSync(src, 'utf8').replace(/\: \(err\: Error, ([^,\)]*)\) \=\> void\)\: void\;\)/g, function(s, t) {
var out = fs.readFileSync(src, 'utf8').replace(/\: \(err\: Error, [^\:]*\:([^,\)]*)\)( \=\> void)? ?\)\: void\;/g, function(s, t) {
	console.log("found: " + t)
	return ": async) : " + t + ";";
}).replace(/callback(\??)\: Function\)\: void\;/g, function(s, opt) {
	console.log("found: callback")
	return "callback" + opt + ": async) : any;";
});
fs.writeFileSync(dst, out, 'utf8');