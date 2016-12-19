/*!
    heyChart
    HighCharts wrapper with beautiful themes.

    Lasha Tavartkiladze
    2015-12-22
*/

(function () {
    'use strict';


    //
    // Better defaults.
    //
    var defaults = extend({}, Highcharts.getOptions(), {
        colors: [
            '#71308f', // violet
            '#ff2355', // purple
            '#007cf6', // blue
            '#48c9f5', // sky blue
            '#18d975', // green
            '#ffcb45', // yellow
            '#ff9333', // orange
            '#ff3336', // red
            '#b7db29', // light green
            '#de2670', // pink
        ],
        chart: {
            style: {
                fontFamily: 'inherit'
            },
            spacing: [60, 50, 50, 50], // Chart margins.
            events: {
                load: onRender
            }
        },
        credits: {
            enabled: false
        },
        // The legend is a box containing a symbol and name for each series item or point item in the chart.
        legend: {
            itemStyle: { fontWeight: 'normal' },
            itemHoverStyle: null,
            itemHiddenStyle: { fontWeight: 'normal' },
            itemCheckboxStyle: { fontWeight: 'normal' }
        },
        // A collection of options for buttons and menus appearing in the exporting module.
        navigation: {
            buttonOptions: {
                symbolFill: '',
                symbolStrokeWidth: 0,
                theme: {
                    'stroke-width': 0,
                    stroke: '',
                    r: 0
                }
            },
            menuStyle: {
                padding: 0,
                background: '',
                border: ''
            },
            menuItemStyle: {
                'padding': '10px',
                'transition': 'all 0.15s',
                '-webkit-transition': 'all 0.15s'
            }
        },
        exporting: {
            chartOptions: {
                title: null,
                subtitle: null
            }
        },
        // The plotOptions is a wrapper object for config objects for each series type. 
        // Configuration options for the series are given in three levels: 
        // 1. Options for all series in a chart are given in the plotOptions.series object. 
        // 2. Then options for all series of a specific type are given in the plotOptions of that type, for example plotOptions.line. 
        // 3. Next, options for one single series are given in the series array.
        plotOptions: {
            series: {
                borderWidth: 0,
                patternFixed: null,
                marker: {
                    states: {
                        hover: {
                            lineWidthPlus: 0
                        }
                    }
                }
            },
            line: {
                marker: {
                    enabled: false
                }
            },
            area: {
                lineWidth: 1,
                states: {
                    hover: {
                        lineWidth: 1
                    }
                }
            },
            bubble: {
                marker: {
                    lineWidth: 0,
                    states: {
                        hover: {
                            lineWidth: 0,
                            lineWidthPlus: 0
                        },
                        select: {
                            lineWidth: 0
                        }
                    }
                }
            }
        },
        title: {
            text: null,
            margin: 0,
            style: {
                padding: '0 0 30px 0',
                fontSize: '36px',
                fontWeight: 200
            }
        },
        subtitle: {
            text: null,
            style: {
                padding: '0 0 30px 0',
                fontSize: '18px',
                fontWeight: 200
            }
        },
        tooltip: {
            borderWidth: 0,
            shadow: false
        },
        xAxis: {
            tickWidth: 0,      // The pixel length of the main tick marks. Looks ugly, so removed.
            gridLineWidth: 0,  // The width of the grid lines extending the ticks across the plot area. 
            lineWidth: 0       // The width of the line marking the axis itself.
        },
        yAxis: {
            gridLineWidth: 1,
            gridLineDashStyle: 'Solid'
        }
    });



    //
    // Clean some stuff after chart is rendered.
    //
    function onRender() {
        var chartEl = this.renderTo;
        var exportBtn = chartEl.querySelector('.highcharts-button');

        if (exportBtn) exportBtn.addEventListener('click', function () {
            if (!exportBtn.__clicked__) {
                // Remove ugly <hr />
                var hr = chartEl.querySelector('.highcharts-contextmenu hr');
                if (hr) hr.parentNode.removeChild(hr);

                // Remove "print" button. Printing is too buggy to be useful.
                var printBtn = chartEl.querySelector('.highcharts-contextmenu > div > div:first-child');
                if (printBtn) printBtn.parentNode.removeChild(printBtn);

                // Make sure above is done only once per chart object.
                exportBtn.__clicked__ = true;
            }
        });
    }



    //
    // "Themes"
    //
    var themes = {};
    themes.dark = {
        backgroundColor                : '#282828',
        titleColor                     : 'rgba(255, 255, 255, 0.9)',
        legendColor                    : 'rgba(255, 255, 255, 0.6)',
        legendHiddenColor              : 'rgba(255, 255, 255, 0.2)',
        gridLineColor                  : 'rgba(255, 255, 255, 0.05)',
        tooltipBackgroundColor         : 'rgba(25, 25, 25, 0.8)',
        tooltipColor                   : 'rgba(255, 255, 255, 0.9)',
        exportButtonBackgroundColor    : '#181818',
        exportButtonColor              : 'rgba(255, 255, 255, 0.3)',
        exportMenuShadow               : '0 0 10px rgba(0, 0, 0, 0.2)',
        exportItemBorder               : '1px solid #252525',
        exportItemBackgroundColor      : '#181818',
        exportItemColor                : 'rgba(255, 255, 255, 0.6)',
        exportItemHoverBackgroundColor : '#000',
        exportItemHoverColor           : '#fff',
    };
    themes.light = {
        backgroundColor                : 'rgb(240, 240, 240)',
        titleColor                     : 'rgba(0, 0, 0, 0.9)',
        legendColor                    : 'rgba(0, 0, 0, 0.65)',
        legendHiddenColor              : 'rgba(162, 162, 162, 1)',
        gridLineColor                  : 'rgba(0, 0, 0, 0.05)',
        tooltipBackgroundColor         : 'rgba(25, 25, 25, 0.8)',
        tooltipColor                   : 'rgba(255, 255, 255, 0.9)',
        exportButtonBackgroundColor    : 'rgb(253, 253, 253)',
        exportButtonColor              : 'rgba(0, 0, 0, 0.3)',
        exportMenuShadow               : '0 0 10px rgba(0, 0, 0, 0.2)',
        exportItemBorder               : '1px solid #dedede',
        exportItemBackgroundColor      : 'rgb(253, 253, 253)',
        exportItemColor                : 'rgba(0, 0, 0, 0.6)',
        exportItemHoverBackgroundColor : '#f5f5f5',
        exportItemHoverColor           : '#000',
    };
    themes.white = extend({}, themes.light, {
        backgroundColor                : '#fff',
        exportButtonBackgroundColor    : '#efefef',
        exportItemBackgroundColor      : '#efefef',
        exportItemHoverBackgroundColor : 'rgb(253, 253, 253)'
    });
    themes.whitePurple = extend({}, themes.light, {
        backgroundColor                : 'rgba(87, 44, 107, 0.03)',
        gridLineColor                  : 'rgba(87, 44, 107, 0.12)'
    });



    //
    // Convert a "theme" to Highcharts options.
    //
    function themeOptions(theme) {
        theme = themes[theme];

        return {
            colors: theme.colors || defaults.colors,
            chart: {
                backgroundColor: theme.backgroundColor
            },
            legend: {
                itemStyle: {
                    fill: theme.legendColor,
                    color: theme.legendColor,
                },
                itemHiddenStyle: {
                    fill: theme.legendHiddenColor,
                    color: theme.legendHiddenColor
                }
            },
            navigation: {
                buttonOptions: {
                    symbolStroke: theme.exportButtonColor,
                    theme: {
                        fill: theme.exportButtonBackgroundColor,
                        states: {
                            hover: {
                                fill: theme.exportButtonBackgroundColor
                            },
                            select: {
                                fill: theme.exportButtonBackgroundColor
                            }
                        }
                    }
                },
                menuStyle: {
                    MozBoxShadow: theme.exportMenuShadow,
                    WebkitBoxShadow: theme.exportMenuShadow,
                    boxShadow: theme.exportMenuShadow
                },
                menuItemStyle: {
                    borderBottom: theme.exportItemBorder,
                    background: theme.exportItemBackgroundColor,
                    color: theme.exportItemColor
                },
                menuItemHoverStyle: {
                    background: theme.exportItemHoverBackgroundColor,
                    color: theme.exportItemHoverColor
                }
            },
            title: {
                style: {
                    fill: theme.titleColor,
                    color: theme.titleColor
                }
            },
            subtitle: {
                style: {
                    fill: theme.titleColor,
                    color: theme.titleColor
                }
            },
            tooltip: {
                backgroundColor: theme.tooltipBackgroundColor,
                style: {
                    color: theme.tooltipColor,
                    fill: theme.tooltipColor
                }
            },
            xAxis: {
                gridLineColor: theme.gridLineColor
            },
            yAxis: {
                gridLineColor: theme.gridLineColor,
                minorGridLineColor: theme.gridLineColor
            }
        };
    }



    //
    // Create a chart.
    //
    function heyChart(elem, options, settings) {
        settings = settings || {};
        settings.theme = settings.theme || 'whitePurple';

        var rtlOptions;

        if (settings.rtl) {
            rtlOptions = {
                labels: {
                    useHTML: true
                },
                legend: {
                    useHTML: true,
                    rtl: true
                },
                xAxis: {
                    reversed: true
                },
                yAxis: {
                    title: {
                        useHTML: true
                    },
                    opposite: true
                },
                title: {
                    useHTML: true
                },
                subtitle: {
                    useHTML: true
                },
                tooltip: {
                    useHTML:true
                }
            };
        }

        options = extend({
            chart: {
                renderTo: elem
            }
        }, defaults, rtlOptions, themeOptions(settings.theme), options);

        return new Highcharts.Chart(options);
    }



    //
    // Extend an object recursively with properties from other objects.
    //
    function extend(target) {
        var i, obj, prop, objects = Array.prototype.slice.call(arguments, 1);

        target = target || {};

        for (i = 0; i < objects.length; i += 1) {
            obj = objects[i];
            
            if (obj) for (prop in obj) if (obj.hasOwnProperty(prop)) {
                if (Object.prototype.toString.call(obj[prop]) === '[object Object]') {
                    target[prop] = target[prop] || {};
                    extend(target[prop], obj[prop]);
                } else {
                    target[prop] = obj[prop];
                }
            }
        }

        return target;
    }



    //
    // Public API
    //
    APP.heyChart = heyChart;

})();