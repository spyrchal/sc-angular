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
