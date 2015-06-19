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
  
  describe('#parseDate', function () {
    it('strips the german offset from a given date string and returns a valid Date', function () {
      var reference = '2015-06-18 02:40:49.669'; // as seen in the versions array of entities
      var result = scUtils.parseDate(reference);
      expect(result.getUTCHours()).toEqual(0);
      expect(result.getUTCMinutes()).toEqual(40);
      expect(result.getUTCDate()).toEqual(18);
    });
  });
});
