#
# Usage: coffee-streamline diskUsage2.coffee [path]
#
# This file is a parralelized version of the `diskUsage.coffee` example. 
# 
# The `spray` function is used to parallelize the processing on all the entries under a directory.
# We use it with `collectAll_` because we want to continue the algorithm when all the 
# entries have been processed. 
# 
# Without any additional preventive measure, this 'sprayed' implementation quickly exhausts  
# file descriptors because of the number of concurrently open file increases exponentially
# as we go deeper in the tree.
# 
# The remedy is to channel the call that opens the file through a funnel.
# With the funnel there won't be more that 20 files concurrently open at any time 
# 
# Note: You can disable the funnel by setting its size to -1.
# 
# On my machine, the parallel version is almost twice faster than the sequential version.
#
# !!STREAMLINE!!

fs = require 'fs'
flows = require 'streamline/lib/flows'

fileFunnel = flows.funnel 20

du = (_, path) ->
	total = 0
	stat = fs.stat path, _
	if stat.isFile()
		fileFunnel.channel _, (_) ->
			total += fs.readFile(path, _).length
	else if stat.isDirectory()
		files = fs.readdir path, _
		flows.spray(((_) -> total += du _, path + "/" + f) for f in files).collectAll _
		console.log path + ": " + total
	else
		console.log path + ": odd file"
	total

p = if process.argv.length > 2 then process.argv[2] else "."

t0 = Date.now()

report = (err, result) ->
	if err
		console.log err.toString() + "\n" + err.stack
	console.log "completed in " + (Date.now() - t0) + " ms"

du report, p

