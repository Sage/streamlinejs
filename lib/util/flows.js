"use strict";
var globals = require('streamline/lib/globals');
var dir = 'streamline/lib/' + (globals.runtime || 'callbacks');
if (false) require('streamline/lib/callbacks/flows'); // hint for streamline-require. DO NOT REMOVE!
module.exports = require(dir + '/flows');
