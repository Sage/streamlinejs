//streamline.options = { "lines" : "preserve" }
// WARNING: DO NOT INSERT COMMENTS OR ANYTHING
// Line numbers matter to this test!

var module = QUnit.module;
var flows = require("streamline/lib/util/flows");

function nextTick(cb){
	setTimeout(function(){
		cb();
	}, 0);
}

function failAsync(_, code){
	throw new Error(code);
}

function failSync(_, code){
	(function fail(dummy){ // dummy to defeat CoffeeScript compat rule
		throw new Error(code);
	})(0);
}

var fail;

function A(_, code){
	if (code == 1) 
		fail(_, code);
	if (code == 2) 
		fail(_, code);
	nextTick(_);
	if (code == 3) 
		fail(_, code);
	for (var i = 0; i < 6; i++) {
		if (code == i) 
			fail(_, code);
		nextTick(_);
	}
	if (code == 6) 
		fail(_, code);
	nextTick(_);
	B(_, code);
	nextTick(_);
	return "END";
}

function B(_, code){
	if (code == 7) 
		fail(_, code);
	C(_, code);
	nextTick(_);
	C(_, code);
	D(_, code);
}

function C(_, code){
	if (code == 8) 
		fail(_, code);
}

function D(_, code){
	if (code == 9) 
		fail(_, code);
}

function T(_, code, failFn){
	fail = failFn;
	var s = "{"
	try {
		return A(_, code);
	} 
	catch (ex) {
		var s = flows.stackTrace(ex);
		//console.log("STACK: " + s);
		var ff;
		s = s.split('\n').map(function(l){
			// V8 format
			var m = /^\s+at (\w+)\s\(.*:(\d+)\:.*\)/.exec(l);
			if (m) 
				return m[1] + ":" + m[2];
			// FF format
			m = /^([^(]+)\([^)]+\)@.*\:(\d+)$/.exec(l);
			//console.log("l=" + l + ", m=" + m)
			//m && console.log(m[1] + ":" + m[2]);
			if (m) {
				ff = true;
				return m[1] + ":" + m[2];
			}
			return l;
		}).join('/');
		// TODO: we don't get the /T:xxx frame on FF.
		// investigate why
		return ff ? "Error: " + code + "/" + s : s.substring(0, s.indexOf('/T:'));
	}
}

module("flows");

asyncTest("stacks", 20, function(_){
	strictEqual(T(_, 1, failAsync), "Error: 1/failAsync:15/A:28");
	strictEqual(T(_, 1, failSync), "Error: 1/fail:20/failSync:21/A:28");
	strictEqual(T(_, 2, failAsync), "Error: 2/failAsync:15/A:30");
	strictEqual(T(_, 2, failSync), "Error: 2/fail:20/failSync:21/A:30");
	strictEqual(T(_, 3, failAsync), "Error: 3/failAsync:15/A:33");
	strictEqual(T(_, 3, failSync), "Error: 3/fail:20/failSync:21/A:33");
	strictEqual(T(_, 4, failAsync), "Error: 4/failAsync:15/A:36");
	strictEqual(T(_, 4, failSync), "Error: 4/fail:20/failSync:21/A:36");
	strictEqual(T(_, 5, failAsync), "Error: 5/failAsync:15/A:36");
	strictEqual(T(_, 5, failSync), "Error: 5/fail:20/failSync:21/A:36");
	strictEqual(T(_, 6, failAsync), "Error: 6/failAsync:15/A:40");
	strictEqual(T(_, 6, failSync), "Error: 6/fail:20/failSync:21/A:40");
	strictEqual(T(_, 7, failAsync), "Error: 7/failAsync:15/B:49/A:42");
	strictEqual(T(_, 7, failSync), "Error: 7/fail:20/failSync:21/B:49/A:42");
	strictEqual(T(_, 8, failAsync), "Error: 8/failAsync:15/C:58/B:50/A:42");
	strictEqual(T(_, 8, failSync), "Error: 8/fail:20/failSync:21/C:58/B:50/A:42");
	strictEqual(T(_, 9, failAsync), "Error: 9/failAsync:15/D:63/B:53/A:42");
	strictEqual(T(_, 9, failSync), "Error: 9/fail:20/failSync:21/D:63/B:53/A:42");
	strictEqual(T(_, 10, failAsync), "END");
	strictEqual(T(_, 10, failSync), "END");
	start();
})
