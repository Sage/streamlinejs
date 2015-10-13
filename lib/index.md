
# Main API
 
`var streamline = require('streamline');`

* `streamline.register(options)`  
  Registers `require` handlers for streamline.  
  `options` is a set of default options passed to the transformation.
* `streamline.run()`  
  runs `_node` command line analyzer / dispatcher
* `{ code, map } = streamline.transform(source, options)`  
  Transforms a source script.  
  `options` is a set of options passed to the transformation engine.
* `{ code, map } = streamline.transformFileSync(path, options)`  
  Transforms a source file synchronously.  
  `options` is a set of options passed to the transformation engine.
* `{ code, map } = streamline.transformFile(_, path, options)`  
  Transforms a source file.  
  `options` is a set of options passed to the transformation engine.
* `streamline.compile(_, paths, options)`  
  Compiles streamline source files in `paths`.  
  `paths` may be a list of files or a list of directories which will be traversed recursively.  
  `options`  is a set of options for the `transform` operation.
