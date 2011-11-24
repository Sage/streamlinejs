console.error("Module moved to subdirectory. New require path is streamline/lib/callbacks/transform");
var moved = require("./callbacks/transform");
for (var name in moved) exports[name] = moved[name];