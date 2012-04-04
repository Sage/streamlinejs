
# Transformation engine (callback mode)

* `transformed = transform.transform(source, options)`  
  Transforms streamline source.  
  The following `options` may be specified:
  * `tryCatch` controls exception handling
  * `lines` controls line mapping
  * `callback` alternative identifier if `_` is already used.
  * `noHelpers` disables generation of helper functions (`__cb`, etc.)
