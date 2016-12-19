(function () {
    'use strict';
    
    APP.REPORTS = {};


    APP.REPORTS.renderList = function (data) {
        APP.service.getFormResponses({ lang: data.lang, form_id: data.form.id }, function (response) {
            if (!response.error) {
                data.reports = response.data;
                APP.render(APP.TEMPLATE.reports.list, data);
                afterListRender();

                function afterListRender() {
                    jQuery('.rl-item').matchHeight();
                    APP.REPORTS.lazyview();
                }                

                // Date filters
                var firstResponseDate = new Date(data.reports[data.reports.length - 1].datetime);
                var lastResponseDate  = new Date(data.reports[0].datetime);
                var dateFromEl = jQuery('input[name="date-from"]').val(APP.formatDate(firstResponseDate));
                var dateToEl = jQuery('input[name="date-to"]').val(APP.formatDate(lastResponseDate));

                var datepickerConfig = {
                    dateFormat: 'yy-mm-dd',
                    firstDay: 1,
                    changeMonth: true,
                    changeYear: true,
                    maxDate: new Date()
                };
                dateFromEl.datepicker(datepickerConfig);
                dateToEl.datepicker(datepickerConfig);
                
                jQuery('.rl-date-filters > button').on('click', function () {
                    APP.service.getFormResponses({ 
                        lang: data.lang, 
                        from: dateFromEl.val(), 
                        to: dateToEl.val() 
                    }, function (responses) {
                        if (!responses.error) {
                            data.reports = responses.data;
                            jQuery('#rl-items').html(APP.TEMPLATE.reports._items(data));
                            afterListRender();
                        }
                    });
                });

                // Search
                var lazyviewButton = jQuery('.rl-load-more');
                
                function filterTable(text) {
                    if (text.length > 0) {
                        jQuery('.rl-item').hide().filter(":contains('" + text + "')").show();
                        lazyviewButton.hide();
                    } else if (text.length === 0) {
                        jQuery('.rl-item').show();
                        lazyviewButton.show();
                        APP.REPORTS.lazyview();
                    }
                };

                jQuery('.rl-search').on('keyup', function () {
                    filterTable(this.value);
                });
            }
        });
    };



    //
    // Hide lengthy list of items and lazy view them on a button click.
    //
    APP.REPORTS.lazyview = function (options) {
        options = options || {};
        options.initialItems = options.initialItems || 8;
        options.loadItems    = options.loadItems    || 8;

        var items  = jQuery('.rl-item').hide();
        var button = jQuery('.rl-load-more');
        var index  = options.initialItems;
        var length = items.length;

        if (index >= length) {
            button.hide();
        }

        items.slice(0, options.initialItems).show();

        button.on('click', function () {
            items.slice(index, index + options.loadItems).show();
            index += options.loadItems;

            if (index >= length) {
                jQuery(this).hide();
            }
        });
    };



    APP.REPORTS.renderDetailedView = function (data) {
        APP.service.getFormResponses({ 
            lang: data.lang, 
            form_id: data.form.id, 
            id: APP.params.id 
        }, function (response) {
            if (!response.error) {
                data.reports = response.data;
                data.report = APP.findObject(data.reports, { response_id: APP.params.id }); // temporary solution.
                APP.render(APP.TEMPLATE.reports.detailedView, data);
                jQuery('.report-page li').matchHeight();
            }
        });
    };

})();