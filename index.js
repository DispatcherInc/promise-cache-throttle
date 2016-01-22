var _ = require('@dispatcher/underscore-ext');

module.exports = function(Promise) {
	_.extend(Promise, require('./lib/cachify'));
	_.extend(Promise, require('./lib/throttlify'));
	return Promise;
};