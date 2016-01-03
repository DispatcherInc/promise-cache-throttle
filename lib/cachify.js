/* jshint node: true */

var _ = require('@dispatcher/underscore-ext');
var util = require('./util');
var LockableCache = require('./LockableCache');

var DEFAULT_OPTIONS = {
	suffix: "",
	filter: util.defaultFilter
};

function parseOptions(options) {
	options = _.defaults({}, options, DEFAULT_OPTIONS);

	if (!(options.cache instanceof LockableCache)) {
		options.cache = new LockableCache(options);
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
	options = parseOptions(options);

	if (typeof options.context !== 'object') {
		options.context = target;
	}

	_.each(target, function(fn, fnName) {
		
		var passesDefaultFilter = options.filter === util.defaultFilter
		    ? true : util.defaultFilter(fnName);

		if (typeof options.filter === 'function') {
			var passes = options.filter(fnName, fn, target, passesDefaultFilter);
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
		}));
	});

	return target;
};

module.exports.LockableCache = LockableCache;
module.exports.cachify = cachify;
module.exports.cachifyAll = cachifyAll;
