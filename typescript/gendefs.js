var fs = require('fs');

function patch(pkg) {
	var src = __dirname + '/../../typescript-node-definitions/' + pkg + '.d.ts';
	var dst = __dirname + '/' + pkg + '_.d.ts';
	//var out = fs.readFileSync(src, 'utf8').replace(/\: \(err\: Error, ([^,\)]*)\) \=\> void\)\: void\;\)/g, function(s, t) {
	var out = fs.readFileSync(src, 'utf8').replace(/\??\s*\:\s*\(\s*err\s*\:\s*\w+\s*,\s*[^\:\?]*\??\s*\:\s*([^,\)]*)\)(\s*\=\>\s*\w+)\s*\)(\s*\:\s*\w+\s*)?\;/g, function(s, t) {
		return "?: async) : " + t + ";";
	}).replace(/callback(\??)\: Function\)\: void\;/g, function(s, opt) {
		return "callback" + opt + ": async) : any;";
	}).replace(/\.d\.ts/g, "_.d.ts");
	console.log("creating " + dst);
	fs.writeFileSync(dst, out, 'utf8');
}

patch('node');
patch('mongodb');