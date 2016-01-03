/* jshint node: true */

var _ = require('@dispatcher/underscore-ext');
var Throttler = require('./Throttler');
var THROTTLER_DEFAULTS = {
	concurrency: 1,
	queueLimit: 100
};

function throttlify(func, options) {
	if (typeof func !== 'function') {
		return func;
	}

	options || (options = {});

	var throttler;
	if (options.throttler instanceof Throttler) {
		throttler = options.throttler;
	} else {
		throttler = new Throttler(_.defaults(options, THROTTLER_DEFAULTS));
	}

	return _.wrap(func, function(func) {
		var args = _.values(arguments).slice(1);

		return throttler.throttleAsync(function() {
			return func.apply(options.context, args);
		});
	});
}

function throttlifyAll(target, options) {
	var throttler = new Throttler(options);

	_.each(target, function(fn, fnName) {
		target[fnName] = throttlify(fn, {
			throttler: throttler,
			context: target
		});
	});

	return target;
}

module.exports.Throttler = Throttler;
module.exports.throttlify = throttlify;
module.exports.throttlifyAll = throttlifyAll;
