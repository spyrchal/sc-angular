/// <reference path="../../typings/angularjs/angular.d.ts"/>
/// <reference path="../../typings/jasmine/jasmine.d.ts"/>
/* global inject */
/* global ngMidwayTester */

describe('scUtils', function () {
  var tester, scUtils, attributeArray, attributeObject;
  
  beforeEach(function () {  
    tester = ngMidwayTester('sociocortex');
    scUtils = tester.inject('scUtils');
    
    attributeArray = [
      {
        "values": [
          "21.10.2014"
        ],
        "name": "date",
        "type": "date"
      },
      {
        "values": [
          {
            "uid": "entities/uuhq47xvnqtb",
            "name": "112a"
          }
        ],
        "name": "reference",
        "type": "link"
      },
      {
        "values": [
          "Testtext"
        ],
        "name": "long varname",
        "type": "text"
      },
      {
        "values": [
          "123",
          "321"
        ],
        "name": "numbers",
        "type": "number"
      }
    ];
    
    attributeObject = {
      date: new Date('2014-10-21'),
      reference: {
        uid: 'entities/uuhq47xvnqtb',
        name: '112a'
      },
      'long varname': 'Testtext',
      numbers: [123, 321]
    };
  });

  afterEach(function() {
    tester.destroy();
    tester = null;
  });
  
  describe('#unwrapAttributes', function () {
    it('transforms an array of sociocortex attributes into an object', function () {
      expect(scUtils.unwrapAttributes(attributeArray)).toEqual(attributeObject);
    });
  });
  
  describe('#wrapAttributes', function () {
    it('transforms an object into an array of sociocortex attributes', function () {
      expect(scUtils.wrapAttributes(attributeObject)).toEqual(attributeArray);
    });
  });
});
