//console.error("Module moved to subdirectory. New require path is streamline/lib/compiler");
var moved = require("./compiler/compile");
for (var name in moved)
	exports[name] = moved[name];

