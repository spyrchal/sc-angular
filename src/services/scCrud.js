(function () {
    angular.module('sociocortex').service('scCrud', ['scCore', function scCrudService(scCore) {        
        return {
            types: {
                findAll: findAllTypes
            }
        };
        
        function findAllTypes(auth) {
            return scCore.scRequest({
                httpMethod: 'GET',
                path: 'types',
                auth: auth
            });
        }
    }]);
})();
