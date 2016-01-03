/* jshint node: true */

var _ = require('@dispatcher/underscore-ext');
var LockableCache = require('./LockableCache');
var DEFAULT_OPTIONS = {
	suffix: ""
};

function cachify(func, options) {
	if (typeof func !== 'function') {
		return func;
	}

	options = _.defaults({}, options, DEFAULT_OPTIONS);

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

	options = _.defaults({}, options, DEFAULT_OPTIONS);

	_.each(target, function(fn, fnName) {
		var newFnName = fnName + options.suffix;
		target[newFnName] = cachify(fn, {
			cache: cache,
			context: target
		});
	});

	return target;
};

module.exports.LockableCache = LockableCache;
module.exports.cachify = cachify;
module.exports.cachifyAll = cachifyAll;
