/*!
    Route handlers.
*/

(function () {
    'use strict';

    APP.route = {};
    APP.route.guest = {};



    //
    // Guest routes.
    //
    APP.route.guest['/']                       = function (data) { APP.AUTH.handleLogIn(data) };
    APP.route.guest['/login']                  = function (data) { APP.AUTH.handleLogIn(data) };
    APP.route.guest['/reset-password']         = function (data) { APP.AUTH.handlePasswordReset(data) };
    APP.route.guest['/confirm-reset-password'] = function (data) { APP.AUTH.handlePasswordConfirm(data) };



    //
    // Logged-in user routes.
    //
    APP.route['/']                  = function (data) { APP.FORM.renderListing(data) };
    APP.route['/logout']            = function (data) { APP.AUTH.logOut(data) };
    APP.route['/categorizations']   = function (data) { APP.FORM.handleChoicesAndCategorizations(data) };
    APP.route['/translations']      = function (data) { APP.LANG.renderUITranslations(data) };
    APP.route['/translations/form'] = function (data) { APP.FORM.renderTranslationsEditing(data) };
    APP.route['/translations/ui']   = function (data) { APP.LANG.renderUITranslations(data) };



    APP.route.beforeRender = function (callback) {
        APP.progressBar.show();
        var data = {};

        APP.service.getLanguages(function (response) {
            if (!response.error) {
                data.lanaguages = response.data.languages;
                data.enabledLanguages = response.data.enabledLanguages;
                data.lang = APP.LANG.getCurrentLanguageCode();

                APP.service.getUITranslations({ lang: data.lang }, function (response) {
                    if (!response.error) {
                        APP.LANG.translations = data.translations = response.data;

                        if (APP.currentUser) {
                            APP.service.getForm({ lang: data.lang }, function (response) {
                                data.form = response.data[0];
                                callback(data);
                            });
                        } else {
                            callback(data);
                        }
                    }
                });
            }
        });
    };

    APP.route.afterRender = function (data) {
        APP.progressBar.hide();
        APP.LANG.setLanguageCode(data.lang);
        APP.LANG.translateUI();

        var pParts = location.pathname.split('/');
        var rootPath = '/' + (pParts[1] || '');
        var subPath = pParts[2] ? '/' + pParts[2] : '';
        
        jQuery('#nav > a').removeClass('nav-active');
        jQuery('#nav > a[href="' + rootPath + '"]').addClass('nav-active');

        var subNav = jQuery('#sub-nav').hide();
        var subNavLinks = jQuery('#sub-nav > a');
        jQuery('body').removeClass('sub-nav-visible');

        if (subNavLinks.length) {
            subNav.show();
            jQuery('body').addClass('sub-nav-visible');
            subNavLinks.removeClass('sub-nav-active');
            jQuery('#sub-nav > a[href="' + rootPath + subPath + location.search + '"]').addClass('sub-nav-active');

            if (!jQuery('.sub-nav-active').length) {
                subNav.find('a:first-child').addClass('sub-nav-active');
            }
        }
    };

})();