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

// Apply throttling before caching:
cacheThrottle.throttlifyAll(API, {
	concurrency: 1,
	queueLimit: 100
});
cacheThrottle.cachifyAll(API);

// Or for single functions:
cacheThrottle.throttlify(API, 'getDriversAsync');
cacheThrottle.cachify(API, 'getDriversAsync');

```
