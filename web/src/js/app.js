'use strict';

var APP = {};



//
// Currently logged-in user's data.
//
APP.currentUser = null;



//
// Simple cache that is wiped-out on every page reload.
//
APP.cache = {};



//
// APP Router.
//
APP.onRouteChange = function (path) {
    APP.route.beforeRender(function (data) {
        data = data || {};

        if (APP.route[path]) {
            APP.route[path](data);
        } else {
            APP.route['/'](data);
        }
    });
};



//
// Render template and insert it into the DOM.
//
APP.render = function (tpl, data, options) {
    data = data || {};
    options = options || {};

    var html;

    if (options.layout !== false) {
        html = APP.TEMPLATE[options.layout || 'layout'](data).replace('{{yield}}', tpl(data));
    } else {
        html = tpl(data);
    }

    jQuery('#app').html(html);
    APP.route.afterRender(data);
    APP.router.relink();
};



//
// Start the application.
//
APP.init = function () {
    APP.router = new APP.LinkRouter({
        onChange: APP.onRouteChange
    });

    var token = APP.getCookie(APP.config.sessionCookieName);
    
    if (token && !APP.currentUser) {
        APP.service.logIn({ session_token: token }, function (response) {
            if (response && !response.error) {
                APP.AUTH.afterLogIn(response.data);
            }
        }).always(function () {
            APP.router.start();
        });
    } else {
        APP.router.start();
    }

    // Disable dropzone.js automatic mode.
    Dropzone.autoDiscover = false;

    // Enable SVG sprite support for all browsers.
    svg4everybody();
};