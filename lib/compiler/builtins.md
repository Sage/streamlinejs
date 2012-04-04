
# Streamline built-ins
 
## Asychronous versions of ES5 Array functions.  

Common Rules: 

These variants are postfixed by an underscore.  
They take the `_` callback as first parameter.  
They pass the `_` callback as first arguement to their `fn` callback.  
Most of them have an optional `options` second parameter which controls the level of 
parallelism. This `options` parameter may be specified as `{ parallel: par }` 
where par is an integer, or directly as a `par` integer value.  
The `par` values are interpreted as follows:

* If absent or equal to 1, execution is sequential.
* If > 1, at most `par` operations are parallelized.
* if 0, a default number of operations are parallelized. 
  This default can be read and set with funnel.defaultSize (4 by default)
* If < 0 or Infinity, operations are fully parallelized (no limit).

API:

* `array.forEach_(_[, options], fn[, thisObj])`  
  `fn` is called as `fn(_, elt, i)`.
* `result = array.map_(_[, options], fn[, thisObj])`  
  `fn` is called as `fn(_, elt, i)`.
* `result = array.filter_(_[, options], fn[, thisObj])`  
  `fn` is called as `fn(_, elt)`.
* `bool = array.every_(_[, options], fn[, thisObj])`  
  `fn` is called as `fn(_, elt)`.
* `bool = array.some_(_[, options], fn[, thisObj])`  
  `fn` is called as `fn(_, elt)`.
* `result = array.reduce_(_, array, fn, val)`  
  `fn` is called as `val = fn(_, val, elt, i, array)`.
* `result = flows.reduceRight(_, array, fn, val, [thisObj])`  
  reduces from end to start by applying `fn` to each element.  
  `fn` is called as `val = fn(_, val, elt, i, array)`.
* `array = flows.sort(_, array, compare, [beg], [end])`  
  `compare` is called as `cmp = compare(_, elt1, elt2)`
  Note: this function _changes_ the original array (and returns it)
## Asychronous versions of ES5 Function functions.  

* `result = fn.apply_(_, thisObj, args, [index])`  
  Helper to use `Function.prototype.apply` with streamline functions.  
  Equivalent to `result = fn.apply(thisObj, argsWith_)` where `argsWith_` is 
  a modified argument list in which the callback has been inserted at `index` 
  (at the end of the argument list if `index` is not specified).
