/* jshint node: true */

var _ = require('@dispatcher/underscore-ext');
var util = require('./util');
var Throttler = require('./Throttler');

var DEFAULT_OPTIONS = {
	concurrency: 1,
	queueLimit: 100,
	suffix: "",
	filter: util.defaultFilter
};

function parseOptions(options) {
	options = _.defaults({}, options, DEFAULT_OPTIONS);

	if (!options.throttler) {
		options.throttler = new Throttler(options);
	}

	return options;
}

function throttlify(func, options) {
	if (typeof func !== 'function') {
		return func;
	}

	options = parseOptions(options);

	return _.wrap(func, function(func) {
		var args = _.values(arguments).slice(1);

		return options.throttler.throttleAsync(function() {
			return func.apply(options.context, args);
		});
	});
}

function throttlifyAll(target, options) {
	options = parseOptions(options);
	
	if (!options.context) {
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

		target[newFnName] = throttlify(fn, options);
	});

	return target;
}

module.exports.Throttler = Throttler;
module.exports.throttlify = throttlify;
module.exports.throttlifyAll = throttlifyAll;
