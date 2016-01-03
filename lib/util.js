/* jshint node: true */

var rident = /^[a-z$_][a-z$_0-9]*$/i;

function isIdentifier(str) {
    return rident.test(str);
}

function defaultFilter(name) {
    return isIdentifier(name) &&
        name.charAt(0) !== "_" &&
        name !== "constructor";
};

module.exports.isIdentifier = isIdentifier;
module.exports.defaultFilter = defaultFilter;