/// <reference path="../../typings/angularjs/angular.d.ts"/>
(function () {
    angular.module('sociocortex').service('scUtils', [function scUtils() {
        return {
            unwrapAttributes: unwrapAttributes,
            wrapAttributes: wrapAttributes,
            unwrapEntity: unwrapEntity,
            unwrapEntities: unwrapEntities
        };
        
        // turns this: '[{ "values": [ "18.4" ], "name": "Price", "type": "number" }]'
        // into this:  '{ "Price": 18.4 }' 
        function unwrapAttributes(attributes) {
            attributes = angular.isArray(attributes) ? attributes : [];
            
            var res = {};
            
            var currAttr;
            for (var i = 0; i < attributes.length; i++) {
                currAttr = attributes[i];
                
                if (currAttr.type === 'number') {
                    for (var j = 0; j < currAttr.values.length; j++) {
                        currAttr.values[j] = parseInt(currAttr.values[j]);
                    }
                } else if (currAttr.type === 'date') {
                    for (var j = 0; j < currAttr.values.length; j++) {
                        // sociocortex seems to store dates in the german date format: "DD.MM.YYYY"
                        var dateParts = currAttr.values[j].split('.');
                        var dateString = dateParts[2] + '-' + dateParts[1] + '-' + dateParts[0];
                        currAttr.values[j] = new Date(dateString);
                    }
                } else if (currAttr.type === 'link' && currAttr.resolved) {
                    currAttr.values = currAttr.resolved;
                }
                
                if (currAttr.values.length === 1) {
                    res[currAttr.name] = currAttr.values[0];
                } else {
                    res[currAttr.name] = currAttr.values;
                }
            }
            
            return res;
        }
        
        // turns this:  '{ "Price": 18.4 }' 
        // into this: '[{ "values": [ "18.4" ], "name": "Price", "type": "number" }]'
        function wrapAttributes(object) {
            var attributes = [];
            
            for (var key in object) {
                if (object.hasOwnProperty(key)) {
                    var attribute = {
                        name: key
                    };
                    
                    var values = object[key];
                    var newValues = [];
                    
                    if (!(values instanceof Array)) {
                        values = [values];
                    }
                    
                    // take the type of the first value as an anchor point
                    // this will fail if the elements don't share the same type
                    var sampleValue = values[0];
                    
                    if (sampleValue === undefined) {
                        attribute.values = [];
                    } else if (sampleValue instanceof Date) {
                        for (var j = 0; j < values.length; j++) {
                            // sociocortex seems to use the german date format: "DD.MM.YYYY"
                            var day = values[j].getDate(),
                                month = values[j].getMonth() + 1,
                                year = values[j].getFullYear();

                            var dateString = (day < 10 ? '0' + day : day) + '.' + (month < 10 ? '0' + month : month) + '.' + year;
                            newValues.push(dateString);
                        }
                        attribute.type = 'date';
                        attribute.values = newValues;
                    } else if (typeof sampleValue === 'number') {
                        for (var j = 0; j < values.length; j++) {
                            newValues.push(values[j].toString());
                        }
                        attribute.type = 'number';
                        attribute.values = newValues;
                    } else if (typeof sampleValue === 'object' && typeof sampleValue.uid === 'string') {
                        for (var j = 0; j < values.length; j++) {
                            newValues.push({ uid: values[j].uid, name: values[j].name });
                        }

                        attribute.type = 'link';
                        attribute.values = newValues;
                    } else {
                        // can't distinguish between text, enum, longText etc
                        attribute.type = 'text';
                        attribute.values = values;
                    }
                    
                    attributes.push(attribute);
                }
            }
            
            return attributes;
        }
        
        function unwrapEntities(entities) {
            var unwrappedEntities = [];
            for (var i = 0; i < entities.length; i++) {
                unwrappedEntities.push(unwrapEntity(entities[i]));
            }
            return unwrappedEntities;
        }
        
        function unwrapEntity(entity) {
            entity.attributes = unwrapAttributes(entity.attributes);
            return entity;
        }
    }]);
})();
