/**
 * Copyright (c) 2012 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */
/// !doc
/// 
/// # streamline built-ins
///  
(function() {
	"use strict";

	/// * `array.forEach_(_, fn[, thisObj])`  
	///   `fn` is called as `fn(_, elt, i)`.
	Array.prototype.forEach_ = function(_, fn, thisObj) {
		thisObj = thisObj !== undefined ? thisObj : this;
		var len = this.length;
		for (var i = 0; i < len; i++)
			fn.call(thisObj, _, this[i], i)
		return this;
	}
	/// * `result = array.map_(_, fn[, thisObj])`  
	///   `fn` is called as `fn(_, elt, i)`.
	Array.prototype.map_ = function(_, fn, thisObj) {
		thisObj = thisObj !== undefined ? thisObj : this;
		var result = [];
		var len = this.length;
		for (var i = 0; i < len; i++)
			result[i] = fn.call(thisObj, _, this[i], i);
		return result;
	}
	/// * `result = array.filter_(_, fn[, thisObj])`  
	///   `fn` is called as `fn(_, elt)`.
	Array.prototype.filter_ = function(_, fn, thisObj) {
		thisObj = thisObj !== undefined ? thisObj : this;
		var result = [];
		var len = this.length;
		for (var i = 0; i < len; i++) {
			var elt = this[i];
			if (fn.call(thisObj, _, elt))
				result.push(elt)
		}
		return result;
	}
	/// * `bool = array.every_(_, fn[, thisObj])`  
	///   `fn` is called as `fn(_, elt)`.
	Array.prototype.every_ = function(_, fn, thisObj) {
		thisObj = thisObj !== undefined ? thisObj : this;
		var len = this.length;
		for (var i = 0; i < len; i++) {
			if (!fn.call(thisObj, _, this[i]))
				return false;
		}
		return true;
	}
	/// * `bool = array.some_(_, fn[, thisObj])`  
	///   `fn` is called as `fn(_, elt)`.
	Array.prototype.some_ = function(_, fn, thisObj) {
		thisObj = thisObj !== undefined ? thisObj : this;
		var len = this.length;
		for (var i = 0; i < len; i++) {
			if (fn.call(thisObj, _, this[i]))
				return true;
		}
		return false;
	}
	/// * `result = array.reduce_(_, array, fn, val)`  
	///   `fn` is called as `val = fn(_, val, elt, i, array)`.
	Array.prototype.reduce_ = function(_, fn, v, thisObj) {
		thisObj = thisObj !== undefined ? thisObj : this;
		var len = this.length;
		for (var i = 0; i < len; i++) {
			v = fn.call(thisObj, _, v, this[i], i, this);
		}
		return v;
	}
	/// * `result = flows.reduceRight(_, array, fn, val, [thisObj])`  
	///   reduces from end to start by applying `fn` to each element.  
	///   `fn` is called as `val = fn(_, val, elt, i, array)`.
	Array.prototype.reduceRight_ = function(_, fn, v, thisObj) {
		thisObj = thisObj !== undefined ? thisObj : this;
		var len = this.length;
		for (var i = len - 1; i >= 0; i--) {
			v = fn.call(thisObj, _, v, this[i], i, this);
		}
		return v;
	}
	
	/// * `array = flows.sort(_, array, compare, [beg], [end])`  
	///   `compare` is called as `cmp = compare(_, elt1, elt2)`
	///   Note: this function _changes_ the original array (and returns it)
	Array.prototype.sort_ = function(_, compare, beg, end){
		var array = this;
		beg = beg || 0;
		end = end == null ? array.length - 1 : end;
		
		function _qsort(_, beg, end){
			if (beg >= end) 
				return;
			
			if (end == beg + 1) {
				if (compare(_, array[beg], array[end]) > 0) {
					var tmp = array[beg];
					array[beg] = array[end];
					array[end] = tmp;
				}
				return;
			}
			
			var mid = Math.floor((beg + end) / 2);
			var o = array[mid];
			var nbeg = beg;
			var nend = end;
			
			while (nbeg <= nend) {
				while (nbeg < end && compare(_, array[nbeg], o) < 0) 
					nbeg++;
				
				while (beg < nend && compare(_, o, array[nend]) < 0) 
					nend--;
				
				if (nbeg <= nend) {
					var tmp = array[nbeg];
					array[nbeg] = array[nend];
					array[nend] = tmp;
					nbeg++;
					nend--;
				}
			}
			
			if (nbeg < end) 
				_qsort(_, nbeg, end);
			if (beg < nend) 
				_qsort(_, beg, nend);
		}
		_qsort(_, beg, end);
		return array;
	}

	/// * `result = fn.apply_(_, thisObj, args, [index])`  
	///   Helper to apply `Function.apply` to streamline functions.  
	///   Equivalent to `result = fn.apply(thisObj, argsWith_)` where `argsWith_` is 
	///   a modified argument list in which the callback has been inserted at `index` 
	///   (at the end of the argument list if `index` is not specified).
	Function.prototype.apply_ = function(callback, thisObj, args, index) {
		Array.prototype.splice.call(args, index != null ? index : args.length, 0, callback);
		return this.apply(thisObj, args);
	}
})();
