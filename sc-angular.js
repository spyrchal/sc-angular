angular.module('sociocortex', [])
.value('scConnection',
{
    baseUri: 'http://localhost:8083/intern/tricia',
    apiVersion: '0.1',
    userName: 'mustermann@test.tricia',
    password: 'ottto'
})

//baseUri: 'http://131.159.30.153/api/0.1',
//userName: 'sociocortex.sebis@tum.de',   
//password: 'sebis'

.factory('scService', function ($http, $cacheFactory, scConnection) {
    var mxlAutoCompleteCache = $cacheFactory('mxlAutoCompleteCache');

    function getAuthorizationHeader() {
        return { Authorization: 'Basic ' + btoa(scConnection.userName + ':' + scConnection.password) };
    }
    function getFullUrl(urlPart) {

        function combinePaths(str1, str2) {
            if (str1.charAt(str1.length - 1) === '/') {
                str1 = str1.substr(0, str1.length - 1);
            }

            if (str2.charAt(0) === '/') {
                str2 = str2.substr(1, baseUri.length - 1);
            }

            return str1 + '/' + str2;
        }

        var uri = combinePaths(scConnection.baseUri, 'api/' + scConnection.apiVersion);
        return combinePaths(uri, urlPart);
    }

    function mxlRequest(httpMethod, mxlMethod, workspaceId, expression, parameterDefinitions) {
        var payload = {};
        if (expression) {
            payload.expression = expression;
        }
        if (parameterDefinitions) {
            payload.parameterDefinitions = parameterDefinitions;
        }
        return scRequest(httpMethod, (workspaceId ? 'workspaces/' + workspaceId + '/mxl' : 'mxl'), { method: mxlMethod }, payload);
    }

    function scRequest(httpMethod, scUrl, params, data, error) {
        var promise = $http({
            headers: getAuthorizationHeader(),
            url: getFullUrl(scUrl),
            method: httpMethod,
            params: params,
            data: data
        });

        return promise;
    }

    return {
        mxlAutoComplete: function (workspaceId) {
            workspaceId = (workspaceId === undefined) ? null : workspaceId;
            var cachedHints = mxlAutoCompleteCache.get(workspaceId);

            if (cachedHints === undefined) {
                hints = mxlRequest('GET', 'autoComplete', workspaceId);
                mxlAutoCompleteCache.put(workspaceId, hints).then(function (response) {
                    return response.data;
                });
                return hints;
            }
            else {
                return cachedHints;
            }
        },
        mxlQuery: function (query, workspaceId) {
            return mxlRequest('POST', 'query', workspaceId, query, null);
        },
        mxlValidate: function (query, workspaceId) {
            return mxlRequest('POST', 'validate', workspaceId, query, null);
        }
    }
});