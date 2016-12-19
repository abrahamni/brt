(function () {
    'use strict';
    
    APP.STATIC_PAGES = {};


    APP.STATIC_PAGES.renderAboutPage = function (data) {
        APP.render(APP.TEMPLATE.about, data);
    };

})();