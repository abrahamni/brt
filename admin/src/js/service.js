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
    // Auth
    //

    APP.service.logIn = function (params, callback) {
        return ajax('POST', '/login', params, callback);
    };

    APP.service.logOut = function (callback) {
        return ajax('POST', '/logout', {}, callback);
    };



    //
    // Form
    //

    APP.service.getForm = function (params, callback) {
        return ajax('GET', '/form', params, callback);
    };

    APP.service.getFormTranslations = function (data, callback) {
        return ajax('GET', '/form/translations', data, callback);
    };

    APP.service.updateFormTranslations = function (data, callback) {
        return ajax('PUT', '/form/translations', data, callback);
    };

    APP.service.getFormResponses = function (data, callback) {
        return ajax('GET', '/form/responses', data, callback);
    };

    APP.service.getFormResponse = function (data, callback) {
        return ajax('GET', '/form/response', data, callback);
    };

    APP.service.deleteFormResponse = function (data, callback) {
        return ajax('DELETE', '/form/response', data, callback);
    };

    APP.service.approveFormResponse = function (data, callback) {
        return ajax('PUT', '/form/response/approve', data, callback);
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

    APP.service.updateUITranslations = function (params, callback) {
        return ajax('PUT', '/ui-translations', params, callback);
    };

    

})();