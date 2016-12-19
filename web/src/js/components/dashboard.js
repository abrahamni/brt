(function () {
    'use strict';
    
    APP.DASHBOARD = {};


    APP.DASHBOARD.render = function (data) {
        APP.render(APP.TEMPLATE.dashboard, data);

        APP.service.getFormResponses({ lang: data.lang, form_id: data.form.id }, function (response) {
            if (!response.error) {
                data.reports = response.data.slice(0, 8);
                jQuery('#rl-items').html(APP.TEMPLATE.reports._items(data));
                jQuery('.rl-item').matchHeight();
                APP.FORM.create('#form', data);
                APP.MAP.create('#map', data);
            }
        });

        APP.service.getBarChartData({
            lang: data.lang,
            x_axis: 1,
            y_axis: 3,
            chart_type: 'column'
        }, function (response) {
            if (!response.error) {
                var chartData = APP.merge(APP.config.chart, response.data, {
                    plotOptions: {
                        column: {
                            stacking: 'normal'
                        }
                    }
                });
                
                var series = [];
                chartData.series.forEach(function (item) {
                    var total = item.data.reduce(function (previousValue, currentValue) {
                        return previousValue + currentValue;
                    });
                    if (total > 0) {
                        series.push(item);
                    }
                });
                chartData.series = series;

                APP.heyChart(document.querySelector('#chart'), chartData, {  
                    theme: 'white', 
                    rtl: data.lang === 'en' 
                });
            }
        });

        APP.service.getBarChartData({
            lang: data.lang,
            x_axis: 1,
            y_axis: 4,
            chart_type: 'column'
        }, function (response) {
            if (!response.error) {
                var chartData = APP.merge(APP.config.chart, response.data, {
                    plotOptions: {
                        column: {
                            stacking: 'normal'
                        }
                    }
                });
                
                var series = [];
                chartData.series.forEach(function (item) {
                    var total = item.data.reduce(function (previousValue, currentValue) {
                        return previousValue + currentValue;
                    });
                    if (total > 0) {
                        series.push(item);
                    }
                });
                chartData.series = series;

                APP.heyChart(document.querySelector('#chart2'), chartData, {  
                    theme: 'white', 
                    rtl: data.lang === 'en' 
                });
            }
        });
    };

})();
