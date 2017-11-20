(function () {
    'use strict';

    APP.DATALAB = {};



    APP.DATALAB.render = function (data) {
        APP.render('');
        APP.route.afterRender(data);
    };

})();