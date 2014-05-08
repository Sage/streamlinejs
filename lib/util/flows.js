"use strict";
var globals = require('../globals');
var dir = '../' + (globals.runtime || 'callbacks');
if (false) require('../callbacks/flows'); // hint for streamline-require. DO NOT REMOVE!
module.exports = require(dir + '/flows');
