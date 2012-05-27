// Before running this, run the following in this directory:
// $ mkdir node_modules
// $ npm install coffee-script
//
// Then run this file from the root directory as follows:
// $ node examples/loader/loader2
//
// Streamline should find the local CoffeeScript instance for this module.

require('coffee-script');
require('../..').register();

require('./hello2');
