(function () {
    angular.module('sociocortex').service('scMxl', ['$cacheFactory', 'scCore', function scMxlService($cacheFactory, scCore) {
        var autoCompleteCache = $cacheFactory('mxlAutoCompleteCache');
        
        return {
            autoComplete: autoComplete,
            query: query,
            validate: validate
        };
        
        function autoComplete(workspaceId, auth) {
            var cachedHints = autoCompleteCache.get(workspaceId);

            if (cachedHints === undefined) {
                var hints = scCore.mxlRequest({
                    httpMethod: 'GET',
                    auth: auth,
                    context: { workspaceId: workspaceId },
                    mxlMethod: 'autoComplete'
                });
                autoCompleteCache.put(workspaceId, hints).then(function (response) {
                    return response.data;
                });
                return hints;
            }
            else {
                return cachedHints;
            }
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
