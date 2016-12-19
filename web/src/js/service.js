/*!
    API wrapper.
*/

(function () {
    'use strict';

    APP.service = {};



    function ajax(method, apiEndpoint, params, callback) {
        var headers = {};

        if (APP.currentUser) {
            headers['x-session-token'] = APP.currentUser.session_token;
        } else if (params && params.session_token) {
            headers['x-session-token'] = params.session_token;
        }

        return jQuery.ajax({
            url: apiEndpoint.indexOf('://') === -1 ? APP.config.apiUrl + apiEndpoint : apiEndpoint,
            headers: headers,
            type: method,
            contentType: 'application/json; charset=utf-8',
            data: method !== 'GET' ? JSON.stringify(params) : params
        }).then(callback);
    }



    //
    // Form
    //

    APP.service.getForm = function (params, callback) {
        return ajax('GET', '/form', params, callback);
    };

    APP.service.getFormResponses = function (data, callback) {
        return ajax('GET', '/form/responses', data, callback);
    };

    APP.service.createFormResponse = function (data, callback) {
        return ajax('POST', '/form/response', data, callback);
    };



    //
    // Maps & Charts
    //

    APP.service.getMapData = function (params, callback) {
        return ajax('GET', '/data/map', params, callback);
    };

    APP.service.getBarChartData = function (params, callback) {
        return ajax('GET', '/data/bar-chart', params, callback);
    };



    //
    // Languages & Translations
    //

    APP.service.getLanguages = function (callback) {
        return ajax('GET', '/languages', {}, callback);
    };

    APP.service.getUITranslations = function (params, callback) {
        return ajax('GET', '/ui-translations', params, callback);
    };

})();