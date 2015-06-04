/**
 * @license sc-angular v0.2.2
 * (c) 2015 Sebis
 * License: Sebis Proprietary
 * https://bitbucket.org/sebischair/sc-angular
 */
(function () {
    angular.module('sociocortex', []);
    
    angular.module('sociocortex').value('scConnection', {
        baseUri: 'http://131.159.30.153',
        apiVersion: '0.1'
    });
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
                    
                return $http({
                    headers: getAuthorizationHeader(options.auth.user, options.auth.password),
                    url: getFullUrl(options.path),
                    method: options.httpMethod,
                    params: options.params,
                    data: options.data
                }).then(resolve, reject);
            });
        }

        function mxlRequest(options) {
            return $q(function performMxlRequest(resolve, reject) {
                var mxlMethodParameters = null;
                if (!angular.isObject(options.mxlMethodParameters)) {
                    mxlMethodParameters = { expression: options.mxlMethodParameters };
                }
    
                return scRequest({
                    httpMethod: options.httpMethod,
                    path: combinePaths(getUrlPartFromContext(options.context), 'mxl'),
                    auth: options.auth,
                    params: { method: options.mxlMethod },
                    data: mxlMethodParameters
                }).then(resolve, reject);
            });
        }
    
        function getAuthorizationHeader(user, password) {
            return { Authorization: 'Basic ' + window.btoa(user + ':' + password) };
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
    
    angular.module('sociocortex').service('scCrud', ['$q', 'scCore', function scCrudService($q, scCore) {        
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
                findAll: findAllUsers
            },
            types: {
                findAll: findAllTypes,
                findOne: findOneType
            }
        };
        
        
        // ENTITIES
        function findAllEntities(auth, typeId) {
            // for performance reasons, one should't call this w/o a typeId filter (takes ages to finish)
            var path = angular.isString(typeId) ? PATH_TYPES + '/' + typeId + '/' + PATH_ENTITIES : PATH_ENTITIES;
            return genericFind(auth, path);
        }
        
        function findOneEntity(auth, entityId) {
            return genericFindOne(auth, PATH_ENTITIES, entityId);
        }
        
        function createEntity(auth, workspaceId, entityData) {
            return $q(function performCreateEntity(resolve, reject) {
                var err = validate([
                    [ auth, angular.isObject, 'auth is an object' ],
                    [ workspaceId, angular.isString, 'workspaceId is a string' ],
                    [ entityData, angular.isObject, 'entity is an object' ],
                    [ entityData.name, angular.isString, 'entity.name is a string' ]
                ]);
                if (err) { return reject(err); }
                
                entityData.workspace = {
                    uid: PATH_WORKSPACES + '/' + workspaceId,
                };
                
                scCore.scRequest({
                    httpMethod: 'POST',
                    auth: auth,
                    path: PATH_ENTITIES,
                    data: entityData
                }).then(function (res) {
                    // TODO
                    console.debug('creation successful', res);
                    resolve(true);
                }, reject);
            });
        }
        
        function updateEntity(auth, entity) {
            return $q(function performUpdateEntity(resolve, reject) {
                var err = validate([
                    [ auth, angular.isObject, 'auth is an object' ],
                    [ entity, angular.Object, 'entity is an object' ],
                    [ entity.uid, angular.Object, 'entity has a uid' ],
                    [ entity.name, angular.String, 'entity has a name' ],
                    [ entity.workspace, angular.Object, 'entity has a workspace' ],
                ]);
                if (err) { return reject(err); }
                
                scCore.scRequest({
                    httpMethod: 'POST',
                    auth: auth,
                    path: PATH_ENTITIES + '/' + entity.id,
                    data: entity
                }).then(function (res) {
                    // TODO
                    console.debug('update successful', res);
                    resolve(true);
                }, reject);
            });
        }
        
        function removeEntity(auth, entity) {
            return scCore.scRequest({
                httpMethod: 'DELETE',
                auth: auth,
                path: PATH_ENTITIES + '/' + entity.id
            });
        }
        
        
        // GROUPS
        function findAllGroups(auth) {
            return genericFind(auth, PATH_GROUPS);
        }
        
        function findAllUsers(auth) {
            return genericFind(auth, PATH_USERS);
        }
        
        
        // TYPES
        function findAllTypes(auth, workspaceId, includeAttributes) {
            return $q(function performFindAllTypes(resolve, reject) {
                var path = angular.isString(workspaceId) ? PATH_WORKSPACES + '/' + workspaceId + '/' + PATH_TYPES : PATH_TYPES;
                
                genericFind(auth, path).then(function resolveTypes(resTypes) {
                    if (!includeAttributes) {
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
        
        function findOneType(auth, typeId, includeAttributes) {
            return $q(function performFindOneType(resolve, reject) {
                var err = validate([
                    [ auth, angular.isObject, 'auth is an object' ],
                    [ typeId, angular.isString, 'typeId is a string' ]
                ]);
                if (err) { return reject(err); }
                
                genericFindOne(auth, PATH_TYPES, typeId).then(function (resType) {
                    if (!includeAttributes) {
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
                    console.error('validation failed', validationSequence);
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
        
        function autoComplete(workspaceId, auth) {
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
        };
        
        function query(mxlMethodParameters, context, auth) {
            return scCore.mxlRequest({
                httpMethod: 'POST',
                auth: auth,
                context: context,
                mxlMethod: 'query',
                mxlMethodParameters: mxlMethodParameters
            });
        };
        
        function validate(mxlMethodParameters, context, auth) {
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
