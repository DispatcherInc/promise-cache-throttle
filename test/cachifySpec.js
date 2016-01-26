/* jshint node: true */

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var Promise = require('bluebird');
var _ = require('lodash');

var cachify = require('./../lib/cachify');

describe('cachify', function() {

	var API;

	beforeEach(function() {
		API = {
			getUsersAsync: sinon.spy(function() { 
				return Promise.delay(100).then(function() {
					return 'users:' + Math.random();
				});
			}),
			getDriversAsync: sinon.spy(function() {
				return Promise.delay(100).then(function() {
					return 'drivers:' + Math.random();
				});
			}),
			getDriverAsync: sinon.spy(function(driverId) {
				return Promise.delay(100).then(function() {
					return 'driver:' + driverId + ":" + Math.random();
				});
			}),
			getUserAsync: sinon.spy(function(userId) {
				return Promise.delay(100).then(function() {
					return 'user:' + userId + ":" + Math.random();
				});
			}),
		};
	});

	describe('cachifyAll', function() {
		it('should work', function() {
			cachify.cachifyAll(API);

			return Promise.all([
				API.getUsersAsync(),
				API.getUsersAsync(),
				API.getUsersAsync(),
				API.getUsersAsync(),
			]).spread(function(response1, response2, response3, response4) {
				expect(response1).to.equal(response2);
				expect(response3).to.equal(response4);
				expect(response1).to.equal(response4);
			});
		});

		it('should accept suffix', function() {
			cachify.cachifyAll(API, {
				suffix: 'Cached'
			});

			expect(API.getUsersAsyncCached).to.exist;
			expect(API.getDriversAsyncCached).to.exist;
			expect(API.getDriverAsyncCached).to.exist;

			return Promise.all([
				API.getUsersAsyncCached(),
				API.getUsersAsyncCached(),
				API.getUsersAsyncCached()
			]).spread(function(response1, response2, response3) {
				expect(API.getUsersAsync.calledOnce).to.be.true;
			});
		});

		it('should cache per unique call', function() {
			cachify.cachifyAll(API, {
				suffix: 'Cached'
			});
			return Promise.all([
				API.getUserAsyncCached('1'),
				API.getUserAsyncCached('1'),
				API.getDriverAsyncCached('1'),
				API.getDriverAsyncCached('2')
			]).spread(function(response1, response2, response3, response4) {
				expect(API.getUserAsync.calledOnce).to.be.true;
				expect(API.getDriverAsync.callCount).to.eql(2);
				expect(response1).to.eql(response2);
				expect(response3).to.not.eql(response4);
			});
		});

		it('should support filtering', function() {
			cachify.cachifyAll(API, {
				suffix: 'Cached',
				filter: function(fnName, fn, target, passesDefaultFilter) {
					return _.includes(['getUsersAsync', 'getDriversAsync'], fnName);
				}
			});

			expect(API.getUsersAsyncCached).to.exist;
			expect(API.getDriversAsyncCached).to.exist;
			expect(API.getDriverAsyncCached).to.not.exist;
		});

		it('should not apply to special functions by default', function() {
			API.constructor = function() {};
			API._specialFunction = function() {};

			cachify.cachifyAll(API, {
				suffix: 'Cached'
			});

			expect(API.getUsersAsyncCached).to.exist;
			expect(API.constructorCached).to.not.exist;
			expect(API._specialFunctionCached).to.not.exist;
		});

		it('should support resolvers', function() {
			API.specialFunctionAsync = sinon.spy(function(user, driver, str, num, bool) {
				var args = arguments;
				return Promise.delay(100).then(function() {
					return Promise.resolve(args);
				});
			});
			cachify.cachifyAll(API, {
				context: API,
				suffix: 'Cached',
				resolvers: {
					"specialFunctionAsync": [(user) => { return user.id }, (driver) => { return driver.driverId }, String, Number, Boolean]
				}
			});

			Promise.all([
				API.specialFunctionAsyncCached({id: "1", name: "Jen"}, {driverId: "1", name: "Tom"}, "SomeString", 12.34, true),
				API.specialFunctionAsyncCached({id: "1", name: "Alice"}, {driverId: "1", name: "Brian"}, "SomeString", 12.34, true),
				API.specialFunctionAsyncCached({id: "2", name: "Jess"}, {driverId: "2", name: "Tom"}, "SomeString", 12.34, true),
				API.specialFunctionAsyncCached({id: "2", name: "Lucie"}, {driverId: "2", name: "Ted"}, "SomeString", 12.34, true),
			]).spread(function(response1, response2, response3, response4) {
				expect(API.specialFunctionAsync.callCount).to.eql(2);
				expect(response1[0].name).to.eql("Jen");
				expect(response2[0].name).to.eql(response1[0].name);
				expect(response1[1].name).to.eql("Tom");
				expect(response2[1].name).to.eql(response1[1].name);
				expect(response3[0].name).to.eql("Jess");
				expect(response4[0].name).to.eql(response3[0].name);
				expect(response3[1].name).to.eql("Tom");
				expect(response4[1].name).to.eql(response3[1].name);
			});
		});
	});

});