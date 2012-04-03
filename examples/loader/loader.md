
# Streamline loader example

The loader module must be a vanilla Javascript or CoffeeScript module 
(`.js` or `.coffee` extension), not a streamline.js source because
it gets loaded before the extensions have been registered.

The loader module must register the streamline file extensions:

``` javascript
require('streamline').register({
	fibers: false,
	cache: true,
	verbose: true,
});
```

Once the extensions have been registered, the loader can require a streamline
module

``` javascript
require('./hello')
```

## Running it

``` sh
node streamline/examples/runner/runner
```
