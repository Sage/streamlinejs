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