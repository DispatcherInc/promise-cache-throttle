/* jshint node: true */

var _ = require('lodash');
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
		throw new Error("Must be a function");
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
	
	util.forEachFilteredFunction(target, options, function(fn, fnName) {
		var newFnName = fnName + options.suffix;
		target[newFnName] = cachify(fn, _.extend({}, options, {
			keyPrefix: fnName
		}));
	});

	return target;
};

module.exports.LockableCache = LockableCache;
module.exports.cachify = cachify;
module.exports.cachifyAll = cachifyAll;
