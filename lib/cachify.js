/* jshint node: true */

var _ = require('@dispatcher/underscore-ext');
var LockableCache = require('./LockableCache');

function cachify(func, options) {
	if (typeof func !== 'function') {
		return func;
	}

	options || (options = {});

	var cache;
	if (options.cache instanceof LockableCache) {
		cache = options.cache;
	} else {
		cache = new LockableCache(options);
	}

	return _.wrap(func, function(func) {
		var args = _.values(arguments).slice(1);
		var callKey = fnName + "(" + args.join(",") + ")";

		return cache.callAsync(callKey, function() {
			return func.apply(options.context, args);
		});
	});
}

function cachifyAll(target, options) {
	var cache = new LockableCache(options);

	_.each(target, function(fn, fnName) {
		target[fnName] = cachify(fn, {
			cache: cache,
			context: target
		});
	});

	return target;
};

module.exports.LockableCache = LockableCache;
module.exports.cachify = cachify;
module.exports.cachifyAll = cachifyAll;
