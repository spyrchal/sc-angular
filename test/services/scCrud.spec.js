/// <reference path="../../typings/jasmine/jasmine.d.ts"/>
/* global inject */
/* global ngMidwayTester */

describe('scCrud', function () {
  var tester, scCrud, auth, validWorkspaceId, validTypeId, validEntityId, validEntityData;
  
  beforeEach(function () {  
    tester = ngMidwayTester('sociocortex');
    scCrud = tester.inject('scCrud');
    
    auth = { user: 'sociocortex.sebis@tum.de', password: 'sebis' };
    validWorkspaceId = 'mdx13m1l54mx'; // sc-angular-test
    validTypeId = '19iyxwraho1hf'; // sc-angular-test -> test-type; expected to have >= 1 instance
    validEntityId = 'ge28t9ra855w'; // sc-angular-test -> test-type -> <entitiy>; expected to exist
    // entity data to be used when trying to create a new entity
    validEntityData = {
      'test-attribute': 'testtesttest!',
    };
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
    
    // not yet provided by the API
    describe('#findOne', function () {
      xit('returns returns a single entity when passed valid auth details and a valid id', function (done) {
        scCrud.entities.findAll(auth, validEntityId)
        .then(function success(res) {
            expect(res).toBeDefined();
            expect(angular.isObject(res)).toBe(true);
            expect(res.id).toEqual(validEntityId);
          }, function error() {
            fail('should not reject the promise');
          })
        .finally(done);
      });
    });
    
    describe('#create', function () {
      xit('creates an entity, if provided valid auth details and valid entity data', function (done) {
        scCrud.entities.create(auth, validWorkspaceId, validEntityData)
        .then(function success(res) {
            expect(res).toBeDefined();
            expect(res).toBeUndefined();
            // TODO
          }, function error(err) {
            expect(err).toBeUndefined();
            fail('should not reject the promise');
          })
        .finally(done);
      });
    });
    
    describe('#update', function () {
      // TODO
    });
    
    describe('#remove', function () {
      // TODO
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
            done();
          }, function error() {
            fail('should not reject the promise');
          });
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
      it('returns an array of objects if passed valid auth details', function (done) {
        scCrud.users.findAll(auth)
        .then(function success(res) {
            expect(res).toBeDefined();
            expect(angular.isArray(res)).toBe(true);
            expect(res.length).toBeGreaterThan(0);
            expect(res[0].email).toEqual(jasmine.any(String));
            expect(res[0].groups).toEqual(jasmine.any(Array));
            expect(res[0].id).toEqual(jasmine.any(String));
            expect(res[0].name).toEqual(jasmine.any(String));
            expect(res[0].picture).toEqual(jasmine.any(String));
          }, function error() {
            fail('should not reject the promise');
          })
        .finally(done);
      });
    });
    
    describe('#findSelf', function () {
      it('returns the user that owns the passed auth details', function (done) {
        scCrud.users.findSelf(auth)
        .then(function success(res) {
            expect(res).toBeDefined();
            expect(res.email).toEqual(auth.user);
            expect(res.groups).toEqual(jasmine.any(Array));
            expect(res.id).toEqual(jasmine.any(String));
            expect(res.name).toEqual(jasmine.any(String));
            expect(res.picture).toEqual(jasmine.any(String));
          }, function error() {
            fail('should not reject the promise');
          })
        .finally(done);
      });
    });
  });
});
