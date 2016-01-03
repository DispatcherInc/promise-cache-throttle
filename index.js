var _ = require('@dispatcher/underscore-ext');

var index = {};
_.extend(index, require('./lib/cachify'));
_.extend(index, require('./lib/throttlify'));

module.exports = index;