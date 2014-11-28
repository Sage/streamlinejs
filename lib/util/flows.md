
# Control Flow utilities
 
`var flows = require('streamline/lib/util/flows')`

## funnel
* `fun = flows.funnel(max)`  
  limits the number of concurrent executions of a given code block.

The `funnel` function is typically used with the following pattern:

``` javascript
// somewhere
var myFunnel = flows.funnel(10); // create a funnel that only allows 10 concurrent executions.

// elsewhere
myFunnel(_, function(_) { /* code with at most 10 concurrent executions */ });
```

The `diskUsage2.js` example demonstrates how these calls can be combined to control concurrent execution.

The `funnel` function can also be used to implement critical sections. Just set funnel's `max` parameter to 1.

If `max` is set to 0, a default number of parallel executions is allowed. 
This default number can be read and set via `flows.funnel.defaultSize`.  
If `max` is negative, the funnel does not limit the level of parallelism.

The funnel can be closed with `fun.close()`.  
When a funnel is closed, the operations that are still in the funnel will continue but their callbacks
won't be called, and no other operation will enter the funnel.
## handshake and queue
* `hs = flows.handshake()`  
  allocates a simple semaphore that can be used to do simple handshakes between two tasks.  
  The returned handshake object has two methods:  
  `hs.wait(_)`: waits until `hs` is notified.  
  `hs.notify()`: notifies `hs`.  
  Note: `wait` calls are not queued. An exception is thrown if wait is called while another `wait` is pending.
* `q = flows.queue(options)`  
  allocates a queue which may be used to send data asynchronously between two tasks.  
  The returned queue has the following methods:  
  `data = q.read(_)`: dequeues an item from the queue. Waits if no element is available.  
  `q.write(_, data)`:  queues an item. Waits if the queue is full.  
  `ok = q.put(data)`: queues an item synchronously. Returns true if the queue accepted it, false otherwise. 
  `q.end()`: ends the queue. This is the synchronous equivalent of `q.write(_, undefined)`  
  The `max` option can be set to control the maximum queue length.  
  When `max` has been reached `q.put(data)` discards data and returns false.

## Miscellaneous utilities
* `results = flows.collect(_, futures)`  
  collects the results of an array of futures

* `result = flows.trampoline(_, fn, thisObj)`  
  Executes `fn(_)` through a trampoline.  
  Waits for `fn`'s result and returns it.  
  This is equivalent to calling `fn.call(thisObj, _)` but the current stack is unwound
  before calling `fn`.

* `flows.setImmediate(fn)`  
  portable `setImmediate` both browser and server.  

* `flows.nextTick(_)`  
  `nextTick` function for both browser and server.  
  Aliased to `process.nextTick` on the server side.

* `flows.sleep(_, millis)`  
  Sleeps `millis` ms.  

* `flows.callWithTimeout(_, fn, millis)`  
  Calls `fn(_)` with a timeout guard.  
  Throws a timeout exception if `fn` takes more than `millis` ms to complete.  
