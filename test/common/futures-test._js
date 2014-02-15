QUnit.module(module.id);

function delay(millis, val, _) {
	setTimeout(~_, millis);
	return val;
}

asyncTest("no timeout", 1, function(_) {
	var f = delay(1, 'a', !_);
	equals(f(_), 'a', "no timeout");
	start();
});
/*
asyncTest("result before timeout", 1, function(_) {
	var f = delay(1, 'a');
	equals(f(_, { timeout: 10, return: 'b' }), 'a', "got result");
	start();
});
asyncTest("timeout returns before result", 3, function(_) {
	var f = delay(20, 'a');
	equals(f(_, { timeout: 1, return: 'b' }), 'b', "got timeout");
	ok(f.cancelled, "future got cancelled");
	try {
		equal(f(_, { timeout: 20, return: 'b' }), 'c');
	} catch (ex) {
		equals(ex.message, "future cancelled", "cannot reuse cancelled future")
	}
	start();
});
asyncTest("timeout throws before result", 1, function(_) {
	var f = delay(20, 'a');
	try {
		equal(f(_, { timeout: 1, throw: 'b' }), 'c');
	} catch (ex) {
		equals(ex.message, 'b', "throws before result");
	}
	start();
});
asyncTest("probe with return", 2, function(_) {
	var f = delay(20, 'a');
	equal(f(_, { timeout: 1, return: 'b', probe: true }), 'b', "probe before result");
	equal(f(_, { timeout: 40, return: 'b', probe: true }), 'a', "probe after result");
	start();
});
asyncTest("probe with throw", 2, function(_) {
	var f = delay(20, 'a');
	try {
		equal(f(_, { timeout: 1, throw: 'b', probe: true }), 'c');
	} catch (ex) {
		equals(ex.message, 'b', "probe before result");
	}
	equal(f(_, { timeout: 40, throw: 'b', probe: true }), 'a', "probe after result");
	start();
});

function delay2(ms1, ms2, val, step, _) {
	step.i = 1;
	setTimeout(_, ms1);
	step.i++;
	setTimeout(_, ms2);
	step.i++;
	return val;

}

asyncTest("cancel before first timeout", 4, function(_) {
	var step = {}
	var f = delay2(20, 20, 'a', step);
	equals(step.i, 1, "step ok");
	equals(f(_, { timeout: 1, return: 'b' }), 'b', "timed out ok");
	equals(step.i, 1, "step ok after timeout");
	setTimeout(_, 40);
	equals(step.i, 1, "cancelled ok");
	start();
});
asyncTest("cancel between first and second timeouts", 4, function(_) {
	var step = {}
	var f = delay2(20, 20, 'a', step);
	equals(step.i, 1, "step ok");
	equals(f(_, { timeout: 30, return: 'b' }), 'b', "timed out ok");
	equals(step.i, 2, "step ok after intermediate timeout");
	setTimeout(_, 20);
	equals(step.i, 2, "cancelled ok");
	start();
});

function join(ms1, ms2, val1, step1, ms3, ms4, val2, step2, _) {
	var f1 = delay2(ms1, ms2, val1, step1);
	var f2 = delay2(ms3, ms4, val2, step2);
	return f1(_) + f2(_);
}

asyncTest("join returns before timeout", 3, function(_) {
	var step1 = {}, step2= {};
	var f = join(10, 20, 'a', step1, 20, 20, 'b', step2);
	equals(f(_, { timeout: 60, return: 'c' }), 'ab', "no timeout ok");
	equals(step1.i, 3, "step1 ok");
	equals(step2.i, 3, "step2 ok");
	start();
});
asyncTest("join with short timeout", 5, function(_) {
	var step1 = {}, step2= {};
	var f = join(10, 20, 'a', step1, 20, 20, 'b', step2);
	equals(f(_, { timeout: 15, return: 'c' }), 'c', "result ok");
	equals(step1.i, 2, "step1 ok");
	equals(step2.i, 1, "step2 ok");
	setTimeout(_, 40);
	equals(step1.i, 2, "step1 cancelled ok");
	equals(step2.i, 1, "step2 cancelled ok");
	start();
});
asyncTest("join with intermediate timeout", 5, function(_) {
	var step1 = {}, step2= {};
	var f = join(10, 20, 'a', step1, 20, 20, 'b', step2);
	equals(f(_, { timeout: 35, return: 'c' }), 'c', "result ok");
	equals(step1.i, 3, "step1 ok");
	equals(step2.i, 2, "step2 ok");
	setTimeout(_, 20);
	equals(step1.i, 3, "step1 cancelled ok");
	equals(step2.i, 2, "step2 cancelled ok");
	start();
});
*/