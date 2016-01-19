/* jshint node: true */

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var Promise = require('bluebird');
var _ = require('lodash');

var throttlify = require('./../lib/throttlify');

describe('throttlify', function() {

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
			})
		};
	});

	describe('throttlifyAll', function() {
		it('should work', function() {
			throttlify.throttlifyAll(API);

			var start = new Date().getTime();
			return Promise.all([
				API.getUsersAsync(),
				API.getUsersAsync(),
				API.getUsersAsync(),
				API.getUsersAsync()
			]).spread(function(response1, response2, response3, response4) {
				var end = new Date().getTime();
				var diff = end - start;
				expect(diff >= 400 && diff < 500).to.be.true;

				expect(response1).to.not.equal(response2);
				expect(response3).to.not.equal(response4);
				expect(response1).to.not.equal(response4);
			});
		});

		it('should accept suffix', function() {
			throttlify.throttlifyAll(API, {
				suffix: 'Throttled'
			});

			expect(API.getUsersAsyncThrottled).to.exist;
			expect(API.getDriversAsyncThrottled).to.exist;
			expect(API.getDriverAsyncThrottled).to.exist;

			var start = new Date().getTime();
			return Promise.all([
				API.getUsersAsyncThrottled(),
				API.getUsersAsyncThrottled(),
				API.getUsersAsyncThrottled()
			]).spread(function(response1, response2, response3) {
				var end = new Date().getTime();
				var diff = end - start;
				expect(diff >= 300 && diff < 400).to.be.true;

				expect(API.getUsersAsync.callCount).to.be.eql(3);
			});
		});

		it('should support filtering', function() {
			throttlify.throttlifyAll(API, {
				suffix: 'Throttled',
				filter: function(fnName, fn, target, passesDefaultFilter) {
					return _.includes(['getUsersAsync', 'getDriversAsync'], fnName);
				}
			});

			expect(API.getUsersAsyncThrottled).to.exist;
			expect(API.getDriversAsyncThrottled).to.exist;
			expect(API.getDriverAsyncThrottled).to.not.exist;
		});

		it('should not apply to special functions by default', function() {
			API.constructor = function() {};
			API._specialFunction = function() {};

			throttlify.throttlifyAll(API, {
				suffix: 'Throttled'
			});

			expect(API.getUsersAsyncThrottled).to.exist;
			expect(API.constructorThrottled).to.not.exist;
			expect(API._specialFunctionThrottled).to.not.exist;
		});
	});

});