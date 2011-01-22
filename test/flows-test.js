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
	
	function delay(_, val){
		setTimeout(function(){
			_(null, val);
		}, 0);
	}
	
	function delayFail(_, err){
		setTimeout(function(){
			_(err);
		}, 0);
	}
	
	module("array");
	
	asyncTest("each", 1, function(){
		evalTest(function f(_){
			var result = 1;
			each(_, [1, 2, 3, 4], function(_, val){
				result = result * delay(_, val);
			})
			return result;
		}, 24);
	})
	
	asyncTest("map", 1, function(){
		evalTest(function f(_){
			return map(_, [1, 2, 3, 4], function(_, val){
				return 2 * delay(_, val);
			})
		}, [2, 4, 6, 8]);
	})
	
	asyncTest("filter", 1, function(){
		evalTest(function f(_){
			return filter(_, [1, 2, 3, 4], function(_, val){
				return delay(_, val) % 2;
			})
		}, [1, 3]);
	})
	
	asyncTest("every", 1, function(){
		evalTest(function f(_){
			return every(_, [1, 2, 3, 4], function(_, val){
				return delay(_, val) < 5;
			})
		}, true);
	});
	
	asyncTest("every", 1, function(){
		evalTest(function f(_){
			return every(_, [1, 2, 3, 4], function(_, val){
				return delay(_, val) < 3;
			})
		}, false);
	});
	
	asyncTest("some", 1, function(){
		evalTest(function f(_){
			return some(_, [1, 2, 3, 4], function(_, val){
				return delay(_, val) < 3;
			})
		}, true);
	});
	
	asyncTest("some", 1, function(){
		evalTest(function f(_){
			return some(_, [1, 2, 3, 4], function(_, val){
				return delay(_, val) < 0;
			})
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
					total += delay(_, i);
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
					total += delay(_, i);
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
					total += delay(_, i);
					count--;
					return 2 * i;
				}
			}
			var results = spray([doIt(1), doIt(2), doIt(3)], 2).collectAll(_);
			return [total, peak, count, results];
		}, [6, 2, 0, [2, 4, 6]]);
	})
	
	
})
