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
    angular.module('sociocortex').service('scCrud', ['$q', 'scCore', function scCrudService($q, scCore) {        
        return {
            types: {
                findAll: findAllTypes,
                findOne: findOneType
            },
            groups: {
                findAll: findAllGroups
            }
        };
        
        function findAllGroups(auth) {
            return $q(function performFindAllGroups(resolve, reject) {
                scCore.scRequest({
                    httpMethod: 'GET',
                    path: 'groups',
                    auth: auth
                }).then(function (res) {
                    return resolve(res.data);
                }, reject);
            });
        }
        
        function findAllTypes(auth, workspaceId, includeAttributes) {
            return $q(function performFindAllTypes(resolve, reject) {
                var path = angular.isString(workspaceId) ? 'workspaces/' + workspaceId + '/types' : 'types';
                
                scCore.scRequest({
                    httpMethod: 'GET',
                    path: path,
                    auth: auth
                }).then(function (res) {
                    var resTypes = res.data;
                    
                    if (!includeAttributes) {
                        return resolve(resTypes);
                    }
                    
                    // resolve attributes (which may lead to a significant number of API calls)
                    var promises = [], currTypeId;
                    for (var i = 0; i < resTypes.length; i++) {
                        currTypeId = resTypes[i].id;
                        promises.push(findTypeAttributes(auth, currTypeId));
                    }
                    $q.all(promises).then(function (attributeCollection) {
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
                
                scCore.scRequest({
                    httpMethod: 'GET',
                    path: 'types/' + typeId,
                    auth: auth
                }).then(function (res) {
                    if (!includeAttributes) {
                        return resolve(res.data);
                    }
                    
                    // resolve attributes
                    var resType = res.data;
                    findTypeAttributes(auth, typeId).then(function (res) {
                        resType.attributes = res.data;
                        return resolve(resType);
                    }, reject);
                }, reject);
            });
        }
        
        function findTypeAttributes(auth, typeId) {
            return scCore.scRequest({
                httpMethod: 'GET',
                path: 'types/' + typeId + '/attributes',
                auth: auth
            });
        }
        
        function validate(validationSequence) {
            var reference, validator, message;
            for (var i = 0; i < validationSequence.length; i++) {
                reference = validationSequence[i][0];
                validator = validationSequence[i][1];
                message = validationSequence[i][2];
                
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

//# sourceMappingURL=sc-angular.js.map