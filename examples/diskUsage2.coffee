#
# Usage: ../bin/coffee-streamline diskUsage2.coffee [path]
#
# Recursively computes the size of directories.
# 
# Demonstrates how standard asynchronous node.js functions 
# like fs.stat, fs.readdir, fs.readFile can be called from 'streamlined'
# Javascript code.  
#
# !!STREAMLINE!!

fs = require 'fs'
flows = require '../lib/flows'

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

p = if process.argv.length > 0 then process.argv[0] else "."

t0 = Date.now()

report = (err, result) ->
	if err
		console.log err.toString() + "\n" + err.stack
	console.log "completed in " + (Date.now() - t0) + " ms"

du report, p

