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
            return scCore.scRequest({
                httpMethod: 'GET',
                path: 'groups',
                auth: auth
            });
        }
        
        function findAllTypes(auth, workspaceId) {
            var path = angular.isString(workspaceId) ? 'workspaces/' + workspaceId + '/types' : 'types';
            
            return scCore.scRequest({
                httpMethod: 'GET',
                path: path,
                auth: auth
            });
        }
        
        function findOneType(auth, typeId) {
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
                }).then(resolve, reject);
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
