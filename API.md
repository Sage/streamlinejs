
# Streamline commmand line analyzer / dispatcher

* `command.run()`  
  runs `node-streamline` command line analyzer / dispatcher

# Streamline compiler and file loader

* `script = compile.loadFile(_, path, options)`  
  Loads Javascript file and transforms it if necessary.  
  Returns the transformed source.
  If path is foo_.js, the source is transformed and the result
  is not saved to disk.  
  If path is foo.js and if a foo_.js file exists,
  foo_.js is transformed if necessary and saved as foo.js
  If path is foo.js and foo_.js does not exist, the contents
  of foo.js is returned.  
  `options` is a set of options passed to the transformation engine.  
  If `options.force` is set, foo_.js is transformed even if  
  foo.js is more recent.
* `script = compile.loadFileSync(path, options)`  
  Synchronous version of `compile.loadFile`.  
  Used by `require` logic.
* `compile.compile(_, paths, options)`  
  Compiles streamline source files in paths.  
  Generates a foo.js file for each foo_.js file found in paths.
  `paths` may be a list of files or a list of directories which
  will be traversed recursively.  
  `options`  is a set of options for the `transform` operation.

# Streamline `require` handler registration

* `register.register(options)`  
  Registers `require` handlers for streamline.  
  `options` is a set of default options passed to the `transform` function.

# Streamline's transformation engine

* `transformed = transform.transform(source, options)`  
  Transforms streamline source.  
  The following `options` may be specified:
  * `tryCatch` controls exception handling
  * `lines` controls line mapping
  * `callback` alternative identifier if `_` is already used.
  * `noHelpers` disables generation of helper functions (`__cb`, etc.)
