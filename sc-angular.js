angular.module('sociocortex', [])
.value('scConnection',
{
    baseUri: 'http://131.159.30.153',
    apiVersion: '0.1',
    userName: 'sociocortex.sebis@tum.de',
    password: 'sebis'
})
.factory('scService', function ($http, $cacheFactory, scConnection) {
    var mxlAutoCompleteCache = $cacheFactory('mxlAutoCompleteCache');

    var helper = {
        getAuthorizationHeader: function () {
            return { Authorization: 'Basic ' + btoa(scConnection.userName + ':' + scConnection.password) };
        },
        combinePaths: function (str1, str2) {
            if (str1.charAt(str1.length - 1) === '/') {
                str1 = str1.substr(0, str1.length - 1);
            }

            if (str2.charAt(0) === '/') {
                str2 = str2.substr(1, baseUri.length - 1);
            }

            return str1 + '/' + str2;
        },
        getFullUrl: function (urlPart) {
            var uri = this.combinePaths(scConnection.baseUri, 'api/' + scConnection.apiVersion);
            return this.combinePaths(uri, urlPart);
        },
        getUrlPartFromContext: function (context) {
            if (angular.isObject(context)) {
                if (context.entityId) {
                    return "entities/" + context.entityId;
                }
                if (context.typeId) {
                    return "types/" + context.typeId;
                }
                if (context.workspaceId) {
                    return "workspaces/" + context.workspaceId;
                }
                return "";
            }

            return "workspaces/" + context;
        },
        scRequest: function (httpMethod, scUrl, params, data) {
            var promise = $http({
                headers: this.getAuthorizationHeader(),
                url: this.getFullUrl(scUrl),
                method: httpMethod,
                params: params,
                data: data
            });

            return promise;
        },
        mxlRequest: function (httpMethod, context, mxlMethod, mxlMethodParameters) {
            if (!angular.isObject(mxlMethodParameters)) {
                mxlMethodParameters = { expression: mxlMethodParameters };
            }

            return this.scRequest(httpMethod, this.combinePaths(this.getUrlPartFromContext(context), "mxl"), { method: mxlMethod }, mxlMethodParameters);
        }
    };

    return {
        mxlAutoComplete: function (workspaceId) {
            var cachedHints = mxlAutoCompleteCache.get(workspaceId);

            if (cachedHints === undefined) {
                hints = helper.mxlRequest('GET', { workspaceId: workspaceId }, 'autoComplete');
                mxlAutoCompleteCache.put(workspaceId, hints).then(function (response) {
                    return response.data;
                });
                return hints;
            }
            else {
                return cachedHints;
            }
        },
        mxlQuery: function (mxlMethodParameters, context) {
            return helper.mxlRequest('POST', context, 'query', mxlMethodParameters);
        },
        mxlValidate: function (mxlMethodParameters, context) {
            return helper.mxlRequest('POST', context, 'validate', mxlMethodParameters);
        },
        getEntities: function () {
            return helper.scRequest('GET', 'entities');
        }
    }
});