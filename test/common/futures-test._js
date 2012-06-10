var module = QUnit.module;
var flows = require("streamline/lib/util/flows");

function delay(millis, val, _) {
	setTimeout(_, millis);
	return val;
}

module("futures");

asyncTest("timeouts", 6, function(_) {
	var f = delay(1, 'a');
	equals(f(_), 'a', "no timeout");
	f = delay(1, 'a');
	equals(f(_, 10, 'b'), 'a', "result before timeout");
	f = delay(10, 'a');
	equals(f(_, 1, 'b'), 'b', "timeout before result");
	f = delay(10, 'a');
	try {
		equal(f(_, 1, 'b', true), 'c');
	} catch (ex) {
		equals(ex, 'b', "throw before result");
	}
	f = delay(10, 'a');
	equal(f(_, 1, 'b', false, true), 'b', "cancel before result");
	f = delay(10, 'a');
	try {
		equal(f(_, 1, 'b', true, true), 'c');
	} catch (ex) {
		equals(ex, 'b', "throw & cancel before result");
	}
	start();
});