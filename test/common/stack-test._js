// WARNING: DO NOT INSERT COMMENTS OR ANYTHING
// Line numbers matter to this test!

QUnit.module(module.id);

var nextTick = _(function(cb) {
	setTimeout(function(){
		cb();
	}, 0);
}, 0);


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
	var f1 = A(!_, code);
	var f2 = A(!_, code + 1);
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


// Lots of mpty lines to sync with escodegen formatting ...




























































































































































































function issue233(_, code) {
  function customThrow() {
    throw new Error("foo");
  }
  try {
    throw new Error("bar");
  } catch(e) {
    customThrow();
  }
}









asyncTest("issue233", 1, function(_) {
	stackEqual(T(_, issue233, 0, failSync), "Error: foo/customThrow:305/issue233:320");
	start();
});

// Code below can be moved down
function T(_, fn, code, failFn){
	fail = failFn;
	var s = "{"
	try {
		return fn(_, code);
	} 
	catch (ex) {
		var s = ex.stack;
		s = s.split('\n').filter(function(l) { return l.indexOf('<<<') < 0 }).map(function(l){
			var m = /^\s+at (\w+).*:(\d+)\:[^:]+$/.exec(l);
			if (m) 
				return m[1] + ":" + m[2];
			return l;
		}).join('/');
		var end = s.indexOf('/T:');
		return end < 0 ? s + "-- end frame missing" : s.substring(0, end);
	}
}

function stackEqual(got, expect) {
	if (typeof T_ === 'function' && T_.gstreamlineFunction) { got = got.substring(0, 25); expect = expect.substring(0, 25); }
	strictEqual(got, expect, expect);
}
// safari hack
var rawStack = new Error().stack ? function(raw) {
	return raw;
} : function() {
	return "raw stack unavailable";
}

asyncTest("stacks", 20, function(_) {
	stackEqual(T(_, A, 1, failAsync), rawStack("Error: 1/failAsync:14") + "/A:33");
	stackEqual(T(_, A, 1, failSync), rawStack("Error: 1/fail:24/failSync:25") + "/A:33");
	stackEqual(T(_, A, 2, failAsync), rawStack("Error: 2/failAsync:14") + "/A:35");
	stackEqual(T(_, A, 2, failSync), rawStack("Error: 2/fail:24/failSync:25") + "/A:35");
	stackEqual(T(_, A, 3, failAsync), rawStack("Error: 3/failAsync:14") + "/A:38");
	stackEqual(T(_, A, 3, failSync), rawStack("Error: 3/fail:24/failSync:25") + "/A:38");
	stackEqual(T(_, A, 4, failAsync), rawStack("Error: 4/failAsync:14") + "/A:41");
	stackEqual(T(_, A, 4, failSync), rawStack("Error: 4/fail:24/failSync:25") + "/A:41");
	stackEqual(T(_, A, 5, failAsync), rawStack("Error: 5/failAsync:14") + "/A:41");
	stackEqual(T(_, A, 5, failSync), rawStack("Error: 5/fail:24/failSync:25") + "/A:41");
	stackEqual(T(_, A, 6, failAsync), rawStack("Error: 6/failAsync:14") + "/A:45");
	stackEqual(T(_, A, 6, failSync), rawStack("Error: 6/fail:24/failSync:25") + "/A:45");
	stackEqual(T(_, A, 7, failAsync), rawStack("Error: 7/failAsync:14") + "/B:54/A:47");
	stackEqual(T(_, A, 7, failSync), rawStack("Error: 7/fail:24/failSync:25") + "/B:54/A:47");
	stackEqual(T(_, A, 8, failAsync), rawStack("Error: 8/failAsync:14") + "/C:63/B:55/A:47");
	stackEqual(T(_, A, 8, failSync), rawStack("Error: 8/fail:24/failSync:25") + "/C:63/B:55/A:47");
	stackEqual(T(_, A, 9, failAsync), rawStack("Error: 9/failAsync:14") + "/D:68/B:58/A:47");
	stackEqual(T(_, A, 9, failSync), rawStack("Error: 9/fail:24/failSync:25") + "/D:68/B:58/A:47");
	stackEqual(T(_, A, 10, failAsync), "END");
	stackEqual(T(_, A, 10, failSync), "END");
	start();
})

asyncTest("catch", 20, function(_) {
	stackEqual(T(_, E, 1, failAsync), rawStack("Error: 1/failAsync:14") + "/E:77");
	stackEqual(T(_, E, 1, failSync), rawStack("Error: 1/fail:24/failSync:25") + "/E:77");
	stackEqual(T(_, E, 2, failAsync), rawStack("Error: 2/failAsync:14") + "/A:35/E:79");
	stackEqual(T(_, E, 2, failSync), rawStack("Error: 2/fail:24/failSync:25") + "/A:35/E:79");
	stackEqual(T(_, E, 3, failAsync), "OK 3");
	stackEqual(T(_, E, 3, failSync), "OK 3");
	stackEqual(T(_, E, 4, failAsync), rawStack("Error: 4/failAsync:14") + "/E:77");
	stackEqual(T(_, E, 4, failSync), rawStack("Error: 4/fail:24/failSync:25") + "/E:77");
	stackEqual(T(_, E, 5, failAsync), rawStack("Error: 5/failAsync:14") + "/A:41/E:79");
	stackEqual(T(_, E, 5, failSync), rawStack("Error: 5/fail:24/failSync:25") + "/A:41/E:79");
	stackEqual(T(_, E, 6, failAsync), "OK 6");
	stackEqual(T(_, E, 6, failSync), "OK 6");
	stackEqual(T(_, E, 7, failAsync), rawStack("Error: 7/failAsync:14") + "/E:77");
	stackEqual(T(_, E, 7, failSync), rawStack("Error: 7/fail:24/failSync:25") + "/E:77");
	stackEqual(T(_, E, 8, failAsync), rawStack("Error: 8/failAsync:14") + "/C:63/B:55/A:47/E:79");
	stackEqual(T(_, E, 8, failSync), rawStack("Error: 8/fail:24/failSync:25") + "/C:63/B:55/A:47/E:79");
	stackEqual(T(_, E, 9, failAsync), "OK 9");
	stackEqual(T(_, E, 9, failSync), "OK 9");
	stackEqual(T(_, E, 10, failAsync), rawStack("Error: 10/failAsync:14") + "/E:77");
	stackEqual(T(_, E, 10, failSync), rawStack("Error: 10/fail:24/failSync:25") + "/E:77");
	start();
})

asyncTest("futures", 20, function(_) {
	stackEqual(T(_, F, 1, failAsync), rawStack("Error: 1/failAsync:14") + "/A:33/F:88");
	stackEqual(T(_, F, 1, failSync), rawStack("Error: 1/fail:24/failSync:25") + "/A:33/F:88");
	stackEqual(T(_, F, 2, failAsync), rawStack("Error: 2/failAsync:14") + "/A:35/F:88");
	stackEqual(T(_, F, 2, failSync), rawStack("Error: 2/fail:24/failSync:25") + "/A:35/F:88");
	stackEqual(T(_, F, 3, failAsync), rawStack("Error: 3/failAsync:14") + "/A:38/F:88");
	stackEqual(T(_, F, 3, failSync), rawStack("Error: 3/fail:24/failSync:25") + "/A:38/F:88");
	stackEqual(T(_, F, 4, failAsync), rawStack("Error: 4/failAsync:14") + "/A:41/F:88");
	stackEqual(T(_, F, 4, failSync), rawStack("Error: 4/fail:24/failSync:25") + "/A:41/F:88");
	stackEqual(T(_, F, 5, failAsync), rawStack("Error: 5/failAsync:14") + "/A:41/F:88");
	stackEqual(T(_, F, 5, failSync), rawStack("Error: 5/fail:24/failSync:25") + "/A:41/F:88");
	stackEqual(T(_, F, 6, failAsync), rawStack("Error: 6/failAsync:14") + "/A:45/F:88");
	stackEqual(T(_, F, 6, failSync), rawStack("Error: 6/fail:24/failSync:25") + "/A:45/F:88");
	stackEqual(T(_, F, 7, failAsync), rawStack("Error: 7/failAsync:14") + "/B:54/A:47/F:88");
	stackEqual(T(_, F, 7, failSync), rawStack("Error: 7/fail:24/failSync:25") + "/B:54/A:47/F:88");
	stackEqual(T(_, F, 8, failAsync), rawStack("Error: 8/failAsync:14") + "/C:63/B:55/A:47/F:88");
	stackEqual(T(_, F, 8, failSync), rawStack("Error: 8/fail:24/failSync:25") + "/C:63/B:55/A:47/F:88");
	stackEqual(T(_, F, 9, failAsync), rawStack("Error: 9/failAsync:14") + "/D:68/B:58/A:47/F:88");
	stackEqual(T(_, F, 9, failSync), rawStack("Error: 9/fail:24/failSync:25") + "/D:68/B:58/A:47/F:88");
	stackEqual(T(_, F, 10, failAsync), "END & END");
	stackEqual(T(_, F, 10, failSync), "END & END");
	start();
})

asyncTest("loop", 8, function(_) {
	stackEqual(T(_, I, 4, failAsync), "0123");
	stackEqual(T(_, I, 4, failSync), "0123");
	stackEqual(T(_, I, 5, failAsync), "01234");
	stackEqual(T(_, I, 5, failSync), "01234");
	stackEqual(T(_, I, 6, failAsync), rawStack("Error: 5/failAsync:14") + "/G:93/H:100/I:106");
	stackEqual(T(_, I, 6, failSync), rawStack("Error: 5/fail:24/failSync:25") + "/G:93/H:100/I:106");
	stackEqual(T(_, I, 7, failAsync), rawStack("Error: 5/failAsync:14") + "/G:93/H:100/I:106");
	stackEqual(T(_, I, 7, failSync), rawStack("Error: 5/fail:24/failSync:25") + "/G:93/H:100/I:106");
	start();
})


