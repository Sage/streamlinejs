"use strict";
// compatibility API
exports.flows = require("./flows");
exports.future = require("./future");
require('../compiler/util').deprecate(module, 'use ez-streams');