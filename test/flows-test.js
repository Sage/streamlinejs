$(document).ready(function(){
	var module = QUnit.module;
	var transform = Streamline.transform;
	var __cb = Streamline.callbackWrapper;
	
	var vars = "";
	var exports = StreamlineHelpers;
	for (var i in StreamlineHelpers) {
		try {
			var src = StreamlineHelpers[i].toString();
			src = "(" + src + ")";
			src = transform(src, {
				noHelpers: true
			});
			StreamlineHelpers[i] = eval(src);
			vars += "var " + i + " = StreamlineHelpers." + i + ";";
			
		} 
		catch (ex) {
			console.log(ex);
		}
	}
	eval(vars);
	
	function evalTest(f, val){
		var str = transform(f.toString());
		(function(){
			eval(str);
			f(function(err, result){
				var s = err ? "ERR: " + err : result;
				deepEqual(s, val);
				start();
			})
		})();
	}
	
	function delay(val, _){
		setTimeout(function(){
			_(null, val);
		}, 0);
	}
	
	function delayFail(err, _){
		setTimeout(function(){
			_(err);
		}, 0);
	}
	
	module("array");
	
	asyncTest("each", 1, function(){
		evalTest(function f(_){
			var result = 1;
			each([1, 2, 3, 4], function(val, _){
				result = result * delay(val, _);
			}, _)
			return result;
		}, 24);
	})
	
	asyncTest("map", 1, function(){
		evalTest(function f(_){
			return map([1, 2, 3, 4], function(val, _){
				return 2 * delay(val, _);
			}, _)
		}, [2, 4, 6, 8]);
	})
	
	asyncTest("filter", 1, function(){
		evalTest(function f(_){
			return filter([1, 2, 3, 4], function(val, _){
				return delay(val, _) % 2;
			}, _)
		}, [1, 3]);
	})
	
	asyncTest("every", 1, function(){
		evalTest(function f(_){
			return every([1, 2, 3, 4], function(val, _){
				return delay(val, _) < 5;
			}, _)
		}, true);
	});
	
	asyncTest("every", 1, function(){
		evalTest(function f(_){
			return every([1, 2, 3, 4], function(val, _){
				return delay(val, _) < 3;
			}, _)
		}, false);
	});
	
	asyncTest("some", 1, function(){
		evalTest(function f(_){
			return some([1, 2, 3, 4], function(val, _){
				return delay(val, _) < 3;
			}, _)
		}, true);
	});
	
	asyncTest("some", 1, function(){
		evalTest(function f(_){
			return some([1, 2, 3, 4], function(val, _){
				return delay(val, _) < 0;
			}, _)
		}, false);
	});
	
	
	module("flow");
	
	asyncTest("collectAll", 1, function(){
		evalTest(function f(_){
			var total = 0;
			var peak = 0;
			var count = 0;
			function doIt(i){
				return function(_){
					count++;
					peak = Math.max(count, peak);
					total += delay(i, _);
					count--;
					return 2 * i;
				}
			}
			var results = spray([doIt(1), doIt(2), doIt(3)]).collectAll(_);
			return [total, peak, count, results];
		}, [6, 3, 0, [2, 4, 6]]);
	})
	
	asyncTest("collectOne", 1, function(){
		evalTest(function f(_){
			var total = 0;
			var peak = 0;
			var count = 0;
			function doIt(i){
				return function(_){
					count++;
					peak = Math.max(count, peak);
					total += delay(i, _);
					count--;
					return 2 * i;
				}
			}
			var result = spray([doIt(1), doIt(2), doIt(3)]).collectOne(_);
			return [total, peak, count, result];
		}, [1, 3, 2, 2]);
	})
	
	asyncTest("collectAll with limit", 1, function(){
		evalTest(function f(_){
			var total = 0;
			var peak = 0;
			var count = 0;
			function doIt(i){
				return function(_){
					count++;
					peak = Math.max(count, peak);
					total += delay(i, _);
					count--;
					return 2 * i;
				}
			}
			var results = spray([doIt(1), doIt(2), doIt(3)], 2).collectAll(_);
			return [total, peak, count, results];
		}, [6, 2, 0, [2, 4, 6]]);
	})
	
	
})
