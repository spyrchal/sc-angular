/**
 * @license sc-angular v0.5.0
 * (c) 2015 Sebis
 * License: Sebis Proprietary
 * https://bitbucket.org/sebischair/sc-angular
 */
(function () {
    angular.module('sociocortex', []);
    
    var SC_HOSTNAME = '131.159.30.153',
        SC_BASEURI = 'http://' + SC_HOSTNAME;
    angular.module('sociocortex').value('scConnection', {
        baseUri: SC_BASEURI,
        apiVersion: '0.1'
    });
    
    angular.module('sociocortex').config(['$sceDelegateProvider', function ($sceDelegateProvider) {
        $sceDelegateProvider.resourceUrlWhitelist(['self', SC_BASEURI + '/api/**' ]);
    }]);
})();

(function () {
    angular.module('sociocortex').service('scCore', ['$http', '$q', 'scConnection', function scCore($http, $q, scConnection) {
        return {
            scRequest: scRequest,
            mxlRequest: mxlRequest
        };
        
        function scRequest(options) {
            return $q(function performScRequest(resolve, reject) {
                if (!angular.isObject(options) ||
                    !angular.isObject(options.auth) ||
                    !angular.isString(options.httpMethod) ||
                    !angular.isString(options.path) ||
                    !angular.isString(options.auth.user) ||
                    !angular.isString(options.auth.password) ||
                    (options.params && !angular.isObject(options.params)) ||
                    (options.data && !angular.isObject(options.data))) {
                    console.trace();
                    console.error('sociocortex#scRequest: invalid options argument', options);
                    return reject({
                        error: 'Validation Failed',
                        message: 'invalid options argument'
                    });     
                }
                
                var headers = getHeaders(options.auth.user, options.auth.password);
                
                return $http({
                    headers: headers,
                    url: getFullUrl(options.path),
                    method: options.httpMethod,
                    params: options.params,
                    data: options.data
                }).then(resolve, reject);
            });
        }

        function mxlRequest(options) {
            return $q(function performMxlRequest(resolve, reject) {
                if (!angular.isObject(options.mxlMethodParameters)) {
                    options.mxlMethodParameters = { expression: options.mxlMethodParameters || '' };
                }
    
                return scRequest({
                    httpMethod: options.httpMethod,
                    path: combinePaths(getUrlPartFromContext(options.context), 'mxl'),
                    auth: options.auth,
                    params: { method: options.mxlMethod },
                    data: options.mxlMethodParameters
                }).then(resolve, reject);
            });
        }
    
        function getHeaders(user, password) {
            return {
                Authorization: 'Basic ' + window.btoa(user + ':' + password)
            };
        }
        
        function combinePaths(str1, str2) {
            if (str1.charAt(str1.length - 1) === '/') {
                str1 = str1.substr(0, str1.length - 1);
            }

            if (str2.charAt(0) === '/') {
                str2 = str2.substr(1, scConnection.baseUri.length - 1);
            }

            return str1 + '/' + str2;
        }
        
        function getFullUrl(urlPart) {
            var uri = combinePaths(scConnection.baseUri, 'api/' + scConnection.apiVersion);
            return combinePaths(uri, urlPart);
        }
        
        function getUrlPartFromContext(context) {
            if (angular.isObject(context)) {
                if (context.entityId) {
                    return 'entities/' + context.entityId;
                }
                if (context.typeId) {
                    return 'types/' + context.typeId;
                }
                if (context.workspaceId) {
                    return 'workspaces/' + context.workspaceId;
                }
                return '';
            }

            return 'workspaces/' + context;
        }
    }]);
})();

(function () {
    var PATH_ATTRIBUTES = 'attributes',
        PATH_ENTITIES = 'entities',
        PATH_GROUPS = 'groups',
        PATH_USERS = 'users',
        PATH_TYPES = 'types',
        PATH_WORKSPACES = 'workspaces';
    
    angular.module('sociocortex').service('scCrud', ['$q', 'scCore', 'scUtils', function scCrudService($q, scCore, scUtils) {        
        return {
            entities: {
                findAll: findAllEntities,
                findOne: findOneEntity,
                create: createEntity,
                update: updateEntity,
                remove: removeEntity
            },
            groups: {
                findAll: findAllGroups
            },
            users: {
                findAll: findAllUsers,
                findSelf: findOwnUser
            },
            types: {
                findAll: findAllTypes,
                findOne: findOneType
            },
            workspaces: {
                findAll: findAllWorkspaces
            }
        };
        
        
        // ENTITIES
        function findAllEntities(auth, typeId, options) {
            options = angular.isObject(options) ? options : {};
            
            return $q(function performFindAllEntities(resolve, reject) {
                var path = angular.isString(typeId) ? PATH_TYPES + '/' + typeId + '/' + PATH_ENTITIES : PATH_ENTITIES;
                
                return genericFind(auth, path).then(function (entities) {
                    if (!options.includeDetails && !options.resolveReferences) {
                        return resolve(entities);
                    }
                    
                    return enrichEntities(auth, entities).then(function (entities) {
                        if (options.resolveReferences) {
                            var promises = [];
                            for (var i = 0; i < entities.length; i++) {
                                promises.push(resolveEntityLinkAttributes(auth, entities[i]));
                            }
                            return $q.all(promises).then(function (entities) {
                                if (options.unwrap) {
                                    return resolve(scUtils.unwrapEntities(entities));
                                }
                                return resolve(entities);
                            }, reject);
                        }
                        
                        if (options.unwrap) {
                            return resolve(scUtils.unwrapEntities(entities));
                        }
                        return resolve(entities);
                    }, reject);
                }, reject);
            });
        }
        
        // Neither GET /entities nor /types/:id/entities include e.g. version details.
        // This method takes a list of "lean" entities and enriches it with said details
        // by calling GET /entities/:id for each element.
        function enrichEntities(auth, entities) {
            var promises = [];
            for (var i = 0; i < entities.length; i++) {
                promises.push(findOneEntity(auth, entities[i].id));
            }
            return $q.all(promises);
        }
        
        function findOneEntity(auth, entityId, options) {
            options = angular.isObject(options) ? options : {};
            
            return $q(function performFindOneEntity(resolve, reject) {
                
                var promise;
                if (options.resolveReferences) {
                    promise = findOneEntityAndResolveReferences(auth, entityId);
                } else {
                    promise = genericFindOne(auth, PATH_ENTITIES, entityId);
                }
                
                promise.then(function (entity) {
                    if (options.unwrap) {
                        return resolve(scUtils.unwrapEntity(entity));
                    }
                    return resolve(entity);
                }, reject);
            });
        }
        
        function findOneEntityAndResolveReferences(auth, entityId, visited) {
            visited = visited || [];
            
            return $q(function performFindOneEntity(resolve, reject) {
                genericFindOne(auth, PATH_ENTITIES, entityId).then(function (entity) {
                    resolveEntityLinkAttributes(auth, entity, visited).then(resolve, reject);
                }, reject);
            });
        }
        
        function resolveEntityLinkAttributes(auth, entity, visited) {
            visited = visited || [];
            
            return $q(function performResolveEntityAttributes(resolve, reject) {
                visited.push(entity.id);
                
                var promises = {};
                
                var attribute;
                for (var attributeIndex = 0; attributeIndex < entity.attributes.length; attributeIndex++) {
                    attribute = entity.attributes[attributeIndex];
                    
                    if (attribute.type === 'link') {
                        var entityLinks = attribute.values; // possibly multiple links per attribute
                        
                        // store promises in a map, so that the resolved links can be attached to their
                        // respective attributes later on
                        promises[attributeIndex.toString()] = resolveEntityLinks(auth, entityLinks, visited);
                    }
                }
                
                $q.all(promises).then(function (resolvedLinksMap) {
                    // attach resolved links to their respective attributes
                    for (var attributeIndex in resolvedLinksMap) {
                        if (resolvedLinksMap.hasOwnProperty(attributeIndex)) {
                            var resolvedLinks = resolvedLinksMap[attributeIndex];
                            entity.attributes[parseInt(attributeIndex)].resolved = resolvedLinks;
                        }
                    }
                    
                    resolve(entity);
                }, reject);
            });
        }
        
        function resolveEntityLinks(auth, entityLinks, visited) {
            return $q(function performResolveEntityLinks(resolve, reject) {
                var currSubEntityUid, currSubEntityId;
                
                var subPromises = [];
                
                for (var j = 0; j < entityLinks.length; j++) {
                    currSubEntityUid = entityLinks[j].uid;
                    currSubEntityId = currSubEntityUid.split('/')[1];
                    
                    var subPromise;
                    if (visited.indexOf(currSubEntityId) > -1) {
                        // found previously visited entity id => circular reference
                        subPromise = resolveCircularLink(currSubEntityUid, currSubEntityId);
                    } else {
                        subPromise = findOneEntityAndResolveReferences(auth, currSubEntityId, visited);
                    }
                    subPromises.push(subPromise);
                }

                $q.all(subPromises).then(resolve, reject);
            });
        }
        
        function resolveCircularLink(uid, id) {
            return $q(function (resolve) {
                resolve({ uid: uid, id: id, isCircular: true });
            });
        }
        
        function validateEntityAttributes(attributes) {
            var attribute;
            for (var i = 0; i < attributes.length; i++) {
                attribute = attributes[i];
                if (!angular.isArray(attribute.values) ||
                    !angular.isString(attribute.name) ||
                    (angular.isDefined(attribute.type) && !angular.isString(attribute.type))) {
                    return false;        
                }
            }
            return true;
        }
        
        function createEntity(auth, workspaceId, typeId, entityData, options) {
            options = angular.isObject(options) ? options : {};
            
            if (!angular.isArray(entityData.attributes)) {
                entityData.attributes = scUtils.wrapAttributes(entityData.attributes);
            }
            
            return $q(function performCreateEntity(resolve, reject) {
                var err = validate([
                    [ auth, angular.isObject, 'auth is an object' ],
                    [ workspaceId, angular.isString, 'workspaceId is a string' ],
                    [ typeId, angular.isString, 'typeId is a string' ],
                    [ entityData, angular.isObject, 'entityData is an object' ],
                    [ entityData.name, angular.isString, 'entityData.name is a string' ],
                    [ entityData.attributes, angular.isArray, 'entityData.attributes is an array' ],
                    [ entityData.attributes, validateEntityAttributes, 'attributes are 3-tuples of name, values, type' ]
                ]);
                if (err) { return reject(err); }
                
                entityData.type = {
                    uid: PATH_TYPES + '/' + typeId,
                };
                
                entityData.workspace = {
                    uid: PATH_WORKSPACES + '/' + workspaceId,
                };
                
                scCore.scRequest({
                    httpMethod: 'POST',
                    auth: auth,
                    path: PATH_ENTITIES,
                    data: entityData
                }).then(function (res) {
                    if (options.unwrap) {
                        return resolve(scUtils.unwrapEntity(res.data));
                    }
                    return resolve(res.data);
                }, reject);
            });
        }
        
        function updateEntity(auth, entity, options) {
            options = angular.isObject(options) ? options : {};
            
            if (!angular.isArray(entity.attributes)) {
                entity.attributes = scUtils.wrapAttributes(entity.attributes);
            }
            
            return $q(function performUpdateEntity(resolve, reject) {
                var err = validate([
                    [ auth, angular.isObject, 'auth is an object' ],
                    [ entity, angular.isObject, 'entity is an object' ],
                    [ entity.type, angular.isObject, 'type is an object' ],
                    [ entity.uid, angular.isString, 'entity has a uid' ],
                    [ entity.name, angular.isString, 'entity has a name' ],
                    [ entity.workspace, angular.isObject, 'entity has a workspace' ],
                    [ entity.attributes, angular.isArray, 'entity.attributes is an array' ],
                    [ entity.attributes, validateEntityAttributes, 'attributes are 3-tuples of name, values, type' ]
                ]);
                if (err) { return reject(err); }
        
                scCore.scRequest({
                    httpMethod: 'PUT',
                    auth: auth,
                    path: PATH_ENTITIES + '/' + entity.id,
                    data: entity
                }).then(function (res) {
                    if (options.unwrap) {
                        return resolve(scUtils.unwrapEntity(res.data));
                    }
                    return resolve(res.data);
                }, reject);
            });
        }
        
        function removeEntity(auth, entity) {
            return $q(function performRemoveEntity(resolve, reject) {
                scCore.scRequest({
                    httpMethod: 'DELETE',
                    auth: auth,
                    path: PATH_ENTITIES + '/' + entity.id
                }).then(function (res) {
                    resolve(true);
                }, reject);
            });
        }
        
        
        // GROUPS
        function findAllGroups(auth) {
            return genericFind(auth, PATH_GROUPS);
        }
        
        
        // USERS
        function findAllUsers(auth) {
            return genericFind(auth, PATH_USERS);
        }
        
        function findOwnUser(auth) {
            return genericFind(auth, PATH_USERS + '/me');
        }
        
        
        // TYPES
        function findAllTypes(auth, workspaceId, options) {
            options = angular.isObject(options) ? options : {};
            
            return $q(function performFindAllTypes(resolve, reject) {
                var path = angular.isString(workspaceId) ? PATH_WORKSPACES + '/' + workspaceId + '/' + PATH_TYPES : PATH_TYPES;
                
                genericFind(auth, path).then(function resolveTypes(resTypes) {
                    if (!options.includeAttributes) {
                        return resolve(resTypes);
                    }
                    
                    // resolve attributes (which may lead to a significant number of API calls)
                    var promises = [], currTypeId;
                    for (var i = 0; i < resTypes.length; i++) {
                        currTypeId = resTypes[i].id;
                        promises.push(findTypeAttributes(auth, currTypeId));
                    }

                    $q.all(promises).then(function resolveAttributesOfTypes(attributeCollection) {
                        for (i = 0; i < resTypes.length; i++) {
                            resTypes[i].attributes = attributeCollection[i].data;
                        }
                        return resolve(resTypes);
                    }, reject);
                }, reject);
            });
        }
        
        function findOneType(auth, typeId, options) {
            options = angular.isObject(options) ? options : {};
            
            return $q(function performFindOneType(resolve, reject) {
                var err = validate([
                    [ auth, angular.isObject, 'auth is an object' ],
                    [ typeId, angular.isString, 'typeId is a string' ]
                ]);
                if (err) { return reject(err); }
                
                genericFindOne(auth, PATH_TYPES, typeId).then(function (resType) {
                    if (!options.includeAttributes) {
                        return resolve(resType);
                    }
                    
                    // resolve attributes
                    findTypeAttributes(auth, typeId).then(function resolveTypeAttributes(res) {
                        resType.attributes = res.data;
                        return resolve(resType);
                    }, reject);
                }, reject);
            });
        }
        
        function findTypeAttributes(auth, typeId) {
            return scCore.scRequest({
                httpMethod: 'GET',
                path: PATH_TYPES + '/' + typeId + '/' + PATH_ATTRIBUTES,
                auth: auth
            });
        }
        
        
        // WORKSPACES
        function findAllWorkspaces(auth) {
            return genericFind(auth, PATH_WORKSPACES);
        }
        
        
        // HELPERS
        function genericFindOne(auth, path, id) {        
            return $q(function performFind(resolve, reject) {
                var err = validate([[ id, angular.isString, 'id is a string' ]]);
                if (err) { return reject(err); }
                
                path = path + '/' + id;
                genericFind(auth, path).then(resolve, reject);
            });
        }
        
        function genericFind(auth, path) {
            return $q(function performFind(resolve, reject) {
                var err = validate([
                    [ auth, angular.isObject, 'auth is an object' ],
                    [ path, angular.isString, 'path is a string' ],
                ]);
                if (err) { return reject(err); }
                
                scCore.scRequest({
                    httpMethod: 'GET',
                    path: path,
                    auth: auth
                }).then(function (res) {
                    return resolve(res.data);
                }, reject);
            });
        }
        
        function validate(validationSequence) {
            var reference, validator, message;
            for (var i = 0; i < validationSequence.length; i++) {
                validator = validationSequence[i][1];
                message = validationSequence[i][2];
                
                if (!angular.isDefined(validationSequence[i][0])) {
                    return {
                        error: 'Missing Parameter',
                        message: message || 'no details provided'
                    };
                }
                
                reference = validationSequence[i][0];
                
                if (!validator(reference)) {
                    console.trace();
                    console.error('validation failed', validationSequence[i]);
                    return {
                        error: 'Invalid Parameter',
                        message: message || 'no details provided'
                    };
                }
            }
            return null;
        }
    }]);
})();

(function () {
    angular.module('sociocortex').service('scMxl', ['$cacheFactory', '$q', 'scCore', function scMxlService($cacheFactory, $q, scCore) {
        var autoCompleteCache = $cacheFactory('mxlAutoCompleteCache');
        
        return {
            autoComplete: autoComplete,
            query: query,
            validate: validate
        };
        
        function autoComplete(auth, workspaceId) {
            return $q(function performAutoComplete(resolve, reject) {
                var cachedHints = autoCompleteCache.get(workspaceId);
    
                if (cachedHints) {
                    return resolve(cachedHints);
                }
    
                scCore.mxlRequest({
                    httpMethod: 'GET',
                    auth: auth,
                    context: { workspaceId: workspaceId },
                    mxlMethod: 'autoComplete'
                }).then(function processMxlResponse(hints) {
                    autoCompleteCache.put(workspaceId, hints);
                    return resolve(hints);
                }, reject);
            });
        }
        
        function query(auth, mxlMethodParameters, context) {
            return scCore.mxlRequest({
                httpMethod: 'POST',
                auth: auth,
                context: context,
                mxlMethod: 'query',
                mxlMethodParameters: mxlMethodParameters
            });
        }
        
        function validate(auth, mxlMethodParameters, context) {
            return scCore.mxlRequest({
                httpMethod: 'POST',
                auth: auth,
                context: context,
                mxlMethod: 'validate',
                mxlMethodParameters: mxlMethodParameters
            });
        }
    }]);
})();

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
                    } else if (angular.isObject(sampleValue) && angular.isString(sampleValue.uid)) {
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
