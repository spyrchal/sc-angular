(function () {
    var PATH_ATTRIBUTES = 'attributes',
        PATH_GROUPS = 'groups',
        PATH_USERS = 'users',
        PATH_TYPES = 'types',
        PATH_WORKSPACES = 'workspaces';
    
    angular.module('sociocortex').service('scCrud', ['$q', 'scCore', function scCrudService($q, scCore) {        
        return {
            types: {
                findAll: findAllTypes,
                findOne: findOneType
            },
            groups: {
                findAll: findAllGroups
            },
            users: {
                findAll: findAllUsers
            }
        };
        
        function findAllGroups(auth) {
            return genericFindAll(auth, PATH_GROUPS);
        }
        
        function findAllUsers(auth) {
            return genericFindAll(auth, PATH_USERS);
        }
        
        function findAllTypes(auth, workspaceId, includeAttributes) {
            return $q(function performFindAllTypes(resolve, reject) {
                var path = angular.isString(workspaceId) ? PATH_WORKSPACES + '/' + workspaceId + '/' + PATH_TYPES : PATH_TYPES;
                
                genericFindAll(auth, path).then(function resolveTypes(resTypes) {
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
        
        function genericFindAll(auth, path) {
            return $q(function performFindAll(resolve, reject) {
                scCore.scRequest({
                    httpMethod: 'GET',
                    path: path,
                    auth: auth
                }).then(function (res) {
                    return resolve(res.data);
                }, reject);
            });
        }
    }]);
})();
