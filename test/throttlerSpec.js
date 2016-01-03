/* jshint node: true */

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var Promise = require('bluebird');

var Throttler = require('./../lib/Throttler');

describe('throttler', function() {

	it('should work with concurrency of 3', function() {
		var throttler = new Throttler({
			concurrency: 3
		});

		var func = sinon.spy(function() {
			return Promise.delay(100).then(function() {
				return Promise.resolve({randomVal: Math.random()});
			});
		});
		
		var start = new Date().getTime();
		return Promise.all([
			throttler.throttleAsync(func),
			throttler.throttleAsync(func),
			throttler.throttleAsync(func),
			throttler.throttleAsync(func),
			throttler.throttleAsync(func),
			throttler.throttleAsync(func)
		]).spread(function(response1, response2, response3, response4) {
			var end = new Date().getTime();
			var diff = end - start;
			expect(diff >= 100).to.be.true;
		});
	});

	it('should work with concurrency of 1', function() {
		var throttler = new Throttler({
			concurrency: 1
		});

		var func = sinon.spy(function() {
			return Promise.delay(100).then(function() {
				return Promise.resolve({randomVal: Math.random()});
			});
		});
		
		var start = new Date().getTime();
		return Promise.all([
			throttler.throttleAsync(func),
			throttler.throttleAsync(func),
			throttler.throttleAsync(func),
			throttler.throttleAsync(func),
			throttler.throttleAsync(func),
			throttler.throttleAsync(func)
		]).spread(function(response1, response2, response3, response4) {
			var end = new Date().getTime();
			var diff = end - start;
			expect(diff >= 500).to.be.true;
		});
	});

	it('should honor queue limits', function() {
		var throttler = new Throttler({
			concurrency: 1,
			queueLimit: 2
		});

		var func = sinon.spy(function() {
			return Promise.delay(100).then(function() {
				return Promise.resolve({randomVal: Math.random()});
			});
		});

		var callThrottler = function(func) {
			return throttler.throttleAsync(func)
				.catch(function(err) {
					return Promise.resolve({error: err});
				});
		};
		
		var start = new Date().getTime();
		return Promise.all([
			callThrottler(func),
			callThrottler(func),
			callThrottler(func),
			callThrottler(func)
		]).spread(function(response1, response2, response3, response4) {
			var end = new Date().getTime();
			var diff = end - start;
			expect(diff < 400).to.be.true;
			expect(response4.error).to.exist;
			expect(response4.error).to.equal("Throttler reached queue limit of 2");
		});
	});
});