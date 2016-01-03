/* jshint node: true */

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var Promise = require('bluebird');
var _ = require('@dispatcher/underscore-ext');

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
			})
		};
	});

	describe('cachifyAll', function() {
		it('should work', function() {
			cachify.cachifyAll(API);

			return Promise.all([
				API.getUsersAsync(),
				API.getUsersAsync(),
				API.getUsersAsync(),
				API.getUsersAsync()
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

		it('should support filtering', function() {
			cachify.cachifyAll(API, {
				suffix: 'Cached',
				filter: function(fnName, fn, target) {
					return _.includes(['getUsersAsync', 'getDriversAsync'], fnName);
				}
			});

			expect(API.getUsersAsyncCached).to.exist;
			expect(API.getDriversAsyncCached).to.exist;
			expect(API.getDriverAsyncCached).to.not.exist;
		})
	});

});