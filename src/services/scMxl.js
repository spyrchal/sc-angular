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
