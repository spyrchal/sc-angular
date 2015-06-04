/// <reference path="../../typings/jasmine/jasmine.d.ts"/>
/* global inject */
/* global ngMidwayTester */

describe('scCrud', function () {
  var tester, scCrud, auth;
  
  beforeEach(function () {  
    tester = ngMidwayTester('sociocortex');
    scCrud = tester.inject('scCrud');
    auth = { user: 'sociocortex.sebis@tum.de', password: 'sebis' };
  });
  
  afterEach(function() {
    tester.destroy();
    tester = null;
  });
  
  describe('groups', function () {
    describe('#findAll', function () {
      it('returns returns an array of objects if passed valid auth details', function (done) {
        scCrud.groups.findAll(auth)
        .then(function success(res) {
          expect(res).toBeDefined();
          expect(res.data).toBeDefined();
          expect(angular.isArray(res.data)).toBe(true);
        }, function error() {
          fail('should not reject the promise');
        })
        .finally(done);
      });
    });
  });
    
  describe('types', function () {
    describe('#findAll', function () {
      it('returns an error when the parameter auth is missing', function (done) {
        scCrud.types.findAll()
        .then(function success() {
          fail('should not resolve the promise');
        }, function error(err) {
          expect(angular.isObject(err)).toBe(true);
          expect(err.message).toEqual(jasmine.any(String));
        })
        .finally(done);
      });
      
      it('returns returns an array of objects if passed valid auth details', function (done) {
        scCrud.types.findAll(auth)
        .then(function success(res) {
          expect(res).toBeDefined();
          expect(res.data).toBeDefined();
          expect(angular.isArray(res.data)).toBe(true);
        }, function error() {
          fail('should not reject the promise');
        })
        .finally(done);
      });
    });
    
    describe('#findOne', function () {
      it('returns an error if no id is provided', function (done) {
        scCrud.types.findOne(auth)
        .then(function success() {
          fail('should not resolve the promise');
        }, function error(err) {
          expect(angular.isObject(err)).toBe(true);
          expect(err.message).toEqual(jasmine.any(String));
        })
        .finally(done);
      });
    });
  });
});
