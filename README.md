# cache-throttle
Provides function caching and throttling.

- **cachify** - Ensures a function isn't called concurrently. Any subsequent calls before the first has resolved will wait and receive the same response.
- **throttlify** - Limits the number of concurrent calls. Any additional calls will wait.

## Examples
```
npm install @dispatcher/cache-throttle
```
```javascript
var cacheThrottle = require('@dispatcher/cache-throttle');
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

cacheThrottle.throttlifyAll(API, {
	concurrency: 1,
	queueLimit: 100
});
cacheThrottle.cachifyAll(API);
// NOTE: throttling should be applied before caching
```
Or for single functions:
```javascript
cacheThrottle.throttlify(API, 'getDriversAsync');
cacheThrottle.cachify(API, 'getDriversAsync');
```
Or use `LockableCache` and `Throttler` directly:
```javascript
var throttler = new cacheThrottle.Throttler();
var lockableCache = new cacheThrottle.LockableCache();

lockableCache.callAsync('users', function() {
	return throttler.throttleAsync(function() {
		return agent.get('/users/').end();
	});
});
```
