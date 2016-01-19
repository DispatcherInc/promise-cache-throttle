[![Circle CI](https://circleci.com/gh/DispatcherInc/cache-throttle.svg?style=svg&circle-token=21468a65559575349852a5bf2fbad530bb56ede2)](https://circleci.com/gh/DispatcherInc/cache-throttle)

# cache-throttle
Provides caching and throttling of promises.

- **cachify**(func, options) - Returns the function wrapped with caching
- **cachifyAll**(target, options) - Patches all the target's methods with caching
- **throttlify**(func, options) - Returns the function wrapped with throttling
- **throttlifyAll**(target, options) - Patches all the target's methods with throttling

These have similar definitions to bluebird's promisify:
- cachify and throttlify resemble [bluebird's promisify](http://bluebirdjs.com/docs/api/promise.promisify.html)
- cachifyAll and throttlifyAll resemble [bluebird's promisifyAll](http://bluebirdjs.com/docs/api/promise.promisifyall.html)

You can also use the underlying functions directly:
- **throttler.throttleAsync**(func) - Limits the number of concurrent calls. Any additional calls will wait.
- **lockableCache.callAsync**(key, func) - Ensures a function isn't called concurrently. Any subsequent calls with same key before the first has resolved will wait and receive the same response.

## Examples
```
npm install cache-throttle
```
```javascript
var cacheThrottle = require('cache-throttle');
var Promise = require('bluebird');
var superagent = require('superagent');
var agent = require('superagent-promise')(superagent, Promise);

var API = {
	getUsersAsync: function() { 
		return agent.get('/users/').end();
	},
	getDriversAsync: function() {
		return agent.get('/drivers/').end();
	},
	getDriverAsync: function(driverId) {
		return agent.get('/drivers/' + driverId).end();
	}
};

cacheThrottle.throttlifyAll(API, /* optional */ {
	concurrency: 1,
	queueLimit: 100,
	suffix: 'Throttled', // or leave empty to override methods
	filter: function(name, func, target, passesDefaultFilter) { // optional filter
		return _.includes(['getUsersAsync', 'getDriversAsync'], name);
	}
});
cacheThrottle.cachifyAll(API, /* optional */ {
	suffix: 'Cached', // or leave empty to override methods,
	filter: function(name, func, target, passesDefaultFilter) { // optional filter
		return _.includes(['getUsersAsync', 'getDriversAsync'], name);
	}
});
// NOTE: throttling should be applied before caching
```
Or for single functions:
```javascript
var getDriversAsyncThrottled = cacheThrottle.throttlify(API.getDriversAsync, /* optional */ {context: API});
var getDriversAsyncCached = cacheThrottle.cachify(API.getDriversAsync, /* optional */  {context: API});
```
To apply throttlify with the same throttler:
```javascript
var throttler = new cacheThrottle.Throttler(/* optional */ {
	concurrency: 1,
	queueLimit: 100
});
var getDriversAsyncThrottled = cacheThrottle.throttlify(API.getDriversAsync, {
	context: API,
	throttler: throttler
});
var getUsersAsyncThrottled = cacheThrottle.throttlify(API.getUsersAsync, {
	context: API,
	throttler: throttler
});
cacheThrottle.throttlifyAll(API, /* optional */ {
    throttler: throttler,
    filter: function(name, func, target, passesDefaultFilter) { // optional filter
        return name === 'getDriverAsync';
    }
});
```
Or use `LockableCache` and `Throttler` directly:
```javascript
var throttler = new cacheThrottle.Throttler(/* optional */ {
	concurrency: 1,
	queueLimit: 100
});
var lockableCache = new cacheThrottle.LockableCache();

lockableCache.callAsync('users', function() {
	return throttler.throttleAsync(function() {
		return agent.get('/users/').end();
	});
});
```
