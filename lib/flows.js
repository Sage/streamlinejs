/**
 * Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 *
 * !!STREAMLINE!!
 */
(function(exports){
	/*
	 * Array utilities
	 */
	exports.each = function _(array, fn){
		if (!array || !array.length) 
			return array;
		var len = array.length;
		for (var i = 0; i < len; i++) 
			fn_(array[i])
		return array;
	}
	
	exports.map = function _(array, fn){
		if (!array) 
			return array;
		var result = [];
		var len = array.length;
		for (var i = 0; i < len; i++) 
			result[i] = fn_(array[i]);
		return result;
	}
	
	exports.filter = function _(array, fn){
		if (!array) 
			return array;
		var result = [];
		var len = array.length;
		for (var i = 0; i < len; i++) {
			var elt = array[i];
			if (fn_(elt)) 
				result.push(elt)
		}
		return result;
	}
	
	exports.every = function _(array, fn){
		if (!array) 
			return; // undefined
		var len = array.length;
		for (var i = 0; i < len; i++) {
			if (!fn_(array[i])) 
				return false;
		}
		return true;
	}
	
	exports.some = function _(array, fn){
		if (!array) 
			return; // undefined
		var len = array.length;
		for (var i = 0; i < len; i++) {
			if (fn_(array[i])) 
				return true;
		}
		return false;
	}
	
	/*
	 * Workflow utilities
	 */
	exports.spray = function(fns, max){
		return new function(){
			var funnel = exports.funnel(max);
			this.collect = function(count, trim, callback){
				if (typeof(callback) != "function") 
					throw new Error("invalid call to collect: no callback")
				var results = trim ? [] : new Array(fns.length);
				count = count < 0 ? fns.length : Math.min(count, fns.length);
				if (count == 0) 
					return callback(null, results);
				var collected = 0;
				for (var i = 0; i < fns.length; i++) {
					(function(i){
						funnel.channel(fns[i], function(err, result){
							if (err)
								return callback(err);
							if (trim) 
								results.push(result);
							else 
								results[i] = result;
							if (++collected == count) 
								return callback(null, results);
						})
					})(i);
				}
			}
			this.collectOne = function(callback){
				return this.collect(1, true, function(err, result){
					return callback(err, result && result[0]);
				})
			}
			this.collectAll = function(callback){
				return this.collect(-1, false, callback);
			}
		}
	}
	
	exports.funnel = function(max){
		return new function(){
			max = typeof max == "undefined" ? -1 : max;
			var self = this;
			var queue = [];
			var active = 0;
			
			this.channel = function(fn, callback){
				//console.log("FUNNEL: active=" + active + ", queued=" + queue.length);
				if (max < 0) 
					return fn(callback);
				
				queue.push({
					fn: fn,
					cb: callback
				});
				
				function _doOne(){
					var current = queue.splice(0, 1)[0];
					if (!current.cb) 
						return current.fn();
					active++;
					current.fn(function(err, result){
						active--;
						current.cb(err, result);
						while (active < max && queue.length > 0) 
							_doOne();
					});
				}
				
				while (active < max && queue.length > 0) 
					_doOne();
			}
		}
	}
	
	
})(typeof exports !== 'undefined' ? exports : (window.StreamlineHelpers = window.StreamlineHelpers || {}));
