#
# Usage: _coffee diskUsage_3.coffee [path]
#
# Recursively computes the size of directories.
# 
# Demonstrates how standard asynchronous node.js functions 
# like fs.stat, fs.readdir, fs.readFile can be called from 'streamlined'
# Javascript code.  
#

rawfs = require 'fs'
rt = require 'streamline/lib/callbacks/runtime'

nodeDeferred = (fn) ->
  () -> rt.deferred fn, arguments, arguments.length

fs =
  stat: nodeDeferred rawfs.stat
  readdir: nodeDeferred rawfs.readdir
  readFile: nodeDeferred rawfs.readFile

du = async (path) ->
	total = 0
	stat = await fs.stat path
	if stat.isFile()
		total += (await fs.readFile(path)).length
	else if stat.isDirectory()
		files = await fs.readdir path
		for f in files
			total += await du path + "/" + f
		console.log path + ": " + total
	else
		console.log path + ": odd file"
	total

p = if process.argv.length > 2 then process.argv[2] else "."

t0 = Date.now()

try
	result = await du p
	console.log "completed in " + (Date.now() - t0) + " ms"
catch err
	console.log err.toString() + "\n" + err.stack
