/// <reference path="../../typings/angularjs/angular.d.ts"/>
(function () {
    angular.module('sociocortex').service('scUtils', [function scUtils() {
        return {
            unwrapAttributes: unwrapAttributes,
            wrapAttributes: wrapAttributes,
            unwrapEntity: unwrapEntity,
            unwrapEntities: unwrapEntities,
            parseDate: parseDate
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
                    
                    for (var j = 0; j < currAttr.values.length; j++) {
                        currAttr.values[j].attributes = unwrapAttributes(currAttr.values[j].attributes);
                    }
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
                        attribute.type = 'link'; // assume type link if there are no values
                        attribute.values = [];
                    } else if (angular.isDate(sampleValue)) {
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
                    } else if (angular.isNumber(sampleValue)) {
                        for (var j = 0; j < values.length; j++) {
                            newValues.push(values[j].toString());
                        }
                        attribute.type = 'number';
                        attribute.values = newValues;
                    } else if (angular.isObject(sampleValue) &&
                               (angular.isString(sampleValue.uid) ||
                                angular.isString(sampleValue.id))) {
                                    
                        var prefix = sampleValue.hasOwnProperty('lastLoginDate') ? 'users/' : 'entities/';
                        for (var j = 0; j < values.length; j++) {
                            newValues.push({
                                uid: values[j].uid || prefix + values[j].id,
                                name: values[j].name
                            });
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
        
        function parseDate(dateString) {
            // SC seems to use the german timezone when storing dates and returns them like this:
            // "2015-06-18 02:40:49.669"" which can't be parsed by most browsers (e.g. current iOS, IE11).
            var date = new Date(dateString.replace(' ', 'T'));
            
            // new Date() assumes UTC and adds the local offset, thus resulting in two offsets
            // subtract the german offset
            var germanOffset;
            if (date.getMonth() > 2 && date.getMonth() < 10) { // simplified
                germanOffset = 120; // CEST (UTC+2)
            } else {
                germanOffset = 60; // CET (UTC+1)
            }
            
            date.setTime(date.getTime() - germanOffset * 60 * 1000);
            return date;
        }
    }]);
})();
