
# Compiler and file loader
 
`var compiler = require('streamline/lib/compiler/compile')`

* `script = compiler.loadFile(_, path, options)`  
  Loads Javascript file and transforms it if necessary.  
  Returns the transformed source.  
  If `path` is `foo_.js`, the source is transformed and the result
  is *not* saved to disk.  
  If `path` is `foo.js` and if a `foo_.js` file exists,
  `foo_.js` is transformed if necessary and saved as `foo.js`.  
  If `path` is `foo.js` and `foo_.js` does not exist, the contents
  of `foo.js` is returned.  
  `options` is a set of options passed to the transformation engine.  
  If `options.force` is set, `foo_.js` is transformed even if 
  `foo.js` is more recent.
* `script = compiler.transformModule(path, options)`  
  Synchronous version of `compiler.loadFile`.  
  Used by `require` logic.
* `compiler.compile(_, paths, options)`  
  Compiles streamline source files in `paths`.  
  Generates a `foo.js` file for each `foo._js` file found in `paths`.
  `paths` may be a list of files or a list of directories which
  will be traversed recursively.  
  `options`  is a set of options for the `transform` operation.
