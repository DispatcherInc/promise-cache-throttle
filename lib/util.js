/* jshint node: true */

var _ = require('lodash');

var rident = /^[a-z$_][a-z$_0-9]*$/i;

function isIdentifier(str) {
	return rident.test(str);
}

function defaultFilter(name) {
	return isIdentifier(name) &&
	       name.charAt(0) !== "_" &&
	       name !== "constructor";
};

function forEachFilteredFunction(target, options, callback) {

	_.each(target, function(fn, fnName) {
		
		if (typeof fn !== 'function') {
			return;
		}

		var passesDefaultFilter = options.filter === defaultFilter
			? true : defaultFilter(fnName);

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

		callback(fn, fnName);
	});
};

module.exports.isIdentifier = isIdentifier;
module.exports.defaultFilter = defaultFilter;
module.exports.forEachFilteredFunction = forEachFilteredFunction;