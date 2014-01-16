"use strict";
var ez = require('ez-streams');

ez.devices.http.server(function(request, response, _) {
	response.writeHead(200, {
		'Content-Type': 'text/plain; charset=utf8'
	});
	response.end("Hello world!");
}).listen(_, 1337);
console.log('Server running at http://127.0.0.1:1337/');