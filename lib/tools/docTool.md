
# Documentation tool

Usage:

	_node streamline/lib/tools/docTool [path]

Extracts documentation comments from `.js` and `._js` files and generates `API.md` file 
under package root.

Top of source file must contain `/// !doc` marker to enable doc extraction.  
Documentation comments must start with `/// ` (with 1 trailing space).  
Extraction can be turned off with `/// !nodoc` and turned back on with `/// !doc`.

`/// !doc` can be replaced by `/// !example`. 
In this case, the source code will be transformed to source blocks in the generated `.md` file.

The tool can also be invoked programatically with:

`var docTool = require('streamline/lib/tools/docTool')`

* `doc = docTool.generate(_, path)`  
  extracts documentation comments from file `path`
