/* jshint node: true */

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var Promise = require('bluebird');

var LockableCache = require('./../lib/LockableCache');
var lockableCache = new LockableCache();

describe('lockableCache', function() {

	it('should call the function only once', function() {

		var func = sinon.spy(function() {
			return Promise.delay(100).then(function() {
				return Promise.resolve({randomVal: Math.random()});
			});
		});
		var key = "some-key";

		return Promise.all([
			lockableCache.callAsync(key, func),
			lockableCache.callAsync(key, func),
			lockableCache.callAsync(key, func),
			lockableCache.callAsync(key, func)
		]).spread(function(response1, response2, response3, response4) {
			expect(response1.randomVal).to.equal(response2.randomVal);
			expect(response3.randomVal).to.equal(response4.randomVal);
			expect(response1.randomVal).to.equal(response4.randomVal);

			expect(func.calledOnce).to.be.true;
		});
	});


	it('should return error to all callers', function() {

		var func = sinon.spy(function() {
			return Promise.delay(100).then(function() {
				return Promise.reject({randomVal: Math.random()});
			});
		});
		var key = "some-key";

		return Promise.all([
			lockableCache.callAsync(key, func)
				.catch(function(err) {
					return Promise.resolve({error: err});
				}),
			lockableCache.callAsync(key, func)
				.catch(function(err) {
					return Promise.resolve({error: err});
				}),
		]).spread(function(response1, response2) {
			expect(response1.error).to.exist;
			expect(response1.error).to.equal(response2.error);
			expect(func.calledOnce).to.be.true;
		});
	});

	it('should call function twice if key differs', function() {

		var func = sinon.spy(function() {
			return Promise.delay(100).then(function() {
				return Promise.resolve({randomVal: Math.random()});
			});
		});
		
		return Promise.all([
			lockableCache.callAsync("some-key", func),
			lockableCache.callAsync("some-key-2", func)
		]).spread(function(response1, response2) {
			expect(response1).to.not.equal(response2);
			expect(func.callCount).to.equal(2);
		});
	});


	it('should call function again if first call finished', function() {

		var func = sinon.spy(function() {
			return Promise.delay(100).then(function() {
				return Promise.resolve({randomVal: Math.random()});
			});
		});
		
		lockableCache.callAsync("some-key", func)
			.then(function(response1) {
				lockableCache.callAsync("some-key", func)
					.then(function(response2) {
						expect(response1).to.not.equal(response2);
						expect(func.callCount).to.equal(2);
					})
			});
	});

});