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

function g2(_) {
	console.log("G2: before wait")
	var r = wait(_, 1000);
	console.log("G2: after wait");
	return "hello";
}

function g3(_, arg) {
	console.log("G3: before wait")
	var r = wait(_, 1000);
	console.log("G3: after wait");
	//throw new Error("testing");
	return arg + arg;
}

function g1(_) {
	console.log("G1: before g2");
	var a = g2(_);
	console.log("G1: before a.next, a=" + a);
	var b = g3(_, a);
	console.log("G1: before yield, b=" + b)
	return "all done";
}

g1(function(err, result) {
	console.log("err=" + err + ", result=" + result);
});