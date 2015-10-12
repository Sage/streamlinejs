# a minimal example of using funneling to limit the concurrency of an operation.
# in this case, the operation to parallelize is making HTTP requests

try
	request = require 'request'
catch error
	console.error error.message
	console.error "Please `npm install request` before running this example"
	process.exit 1

flows = require('streamline-runtime').flows

# get a page via HTTP
get_page = (_, page_number) ->
    httpFunnel _, (_) ->
        console.log 'request  ' + page_number
        response = request.get 'http://google.com?p=' + page_number, _
        console.log 'response ' + page_number
        response.body

httpFunnel = flows.funnel 15  # allow max 15 to run in parallel

# add 50 pages to request
futures = (get_page !_, page_number for page_number in [0..49])

console.log 'pages declared'

# accumulate all of the responses before proceeding
results = flows.collect _, futures
# at this point, results is an array of bodies

console.log 'job complete'

