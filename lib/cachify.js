/* jshint node: true */

var _ = require('lodash');
var util = require('./util');
var LockableCache = require('./LockableCache');

var DEFAULT_OPTIONS = {
	suffix: "",
	filter: util.defaultFilter,
	resolvers: []
};

function parseOptions(options) {
	options = _.defaults({}, options, DEFAULT_OPTIONS);

	if (!(options.cache instanceof LockableCache)) {
		options.cache = new LockableCache(options);
	}

	return options;
}

function resolveArguments(args, resolvers) {
	return _.map(args, function(arg, index) {
		return resolvers[index] ? resolvers[index](arg) : arg;
	});
}

function cachify(func, options) {
	if (typeof func !== 'function') {
		throw new Error("Must be a function");
	}

	options = parseOptions(options);

	return _.wrap(func, function(func) {
		var args = _.values(arguments).slice(1);
		var resolvedArgs = resolveArguments(args, options.resolvers);
		var callKey = options.keyPrefix + "(" + resolvedArgs.join(",") + ")";

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

module.exports.cachify = cachify;
module.exports.cachifyAll = cachifyAll;
module.exports.cachify.LockableCache = LockableCache;
