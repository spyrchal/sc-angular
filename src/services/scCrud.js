(function () {
    angular.module('sociocortex').service('scCrud', ['scCore', function scCrudService(scCore) {
        return {
            findTypes: findTypes
        };
        
        function findTypes(auth) {
            return scCore.scRequest({
                httpMethod: 'GET',
                path: 'types',
                auth: auth
            });
        }
    }]);
})();
