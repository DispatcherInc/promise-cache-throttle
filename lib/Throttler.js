var Promise = require('bluebird');
var _ = require('lodash');

function Throttler(options) {
	_.defaults(options, {
		concurrency: 3,
		queueLimit: 100
	});

	var inprogress = 0;
	var callbacks = [];

	var runCallbacks = function() {
		if (inprogress < options.concurrency && callbacks.length > 0) {
			inprogress++;
			var callback = callbacks.shift();
			callback()
				.finally(function() {
					inprogress--;
					runCallbacks();
				});
			runCallbacks();
		}
	};

	var addCallback = function(asyncCallback) {
		callbacks.push(asyncCallback);
		runCallbacks();
	};

	this.throttleAsync = function(asyncCallback) {
		if (callbacks.length >= options.queueLimit) {
			return Promise.reject('Throttler reached queue limit of ' + options.queueLimit);
		}
		
		var deferred = new Promise(function(resolve, reject) {
			var callback = function() {
				return asyncCallback()
					.then(resolve)
					.catch(reject);
			};
			addCallback(callback);
		});
		return deferred;
	};
}

module.exports = Throttler;
