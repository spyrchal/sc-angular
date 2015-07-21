/// <reference path="../../typings/angularjs/angular.d.ts"/>
/// <reference path="../../typings/jasmine/jasmine.d.ts"/>
/// <reference path="../../typings/lodash/lodash.d.ts"/>
/* global inject */
/* global ngMidwayTester */

describe('scCrud', function () {
  var tester, scCrud, auth,
      validWorkspaceId, validTypeId, validEntityId, validEntityData,
      linkTestTypeId, linkTestEntityId;
  
  beforeEach(function () {  
    tester = ngMidwayTester('sociocortex');
    scCrud = tester.inject('scCrud');
    
    auth = { user: 'sociocortex.sebis@tum.de', password: 'sebis' };
    validWorkspaceId = 'mdx13m1l54mx'; // sc-angular-test
    validTypeId = '19iyxwraho1hf'; // sc-angular-test -> test-type; expected to have >= 1 instance
    validEntityId = 'ge28t9ra855w'; // sc-angular-test -> test-type -> <entitiy>; expected to exist
    // entity data to be used when trying to create a new entity
    validEntityData = {
      name: 'test' + Math.random().toString().substr(2), // random name
      attributes: [{
        'name': 'test-attribute',
        'values': ['testx'],
        'type': 'text'
      }]
    };
    
    linkTestTypeId = '12xe7z0340vno'; // type sc-angular-test.test-link-1
    linkTestEntityId = 'crgp2ye1hak1'; // entity named "1"
  });

  afterEach(function() {
    tester.destroy();
    tester = null;
  });
  
  describe('entities', function () {
    describe('#findAll', function () {
      it('returns returns an array of entities if passed valid auth details and a valid type id', function (done) {
        scCrud.entities
        .findAll(auth, validTypeId)
        .then(function success(res) {
          expect(res).toBeDefined();
          expect(res).toEqual(jasmine.any(Array));
          expect(res.length).toBeGreaterThan(0);
          expect(res[0].uid).toEqual(jasmine.any(String));
          
          // as of 2015-06-21, GET /types/:id/entities seems to no longer include (arguably redundant) type details in the result objects
          // expect(res[0].type).toBeDefined();
          // expect(res[0].type.uid).toBeDefined();
          // expect(res[0].type.uid).toEqual('types/' + validTypeId);
        }, function error(err) {
          expect(err).toBeUndefined();
          fail('should not reject the promise');
        })
        .finally(done);
      });
      
      it('includes version and attribute details if option includeDetails is set true', function (done) {
        scCrud.entities
        .findAll(auth, validTypeId, { includeDetails: true })
        .then(function success(res) {
          expect(res).toBeDefined();
          expect(res).toEqual(jasmine.any(Array));
          expect(res.length).toBeGreaterThan(0);
          expect(res[0].attributes).toEqual(jasmine.any(Array));
          expect(res[0].versions).toEqual(jasmine.any(Array));
          expect(res[0].versions.length).toBeGreaterThan(0);
          expect(res[0].versions[0].action).toEqual(jasmine.any(String));
        }, function error(err) {
          expect(err).toBeUndefined();
          fail('should not reject the promise');
        })
        .finally(done);
      });
      
      it('includes applies scUtils#unwrapAttributes if option unwrap is set true', function (done) {
        scCrud.entities
        .findAll(auth, validTypeId, { includeDetails: true, unwrap: true })
        .then(function success(res) {
          expect(res).toBeDefined();
          expect(res).toEqual(jasmine.any(Array));
          expect(res.length).toBeGreaterThan(0);
          expect(res[0].attributes).toEqual(jasmine.any(Object));
          expect(res[0].attributes['test-attribute']).toEqual('testx');
        }, function error(err) {
          expect(err).toBeUndefined();
          fail('should not reject the promise');
        })
        .finally(done);
      });
      
      it('resolves references in attributes if option resolveReferences is set true', function (done) {
        scCrud.entities
        .findAll(auth, linkTestTypeId, { resolveReferences: true })
        .then(function success(res) {
          expect(res.length).toEqual(1);
          
          // c.f. #findOne test case "recursively resolves all link references if passed a flag to do so"
          expect(res[0].attributes[1].resolved[0].attributes[0].resolved[0].name).toEqual('121');
        }, function error(err) {
          expect(err).toBeUndefined();
          fail('should not reject the promise');
        })
        .finally(done);
      });
    });
    
    // not yet provided by the API
    describe('#findOne', function () {
      it('returns returns a single entity when passed valid auth details and a valid id', function (done) {
        scCrud.entities
        .findOne(auth, validEntityId)
        .then(function success(res) {
          expect(res).toBeDefined();
          expect(res.uid).toEqual('entities/' + validEntityId);
        }, function error(err) {
          expect(err).toBeUndefined();
          fail('should not reject the promise');
        })
        .finally(done);
      });
      
      it('recursively resolves all link references if option resolveReferences is set true', function (done) {
        scCrud.entities
        .findOne(auth, linkTestEntityId, { resolveReferences: true })
        .then(function success(res) {
          expect(res).toBeDefined();
          expect(res.uid).toEqual('entities/' + linkTestEntityId);

          // first level
          expect(res.attributes.length).toEqual(2);
          expect(res.attributes[0].type).toEqual('link');
          expect(res.attributes[0].resolved).toEqual(jasmine.any(Array));
          expect(res.attributes[0].resolved.length).toEqual(1);
          expect(res.attributes[0].resolved[0].name).toEqual('11');
          expect(res.attributes[0].resolved[0].isCircular).toBeFalsy();
          var lv11 = res.attributes[0].resolved[0];
          
          expect(res.attributes[1].type).toEqual('link');
          expect(res.attributes[1].resolved).toEqual(jasmine.any(Array));
          expect(res.attributes[1].resolved.length).toEqual(1);
          expect(res.attributes[1].resolved[0].name).toEqual('12');
          expect(res.attributes[1].resolved[0].isCircular).toBeFalsy();
          var lv12 = res.attributes[1].resolved[0];

          // second level
          expect(lv11.attributes.length).toEqual(2);
          expect(lv11.attributes[0].type).toEqual('link');
          expect(lv11.attributes[0].resolved).toEqual(jasmine.any(Array));
          expect(lv11.attributes[0].resolved.length).toEqual(1);
          expect(lv11.attributes[0].resolved[0].name).toEqual('111');
          expect(lv11.attributes[0].resolved[0].isCircular).toBeFalsy();
          
          expect(lv11.attributes[1].type).toEqual('link');
          expect(lv11.attributes[1].resolved).toEqual(jasmine.any(Array));
          expect(lv11.attributes[1].resolved.length).toEqual(3);
          expect(lv11.attributes[1].resolved[0].name).toEqual('112a');
          expect(lv11.attributes[1].resolved[1].name).toEqual('112b');
          expect(lv11.attributes[1].resolved[2].name).toEqual('112c');
          
          expect(lv12.attributes.length).toEqual(2);
          expect(lv12.attributes[0].type).toEqual('link');
          expect(lv12.attributes[0].resolved).toEqual(jasmine.any(Array));
          expect(lv12.attributes[0].resolved[0].name).toEqual('121');
          expect(lv12.attributes[0].resolved[0].isCircular).toBeFalsy();
          expect(lv12.attributes[1].resolved[0].isCircular).toBeTruthy();
        }, function error(err) {
          expect(err).toBeUndefined();
          fail('should not reject the promise');
        })
        .finally(done);
      });
    });
    
    var previouslyCreatedEntity;
    describe('#create', function () {
      it('creates an entity, if provided valid auth details and valid entity data', function (done) {
        scCrud.entities
        .create(auth, validWorkspaceId, validTypeId, validEntityData)
        .then(function createSuccess(res) {
          expect(res).toBeDefined();
          expect(res.uid).toEqual(jasmine.any(String));
          
          // the "id" field has disappeared on 2015-06-21
          // expect(res.id).toEqual(jasmine.any(String));
          
          expect(res.attributes).toEqual(validEntityData.attributes);
          expect(res.versions).toEqual(jasmine.any(Array));
          expect(res.versions.length).toEqual(1);
          expect(res.type.uid).toContain(validTypeId);
          expect(res.workspace.uid).toContain(validWorkspaceId);
          previouslyCreatedEntity = res;
        }, function createError(err) {
          expect(err).toBeUndefined();
          fail('should not reject the promise');
        })
        .finally(done);
      });
    });
    
    describe('#update', function () {
      it('is able to change a newly created entity and adds a new version', function (done) {
        expect(previouslyCreatedEntity).toBeDefined();
        var changedEntity = _.cloneDeep(previouslyCreatedEntity);
        changedEntity.attributes[0].values = ['changed', 'a lot'];
        
        scCrud.entities
        .update(auth, changedEntity)
        .then(function createSuccess(res) {
          expect(res).toBeDefined();
          expect(res.uid).toEqual(previouslyCreatedEntity.uid);
          expect(res.attributes).toEqual(changedEntity.attributes);
          expect(res.versions).toEqual(jasmine.any(Array));
          expect(res.versions.length).toEqual(2);
          previouslyCreatedEntity = res;
        }, function createError(err) {
          expect(err).toBeUndefined();
          fail('should not reject the promise');
        })
        .finally(done);
      });

      it('supports the unwrapped attribute notation', function (done) {
        expect(previouslyCreatedEntity).toBeDefined();
        var changedEntity = _.cloneDeep(previouslyCreatedEntity);
        changedEntity.attributes = {
            'test-attribute': ['changed', 'once', 'more']
        };
        
        scCrud.entities
        .update(auth, changedEntity, { unwrap: true })
        .then(function createSuccess(res) {
          expect(res).toBeDefined();
          expect(res.uid).toEqual(previouslyCreatedEntity.uid);
          expect(res.attributes['test-attribute']).toEqual(['changed', 'once', 'more']);
          expect(res.versions).toEqual(jasmine.any(Array));
          expect(res.versions.length).toEqual(3);
          previouslyCreatedEntity = res;
        }, function createError(err) {
          expect(err).toBeUndefined();
          fail('should not reject the promise');
        })
        .finally(done);
      });
    });
    
    describe('#remove', function () {
      it('can be used to remove a previously created entity', function (done) {
        scCrud.entities
        .remove(auth, previouslyCreatedEntity)
        .then(function removeSuccess(success) {
          expect(success).toBe(true);
        }, function removeError(err) {
          expect(err).toBeUndefined();
          fail('should not reject the promise');
        })
        .finally(done);
      });
    });
  });
  
  describe('groups', function () {
    describe('#findAll', function () {
      it('returns returns an array of objects if passed valid auth details', function (done) {
        scCrud.groups
        .findAll(auth)
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
        scCrud.types
        .findAll()
        .then(function success() {
          fail('should not resolve the promise');
        }, function error(err) {
          expect(angular.isObject(err)).toBe(true);
          expect(err.message).toEqual(jasmine.any(String));
        })
        .finally(done);
      });
      
      it('returns returns an array of objects if passed valid auth details', function (done) {
        scCrud.types
        .findAll(auth)
        .then(function success(res) {
          expect(res).toBeDefined();
          expect(angular.isArray(res)).toBe(true);
          expect(res.length).toBeGreaterThan(0);
        }, function error() {
          fail('should not reject the promise');
        })
        .finally(done);
      });
      
      it('returns returns an enriched array of objects if the flags includeDetails & resolveProperties are set', function (done) {
        scCrud.types
        .findAll(auth, null, { includeDetails: true, resolveProperties: true })
        .then(function success(res) {
          expect(res).toBeDefined();
          expect(angular.isArray(res)).toBe(true);
          expect(res.length).toBeGreaterThan(0);
          
          var foundTestType = false;
          for (var i = 0; i < res.length; i++) {
            if (res[i].uid === 'types/' + validTypeId) {
              expect(res[i].properties).toBeDefined();
              expect(res[i].properties).toEqual(jasmine.any(Array));
              expect(res[i].properties.length).toBeGreaterThan(0);
              expect(res[i].properties[0].versions).toBeDefined();
              
              foundTestType = true;
              break;
            }
          }
          
          if (!foundTestType) {
            fail('expected dummy type ' + validTypeId + ' to be contained in the list of types');
          }
          
          done();
        }, function error(err) {
          expect(err).toBeUndefined();
          fail('should not reject the promise');
        })
        .finally(done);
      }, 20000); // increase timeout to 20s; this might take some time
    });
    
    describe('#findOne', function () {
      it('returns an error if no id is provided', function (done) {
        scCrud.types
        .findOne(auth)
        .then(function success() {
          fail('should not resolve the promise');
        }, function error(err) {
          expect(angular.isObject(err)).toBe(true);
          expect(err.message).toEqual(jasmine.any(String));
        })
        .finally(done);
      });

      it('includes an array of resolved properties if option resolveProperties is true', function (done) {
        scCrud.types
        .findOne(auth, validTypeId, { resolveProperties: true })
        .then(function success(res) {
          expect(res).toBeDefined();
          expect(res.properties).toBeDefined();
          expect(res.properties).toEqual(jasmine.any(Array));
          expect(res.properties.length).toBeGreaterThan(0);
          expect(res.properties[0].versions).toBeDefined();
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
        scCrud.users
        .findAll(auth)
        .then(function success(res) {
          expect(res).toBeDefined();
          expect(angular.isArray(res)).toBe(true);
          expect(res.length).toBeGreaterThan(0);
          
          // as of 2015-06-21, elements of collections seem to no longer contain fields other than "uid" and "name"
          expect(res[0].uid).toEqual(jasmine.any(String));
          expect(res[0].name).toEqual(jasmine.any(String));
          // expect(res[0].email).toEqual(jasmine.any(String));
          // expect(res[0].groups).toEqual(jasmine.any(Array));
          // expect(res[0].picture).toEqual(jasmine.any(String));
        }, function error() {
          fail('should not reject the promise');
        })
        .finally(done);
      });
    });
    
    describe('#findSelf', function () {
      it('returns the user that owns the passed auth details', function (done) {
        scCrud.users
        .findSelf(auth)
        .then(function success(res) {
          expect(res).toBeDefined();
          expect(res.email).toEqual(auth.user);
          expect(res.groups).toEqual(jasmine.any(Array));
          expect(res.uid).toEqual(jasmine.any(String));
          expect(res.name).toEqual(jasmine.any(String));
          expect(res.picture).toEqual(jasmine.any(String));
        }, function error() {
          fail('should not reject the promise');
        })
        .finally(done);
      });
    });
  });
  
  describe('workspaces', function () {
    describe('#findAll', function () {
      it('returns returns an array of objects if passed valid auth details', function (done) {
        scCrud.workspaces
        .findAll(auth)
        .then(function success(res) {
          expect(res).toBeDefined();
          expect(angular.isArray(res)).toBe(true);
          expect(res.length).toBeGreaterThan(0);
          expect(res[0].uid).toEqual(jasmine.any(String));
          expect(res[0].name).toEqual(jasmine.any(String));
        }, function error() {
          fail('should not reject the promise');
        })
        .finally(done);
      });
    });
    
    describe('#findOne', function () {
      it('returns a workspace if passed valid auth details', function (done) {
        scCrud.workspaces
        .findOne(auth, validWorkspaceId)
        .then(function success(res) {
          expect(res).toBeDefined();
          expect(angular.isArray(res)).toBe(false);
          expect(res.uid).toEqual('workspaces/' + validWorkspaceId);
        }, function error() {
          fail('should not reject the promise');
        })
        .finally(done);
      });
    });
  });
});
