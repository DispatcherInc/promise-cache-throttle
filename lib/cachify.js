/* jshint node: true */

var _ = require('@dispatcher/underscore-ext');
var LockableCache = require('./LockableCache');

function cachify(obj, fnName, options) {
	if (typeof obj[fnName] !== 'function') {
		return;
	}

	options || (options = {});

	var cache;
	if (options.cache instanceof LockableCache) {
		cache = options.cache;
	} else {
		cache = new LockableCache(options);
	}

	obj[fnName] = _.wrap(obj[fnName], function(func) {
		var args = _.values(arguments).slice(1);
		var callKey = fnName + "(" + args.join(",") + ")";

		return cache.callAsync(callKey, function() {
			return func.apply(obj, args);
		});
	});
}

function cachifyAll(obj, options) {
	var cache = new LockableCache(options);

	_.each(obj, function(fn, fnName) {
		cachify(obj, fnName, {
			cache: cache
		});
	});

	return obj;
};

module.exports.LockableCache = LockableCache;
module.exports.cachify = cachify;
module.exports.cachifyAll = cachifyAll;
