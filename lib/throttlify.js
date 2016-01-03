/* jshint node: true */

var _ = require('@dispatcher/underscore-ext');
var Throttler = require('./Throttler');
var THROTTLER_DEFAULTS = {
	concurrency: 1,
	queueLimit: 100
};

function throttlify(obj, fnName, options) {
	if (typeof obj[fnName] !== 'function') {
		return;
	}

	options || (options = {});

	var throttler;
	if (options.throttler instanceof Throttler) {
		throttler = options.throttler;
	} else {
		throttler = new Throttler(_.defaults(options, THROTTLER_DEFAULTS));
	}

	obj[fnName] = _.wrap(obj[fnName], function(func) {
		var args = _.values(arguments).slice(1);

		return throttler.throttleAsync(function() {
			return func.apply(obj, args);
		});
	});
}

function throttlifyAll(obj, options) {
	var throttler = new Throttler(options);

	_.each(obj, function(fn, fnName) {
		throttlify(obj, fnName, {
			throttler: throttler
		});
	});

	return obj;
}

module.exports.Throttler = Throttler;
module.exports.throttlify = throttlify;
module.exports.throttlifyAll = throttlifyAll;
