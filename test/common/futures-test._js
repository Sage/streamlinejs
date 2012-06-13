var module = QUnit.module;
var flows = require("streamline/lib/util/flows");

function delay(millis, val, _) {
	setTimeout(_, millis);
	return val;
}

module("futures");

asyncTest("timeouts", 10, function(_) {
	var f = delay(1, 'a');
	equals(f(_), 'a', "no timeout");
	f = delay(1, 'a');
	equals(f(_, 10, 'b'), 'a', "result before timeout");
	f = delay(10, 'a');
	equals(f(_, 1, 'b'), 'b', "timeout before result");
	ok(f.cancelled, "future got cancelled");
	try {
		equal(f(_, 10, 'b'), 'c');
	} catch (ex) {
		equals(ex.message, "future cancelled", "cannot reuse cancelled future")
	}
	f = delay(10, 'a');
	try {
		equal(f(_, 1, 'b', true), 'c');
	} catch (ex) {
		equals(ex, 'b', "throws before result");
	}
	f = delay(10, 'a');
	equal(f(_, 1, 'b', false, true), 'b', "probe before result");
	equal(f(_, 10, 'b', false, true), 'a', "probe after result");

	f = delay(10, 'a');
	try {
		equal(f(_, 1, 'b', true, true), 'c');
	} catch (ex) {
		equals(ex, 'b', "throws & probe before result");
	}
	equal(f(_, 10, 'b', false, true), 'a', "probe after result");
	start();
});

asyncTest("cancellation", 21, function(_) {
	function delay2(ms1, ms2, val, step, _) {
		step.i = 1;
		setTimeout(_, ms1);
		step.i++;
		setTimeout(_, ms2);
		step.i++;
		return val;

	}
	var step = {}
	var f = delay2(5, 5, 'a', step);
	equals(step.i, 1, "step ok");
	equals(f(_, 1, 'b'), 'b', "timed out ok");
	equals(step.i, 1, "step ok after timeout");
	setTimeout(_, 5);
	equals(step.i, 1, "cancelled ok");

	/*

	var f = delay2(5, 5, 'a', step);
	equals(step.i, 1, "step ok");
	equals(f(_, 8, 'b'), 'b', "timed out ok");
	equals(step.i, 2, "step ok after intermediate timeout");
	setTimeout(_, 5);
	equals(step.i, 2, "cancelled ok");

	function compo(ms1, ms2, val1, step1, ms3, ms4, val2, step2, _) {
		var f1 = delay2(ms1, ms2, val1, step1);
		var f2 = delay2(ms3, ms4, val2, step2);
		return f1(_) + f2(_);
	}

	var step1 = {}, step2= {};
	var f = compo(5, 10, 'a', step1, 10, 10, 'b', step2);
	equals(f(_, 25, 'c'), 'ab', "no timeout ok");
	equals(step1.i, 3, "step1 ok");
	equals(step2.i, 3, "step2 ok");

	var f = compo(5, 10, 'a', step1, 10, 10, 'b', step2);
	equals(f(_, 8, 'c'), 'c', "result ok");
	equals(step1.i, 2, "step1 ok");
	equals(step2.i, 1, "step2 ok");
	setTimeout(_, 20);
	equals(step1.i, 2, "step1 cancelled ok");
	equals(step2.i, 1, "step2 cancelled ok");

	var f = compo(5, 10, 'a', step1, 10, 10, 'b', step2);
	equals(f(_, 18, 'c'), 'c', "result ok");
	equals(step1.i, 3, "step1 ok");
	equals(step2.i, 2, "step2 ok");
	setTimeout(_, 20);
	equals(step1.i, 3, "step1 cancelled ok");
	equals(step2.i, 2, "step2 cancelled ok");
*/
	start();
});