if (typeof setTimeout === 'undefined') {
	this.setTimeout = function(cb, ms) {
			return new require('uv').Timer().start(ms, 0, cb);
		}
}
if (typeof console === 'undefined') {
	this.console = {
		log: print
	};
}

function wait(_, ms) {
	setTimeout(_, ms);
}

function echo(_, str) {
	console.log("waiting ...");
	wait(_, 1000);
	console.log("echoing " + str)
	return str;
}

var helloWorld = function(_) {
	return echo(_, "Hello") + ' ' + echo(_, "world!"); 
}

helloWorld(function(err, result) {
	console.log("err=" + err + ", result=" + result);
});