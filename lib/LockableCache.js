var Promise = require('bluebird');

/*

  This service ensures a function isn't called concurrently.
  Any subsequent calls before the first has resolved will wait and receive the same response.

  e.g. 
  lockableCache.callAsync("info", function() {
	  return request.get("/info").end();
  })

*/

function LockableCache() {

	var locks = {};
	var promises = {};

	// Promises
	var addPromise = function(key, resolve, reject) {
		if (!promises[key]) {
			promises[key] = [];
		}

		promises[key].push({
			resolve: resolve,
			reject: reject
		});
	};

	var getPromiseAsync = function(key) {
		return new Promise(function(resolve, reject) { 
			addPromise(key, resolve, reject); 
		});
	};

	var resolvePromises = function(key, rejectArgs, resolveArgs) {
		promises[key] = promises[key] || [];
		while (promises[key].length) {
			var promise = promises[key].shift();
			if (rejectArgs) {
				promise.reject.apply(null, rejectArgs);
			} else {
				promise.resolve.apply(null, resolveArgs);
			}
		}
		delete promises[key];
		unlock(key);
	};

	// Locking
	var lock = function(key) {
		locks[key] = true;
	};

	var unlock = function(key) {
		delete locks[key];
	}

	var isLocked = function(key) {
		return !!locks[key];
	};

	// Responses
	var resolveAsync = function(key, responseArgs) {
		resolvePromises(key, null, responseArgs);
		return Promise.resolve.apply(null, responseArgs);
	};

	var rejectAsync = function(key, errorArgs) {
		resolvePromises(key, errorArgs);
		return Promise.reject.apply(null, errorArgs);
	};

	// Expose
	this.callAsync = function(key, asyncCallback) {
		if (isLocked(key)) {
			return getPromiseAsync(key);
		}

		lock(key);
		return asyncCallback()
			.then(function() {
				return resolveAsync(key, arguments);
			})
			.catch(function() {
				return rejectAsync(key, arguments);
			});
	};
}

module.exports = LockableCache;
