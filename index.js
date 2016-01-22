var _ = require('lodash');

module.exports = function(Promise) {
	var index = {};
	_.extend(index, require('./lib/cachify'));
	_.extend(index, require('./lib/throttlify'));

	if (Promise === undefined) {
		// For backward compatibility in v1.x
		return index;
	} else {
		// Monkey-patch Promise
		_.extend(Promise, index);
		return Promise;
	}
};