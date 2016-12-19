/*!
    Route handlers.
*/

(function () {
    'use strict';

    APP.route = {};



    APP.route['/']            = function (data) { APP.DASHBOARD.render(data) };
    APP.route['/about']       = function (data) { APP.STATIC_PAGES.renderAboutPage(data) };
    APP.route['/reports']     = function (data) { APP.REPORTS.renderList(data) };
    APP.route['/view-report'] = function (data) { APP.REPORTS.renderDetailedView(data) };



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

                        APP.service.getForm({ lang: data.lang }, function (response) {
                            data.form = response.data;
                            data.categorizationItems = APP.FORM.grabCategorizationItems(data.form);
                            callback(data);
                        });
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

        if (location.pathname === '/') {
            jQuery('body').addClass('dashboard-page');
        } else {
            jQuery('body').removeClass('dashboard-page');
        }

        // jQuery('#lang-switch > span').on('click', function () {
        //     var lang = this.getAttribute('data-lang');
        //     APP.LANG.setLanguageCode(lang);
        //     window.location.reload();
        // });
    };

})();