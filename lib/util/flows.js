"use strict";
var globals = require('../globals');
module.exports = require('../compiler/flows');
if (false) {
	var dir = '../' + (globals.runtime || 'callbacks');
	if (false) require('../callbacks/flows'); // hint for streamline-require. DO NOT REMOVE!
	module.exports = require(dir + '/flows');
}
