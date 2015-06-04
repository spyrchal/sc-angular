/// <reference path="../../typings/jasmine/jasmine.d.ts"/>
/* global inject */
/* global ngMidwayTester */

describe('scCrud', function () {
  var tester, scCrud, auth, validTypeId;
  
  beforeEach(function () {  
    tester = ngMidwayTester('sociocortex');
    scCrud = tester.inject('scCrud');
    
    auth = { user: 'sociocortex.sebis@tum.de', password: 'sebis' };
    validTypeId = '18mf8ga1kc56b'; // Northwind -> Product; expected to have >= 1 instance
  });
  
  afterEach(function() {
    tester.destroy();
    tester = null;
  });
  
  describe('entities', function () {
    describe('#findAll', function () {
      it('returns returns a sane array of entities if passed valid auth details and a valid type id', function (done) {
        scCrud.entities.findAll(auth, validTypeId)
        .then(function success(res) {
            expect(res).toBeDefined();
            expect(angular.isArray(res)).toBe(true);
            expect(res.length).toBeGreaterThan(0);
            expect(res[0].id).toEqual(jasmine.any(String));
            expect(res[0].type).toBeDefined();
            expect(res[0].type.uid).toBeDefined();
            expect(res[0].type.uid).toEqual('types/' + validTypeId);
          }, function error() {
            fail('should not reject the promise');
          })
        .finally(done);
      });
    });
  });
  
  describe('groups', function () {
    describe('#findAll', function () {
      it('returns returns an array of objects if passed valid auth details', function (done) {
        scCrud.groups.findAll(auth)
        .then(function success(res) {
            expect(res).toBeDefined();
            expect(angular.isArray(res)).toBe(true);
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
            expect(angular.isArray(res)).toBe(true);
            expect(res.length).toBeGreaterThan(0);
          }, function error() {
            fail('should not reject the promise');
          })
        .finally(done);
      });
      
      it('returns returns an enriched array of objects if parameter includeAttributes is truthy', function (done) {
        scCrud.types.findAll(auth, null, true)
        .then(function success(res) {
            expect(res).toBeDefined();
            expect(angular.isArray(res)).toBe(true);
            expect(res.length).toBeGreaterThan(0);
            expect(res[0].attributes).toBeDefined();
            expect(angular.isArray(res[0].attributes)).toBe(true);
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

      it('includes an array of attributes if parameter includeAttributes is truthy', function (done) {
        scCrud.types.findOne(auth, validTypeId, true)
        .then(function success(res) {
            expect(res).toBeDefined();
            expect(res.attributes).toBeDefined();
            expect(res.attributes).toEqual(jasmine.any(Array));
          }, function error() {
            fail('should not reject the promise');
          })
        .finally(done);
      });
    });
  });
  
  describe('users', function () {
    describe('#findAll', function () {
      it('returns returns an array of objects if passed valid auth details', function (done) {
        scCrud.users.findAll(auth)
        .then(function success(res) {
            expect(res).toBeDefined();
            expect(angular.isArray(res)).toBe(true);
            expect(res.length).toBeGreaterThan(0);
            expect(res[0].picture).toEqual(jasmine.any(String));
            expect(res[0].id).toEqual(jasmine.any(String));
            expect(res[0].email).toEqual(jasmine.any(String));
            expect(res[0].name).toEqual(jasmine.any(String));
            expect(res[0].groups).toEqual(jasmine.any(Array));
          }, function error() {
            fail('should not reject the promise');
          })
        .finally(done);
      });
    });
  });
});
