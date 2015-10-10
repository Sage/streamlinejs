// Before running this, run the following in this directory:
// $ mkdir node_modules
// $ npm install coffee-script
//
// Then run this file from the root directory as follows:
// $ node examples/loader/loader2
//
// Streamline should find the local CoffeeScript instance for this module.

try {
	require('coffee-script').register();
} catch (error) {
	console.error(error.message);
	console.error("Please `npm install` or `npm link` coffee-script before running this example");
	process.exit(1);
}
require('streamline').register();

require('./hello2');
