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

    return {
        getAutoCompletionHints: function (workspaceId) {            
            workspaceId = (workspaceId === undefined) ? null : workspaceId;
            var cachedHints = mxlAutoCompleteCache.get(workspaceId);

            if (cachedHints === undefined) {
                hints = this.scRequest('GET', (workspaceId ? 'workspaces/' + workspaceId + '/mxl' : 'mxl'), { method: 'autoComplete' });
                mxlAutoCompleteCache.put(workspaceId, hints);
                return hints;
            }
            else {
                return cachedHints;
            }
        },
        mxlQuery: function (query, workspaceId) {
            return this.scRequest('POST', (workspaceId ? 'workspaces/' + workspaceId + '/mxl' : 'mxl'), angular.extend({ method: 'query' }, params), { expression: query })
        },  
        scRequest: function (httpMethod, scUrl, params, data, error) {
            var promise = $http({
                headers: this.getAuthorizationHeader(),
                url: this.getFullUrl(scUrl),
                method: httpMethod,
                params: params,
                data: data
            }).then(function (response) {
                return response.data;
            }, function (response) {
                if (error) {
                    if (angular.isFunction(error)) {
                        return error(response.data);
                    } else if (angular.isObject(error)) {
                        if (error[response.status]) {
                            return error[response.status](response.data);
                        } else if (error.default) {
                            return error.default(response.data);
                        }
                    }
                }
                return null;
            });

            return promise;
        },
        getAuthorizationHeader: function () {
            return { Authorization: 'Basic ' + btoa(scConnection.userName + ':' + scConnection.password) };
        },
        getFullUrl: function (urlPart) {

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
    }
});