/* jshint node: true */

var _ = require('lodash');
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

	if (!(options.throttler instanceof Throttler)) {
		options.throttler = new Throttler(options);
	}

	return options;
}

function throttlify(func, options) {
	if (typeof func !== 'function') {
		throw new Error("Must be a function");
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

	if (typeof options.context !== 'object') {
		options.context = target;
	}

	util.forEachFilteredFunction(target, options, function(fn, fnName) {
		var newFnName = fnName + options.suffix;
		target[newFnName] = throttlify(fn, options);
	});

	return target;
}

module.exports.Throttler = Throttler;
module.exports.throttlify = throttlify;
module.exports.throttlifyAll = throttlifyAll;
