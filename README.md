[![Circle CI](https://circleci.com/gh/DispatcherInc/promise-cache-throttle.svg?style=svg&circle-token=21468a65559575349852a5bf2fbad530bb56ede2)](https://circleci.com/gh/DispatcherInc/promise-cache-throttle)

# promise-cache-throttle
Provides caching and throttling of promises.

- **Promise.cachify**(func, options) - Returns the function wrapped with caching
- **Promise.cachifyAll**(target, options) - Patches all the target's methods with caching
- **Promise.throttlify**(func, options) - Returns the function wrapped with throttling
- **Promise.throttlifyAll**(target, options) - Patches all the target's methods with throttling

These have similar definitions to bluebird's promisify:
- cachify and throttlify resemble [bluebird's promisify](http://bluebirdjs.com/docs/api/promise.promisify.html)
- cachifyAll and throttlifyAll resemble [bluebird's promisifyAll](http://bluebirdjs.com/docs/api/promise.promisifyall.html)

You can also use the underlying functions directly:
- **throttler.throttleAsync**(func) - Limits the number of concurrent calls. Any additional calls will wait.
- **lockableCache.callAsync**(key, func) - Ensures a function isn't called concurrently. Any subsequent calls with same key before the first has resolved will wait and receive the same response.

## Examples
```
npm install promise-cache-throttle
```
```javascript
var Promise = require('bluebird');
require('promise-cache-throttle')(Promise);
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

Promise.throttlifyAll(API, /* optional */ {
    concurrency: 1,
    queueLimit: 100,
    suffix: 'Throttled', // or leave empty to override methods
    filter: function(name, func, target, passesDefaultFilter) { // optional filter
        return _.includes(['getUsersAsync', 'getDriverAsync'], name);
    },
    resolvers: {
        "getDriverAsync": [String]
    }
});
Promise.cachifyAll(API, /* optional */ {
    suffix: 'Cached', // or leave empty to override methods,
    filter: function(name, func, target, passesDefaultFilter) { // optional filter
        return _.includes(['getUsersAsync', 'getDriversAsync'], name);
    }
});
// NOTE: throttling should be applied before caching
```
Or for single functions:
```javascript
var getDriversAsyncThrottled = Promise.throttlify(API.getDriversAsync, /* optional */ {context: API});
var getDriverAsyncCached = Promise.cachify(API.getDriverAsync, /* optional */  {
    context: API,
    resolvers: [(ob) => { return obj.id; }, String, Number, Boolean]
});
```
To apply throttlify with the same throttler:
```javascript
var throttler = new Promise.throttlify.Throttler(/* optional */ {
    concurrency: 1,
    queueLimit: 100
});
var getDriversAsyncThrottled = Promise.throttlify(API.getDriversAsync, {
    context: API,
    throttler: throttler
});
var getUsersAsyncThrottled = Promise.throttlify(API.getUsersAsync, {
    context: API,
    throttler: throttler
});
Promise.throttlifyAll(API, /* optional */ {
    throttler: throttler,
    filter: function(name, func, target, passesDefaultFilter) { // optional filter
        return name === 'getDriverAsync';
    }
});
```
Or use `LockableCache` and `Throttler` directly:
```javascript
var throttler = new Promise.throttlify.Throttler(/* optional */ {
    concurrency: 1,
    queueLimit: 100
});
var lockableCache = new Promise.cachify.LockableCache();

lockableCache.callAsync('users', function() {
    return throttler.throttleAsync(function() {
        return agent.get('/users/').end();
    });
});
```
