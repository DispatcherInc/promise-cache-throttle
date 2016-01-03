/* jshint node: true */

var _ = require('@dispatcher/underscore-ext');
var LockableCache = require('./LockableCache');

var DEFAULT_OPTIONS = {
	suffix: ""
};

function parseOptions(options) {
	options = _.defaults({}, options, DEFAULT_OPTIONS);

	if (!options.cache) {
		options.cache = new LockableCache(options);
	}

	if (!options.context) {
		options.context = target;
	}

	return options;
}

function cachify(func, options) {
	if (typeof func !== 'function') {
		return func;
	}

	options = parseOptions(options);

	return _.wrap(func, function(func) {
		var args = _.values(arguments).slice(1);
		var callKey = options.keyPrefix + "(" + args.join(",") + ")";

		return options.cache.callAsync(callKey, function() {
			return func.apply(options.context, args);
		});
	});
}

function cachifyAll(target, options) {
	var cache = new LockableCache(options);

	options = parseOptions(options);

	_.each(target, function(fn, fnName) {

		if (typeof options.filter === 'function') {
			var passes = options.filter(fnName, fn, target);
			if (!passes) {
				return;
			}
		}

		var newFnName = fnName + options.suffix;
		if (newFnName !== fnName && target[newFnName]) {
			throw new Error("Property already exists '" + newFnName + "'");
		}

		target[newFnName] = cachify(fn, _.extend({}, options, {
			keyPrefix: newFnName
		});
	});

	return target;
};

module.exports.LockableCache = LockableCache;
module.exports.cachify = cachify;
module.exports.cachifyAll = cachifyAll;
