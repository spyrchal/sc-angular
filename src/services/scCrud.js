/// <reference path="../../typings/angularjs/angular.d.ts"/>
(function () {
    var PATH_ENTITIES = 'entities',
        PATH_GROUPS = 'groups',
        PATH_PROPERTIES = 'properties',
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
                findSelf: findOwnUser,
                findOne: findOneUser
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
                entities[i].id = entities[i].id || entities[i].uid.split('/')[1];
                
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
                entity.id = entity.id || entity.uid.split('/')[1];
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
        
        function resolveEntityLinks(auth, links, visited) {
            return $q(function performResolveEntityLinks(resolve, reject) {
                var currSubUid, currSubId, currSubType;
                
                var subPromises = [];
                
                for (var j = 0; j < links.length; j++) {
                    currSubUid = links[j].uid;
                    currSubType = currSubUid.split('/')[0];
                    currSubId = currSubUid.split('/')[1];
                    
                    var subPromise;
                    if (visited.indexOf(currSubId) > -1) {
                        // found previously visited entity id => circular reference
                        subPromise = resolveCircularLink(currSubUid, currSubId);
                    } else if (currSubType === 'entities') {
                        subPromise = findOneEntityAndResolveReferences(auth, currSubId, visited);
                    } else if (currSubType === 'users') {
                        subPromise = findOneUser(auth, currSubId);
                    }
                    
                    if (subPromise) {
                        subPromises.push(subPromise);
                    }
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
                    path: entity.uid || PATH_ENTITIES + '/' + entity.id,
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
                    path: entity.uid || PATH_ENTITIES + '/' + entity.id
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
               
        function findOneUser(auth, userId) {
            return genericFindOne(auth, PATH_USERS, userId);
        }
        
        // TYPES
        function findAllTypes(auth, workspaceId, options) {
            options = angular.isObject(options) ? options : {};
            
            return $q(function performFindAllTypes(resolve, reject) {
                var path = angular.isString(workspaceId) ? PATH_WORKSPACES + '/' + workspaceId + '/' + PATH_TYPES : PATH_TYPES;
                
                genericFind(auth, path).then(function resolveTypes(resTypes) {
                    if (!options.includeDetails) {
                        return resolve(resTypes);
                    }
                    
                    var promises = [], currTypeId;
                    var findOneOptions = { resolveProperties: options.resolveProperties };
                    for (var i = 0; i < resTypes.length; i++) {
                        currTypeId = resTypes[i].uid.split('/')[1];
                        promises.push(findOneType(auth, currTypeId, findOneOptions));
                    }

                    $q.all(promises).then(function (types) {
                        // findOneType may return null - see impl below; drop these elements
                        for (i = 0; i < types.length; i++) {
                            if (types[i] === null) {
                                types.splice(i, 1);
                            }
                        }
                        return resolve(types);
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
                    if (!options.resolveProperties || resType.properties.length === 0) {
                        return resolve(resType);
                    }
                    
                    // resolve properties
                    resolveProperties(auth, resType.properties).then(function resolveTypeProperties(properties) {
                        resType.properties = properties;
                        return resolve(resType);
                    }, reject);
                }, function (err) {
                    if (err.data && err.data.cause === 'ClassCastException') {
                        // workaround; see https://bitbucket.org/sebischair/sociocortex/issues/29/getting-a-specific-type-revalyxdsnhn
                        return resolve(null);
                    } else {
                        return reject(err);
                    }
                });
            });
        }
        
        function resolveProperties(auth, properties) {
            return $q(function performResolveProperties(resolve, reject) {
                var promises = [], propertyId;
                for (var i = 0; i < properties.length; i++) {
                    propertyId = properties[i].uid.split('/')[1];
                    promises.push(resolveProperty(auth, propertyId));
                }
                $q.all(promises).then(function (properties) {
                    // resolveProperty may return null - see impl below; drop these elements
                    for (i = 0; i < properties.length; i++) {
                        if (properties[i] === null) {
                            properties.splice(i, 1);
                        }
                    }
                    return resolve(properties);
                }, reject);
            });
        }
        
        function resolveProperty(auth, propertyId) {
            return $q(function performResolveProperty(resolve, reject) {
                scCore.scRequest({
                    httpMethod: 'GET',
                    path: PATH_PROPERTIES + '/' + propertyId,
                    auth: auth
                }).then(function (res) {
                    return resolve(res.data);
                }, function (err) {
                    if (err.data && err.data.cause === 'NullPointerException') {
                        // some types seem to include dead property references. return null in these cases.
                        return resolve(null);
                    } else {
                        return reject(err);
                    }
                });
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
