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

function E(_, code){
	try {
		fail(_, code);
	} 
	catch (ex) {
		if (code % 3 == 1) 
			fail(_, code);
		else if (code % 3 == 2) 
			A(_, code);
		else 
			return "OK " + code;
	}
}

function F(_, code){
	var f1 = A(null, code);
	var f2 = A(null, code + 1);
	return f1(_) + " & " + f2(_);
}

function G(_, code){
	if (code == 5) 
		fail(_, code);
	return "" + code;
}

function H(_, code){
	if (code % 2 == 0) 
		nextTick(_);
	return G(_, code);
}

function I(_, code){
	var s = "";
	for (var i = 0; i < code; i++) 
		s += H(_, i);
	return s;
}

function T(_, fn, code, failFn){
	fail = failFn;
	var s = "{"
	try {
		return fn(_, code);
	} 
	catch (ex) {
		var s = ex.stack;
		//console.log(ex.rawStack);
		//console.log(ex.stack);
		//console.log(s);
		s = s.split('\n').map(function(l){
			var m = /^\s+at (\w+)\s\(.*:(\d+)\:.*\)/.exec(l);
			if (m) 
				return m[1] + ":" + m[2];
			return l;
		}).join('/');
		var end = s.indexOf('/T:');
		return end < 0 ? s + "-- end frame missing" : s.substring(0, end);
	}
}

module("stacks");

asyncTest("stacks", 20, function(_){
	strictEqual(T(_, A, 1, failAsync), "Error: 1/failAsync:15/A:28");
	strictEqual(T(_, A, 1, failSync), "Error: 1/fail:20/failSync:21/A:28");
	strictEqual(T(_, A, 2, failAsync), "Error: 2/failAsync:15/A:30");
	strictEqual(T(_, A, 2, failSync), "Error: 2/fail:20/failSync:21/A:30");
	strictEqual(T(_, A, 3, failAsync), "Error: 3/failAsync:15/A:33");
	strictEqual(T(_, A, 3, failSync), "Error: 3/fail:20/failSync:21/A:33");
	strictEqual(T(_, A, 4, failAsync), "Error: 4/failAsync:15/A:36");
	strictEqual(T(_, A, 4, failSync), "Error: 4/fail:20/failSync:21/A:36");
	strictEqual(T(_, A, 5, failAsync), "Error: 5/failAsync:15/A:36");
	strictEqual(T(_, A, 5, failSync), "Error: 5/fail:20/failSync:21/A:36");
	strictEqual(T(_, A, 6, failAsync), "Error: 6/failAsync:15/A:40");
	strictEqual(T(_, A, 6, failSync), "Error: 6/fail:20/failSync:21/A:40");
	strictEqual(T(_, A, 7, failAsync), "Error: 7/failAsync:15/B:49/A:42");
	strictEqual(T(_, A, 7, failSync), "Error: 7/fail:20/failSync:21/B:49/A:42");
	strictEqual(T(_, A, 8, failAsync), "Error: 8/failAsync:15/C:58/B:50/A:42");
	strictEqual(T(_, A, 8, failSync), "Error: 8/fail:20/failSync:21/C:58/B:50/A:42");
	strictEqual(T(_, A, 9, failAsync), "Error: 9/failAsync:15/D:63/B:53/A:42");
	strictEqual(T(_, A, 9, failSync), "Error: 9/fail:20/failSync:21/D:63/B:53/A:42");
	strictEqual(T(_, A, 10, failAsync), "END");
	strictEqual(T(_, A, 10, failSync), "END");
	start();
})

asyncTest("catch", 20, function(_){
	strictEqual(T(_, E, 1, failAsync), "Error: 1/failAsync:15/E:72");
	strictEqual(T(_, E, 1, failSync), "Error: 1/fail:20/failSync:21/E:72");
	strictEqual(T(_, E, 2, failAsync), "Error: 2/failAsync:15/A:30/E:74");
	strictEqual(T(_, E, 2, failSync), "Error: 2/fail:20/failSync:21/A:30/E:74");
	strictEqual(T(_, E, 3, failAsync), "OK 3");
	strictEqual(T(_, E, 3, failSync), "OK 3");
	strictEqual(T(_, E, 4, failAsync), "Error: 4/failAsync:15/E:72");
	strictEqual(T(_, E, 4, failSync), "Error: 4/fail:20/failSync:21/E:72");
	strictEqual(T(_, E, 5, failAsync), "Error: 5/failAsync:15/A:36/E:74");
	strictEqual(T(_, E, 5, failSync), "Error: 5/fail:20/failSync:21/A:36/E:74");
	strictEqual(T(_, E, 6, failAsync), "OK 6");
	strictEqual(T(_, E, 6, failSync), "OK 6");
	strictEqual(T(_, E, 7, failAsync), "Error: 7/failAsync:15/E:72");
	strictEqual(T(_, E, 7, failSync), "Error: 7/fail:20/failSync:21/E:72");
	strictEqual(T(_, E, 8, failAsync), "Error: 8/failAsync:15/C:58/B:50/A:42/E:74");
	strictEqual(T(_, E, 8, failSync), "Error: 8/fail:20/failSync:21/C:58/B:50/A:42/E:74");
	strictEqual(T(_, E, 9, failAsync), "OK 9");
	strictEqual(T(_, E, 9, failSync), "OK 9");
	strictEqual(T(_, E, 10, failAsync), "Error: 10/failAsync:15/E:72");
	strictEqual(T(_, E, 10, failSync), "Error: 10/fail:20/failSync:21/E:72");
	start();
})

asyncTest("futures", 20, function(_){
	strictEqual(T(_, F, 1, failAsync), "Error: 1/failAsync:15/A:28/F:83");
	strictEqual(T(_, F, 1, failSync), "Error: 1/fail:20/failSync:21/A:28/F:83");
	strictEqual(T(_, F, 2, failAsync), "Error: 2/failAsync:15/A:30/F:83");
	strictEqual(T(_, F, 2, failSync), "Error: 2/fail:20/failSync:21/A:30/F:83");
	strictEqual(T(_, F, 3, failAsync), "Error: 3/failAsync:15/A:33/F:83");
	strictEqual(T(_, F, 3, failSync), "Error: 3/fail:20/failSync:21/A:33/F:83");
	strictEqual(T(_, F, 4, failAsync), "Error: 4/failAsync:15/A:36/F:83");
	strictEqual(T(_, F, 4, failSync), "Error: 4/fail:20/failSync:21/A:36/F:83");
	strictEqual(T(_, F, 5, failAsync), "Error: 5/failAsync:15/A:36/F:83");
	strictEqual(T(_, F, 5, failSync), "Error: 5/fail:20/failSync:21/A:36/F:83");
	strictEqual(T(_, F, 6, failAsync), "Error: 6/failAsync:15/A:40/F:83");
	strictEqual(T(_, F, 6, failSync), "Error: 6/fail:20/failSync:21/A:40/F:83");
	strictEqual(T(_, F, 7, failAsync), "Error: 7/failAsync:15/B:49/A:42/F:83");
	strictEqual(T(_, F, 7, failSync), "Error: 7/fail:20/failSync:21/B:49/A:42/F:83");
	strictEqual(T(_, F, 8, failAsync), "Error: 8/failAsync:15/C:58/B:50/A:42/F:83");
	strictEqual(T(_, F, 8, failSync), "Error: 8/fail:20/failSync:21/C:58/B:50/A:42/F:83");
	strictEqual(T(_, F, 9, failAsync), "Error: 9/failAsync:15/D:63/B:53/A:42/F:83");
	strictEqual(T(_, F, 9, failSync), "Error: 9/fail:20/failSync:21/D:63/B:53/A:42/F:83");
	strictEqual(T(_, F, 10, failAsync), "END & END");
	strictEqual(T(_, F, 10, failSync), "END & END");
	start();
})

asyncTest("loop", 8, function(_){
	strictEqual(T(_, I, 4, failAsync), "0123");
	strictEqual(T(_, I, 4, failSync), "0123");
	strictEqual(T(_, I, 5, failAsync), "01234");
	strictEqual(T(_, I, 5, failSync), "01234");
	strictEqual(T(_, I, 6, failAsync), "Error: 5/failAsync:15/G:88/H:95/I:101");
	strictEqual(T(_, I, 6, failSync), "Error: 5/fail:20/failSync:21/G:88/H:95/I:101");
	strictEqual(T(_, I, 7, failAsync), "Error: 5/failAsync:15/G:88/H:95/I:101");
	strictEqual(T(_, I, 7, failSync), "Error: 5/fail:20/failSync:21/G:88/H:95/I:101");
	start();
})


