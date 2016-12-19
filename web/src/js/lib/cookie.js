/*!
    Cookie helper.

    xxxxx
*/

(function () {
    'use strict';

    var toString = Object.prototype.toString;
    var second  = 1000;
    var minute  = second * 60;
    var hour    = minute * 60;
    var day     = hour   * 24;
    var week    = day    * 7;
    var month   = week   * 4;
    var year    = month  * 12;



    //
    // Set cookie with handy helpers for setting expiration date.
    //
    //    APP.setCookie('key', 'value', { expires: '2 weeks' })
    //    APP.setCookie('key', 'value', { expires: '1 day', domain: 'example.com' })
    //
    function setCookie(name, value, options) {
        options = options || {};

        var cookies = [name + '=' + encodeURIComponent(value)];
        var exp     = options.expires;
        var date    = new Date();
        var stamp   = date.getTime();
        var n;

        if (exp) {
            if (Object.prototype.toString.call(exp) === '[object Date]') {
                cookies.push('Expires=' + exp.toUTCString());

            } else if (typeof exp === 'string') {
                n = parseInt(exp, 10);

                if (exp.indexOf('minute') !== -1) {
                    date.setTime(stamp + (minute * n));

                } else if (exp.indexOf('hour') !== -1) {
                    date.setTime(stamp + (hour * n));

                } else if (exp.indexOf('day') !== -1) {
                    date.setTime(stamp + (day * n));

                } else if (exp.indexOf('week') !== -1) {
                    date.setTime(stamp + (week * n));

                } else if (exp.indexOf('year') !== -1) {
                    date.setTime(stamp + (year * n));

                } else {
                    date.setTime(stamp + (month * n));
                }

                cookies.push('Expires=' + date.toUTCString());

            } else if (typeof exp === 'number') {
                date.setTime(stamp + exp);
                cookies.push('Expires=' + date.toUTCString());
            }
        }

        if (options.domain) {
            cookies.push('Domain=' + options.domain);
        }

        if (options.path) {
            cookies.push('Path=' + options.path);
        } else {
            cookies.push('Path=/');
        }

        if (options.httpOnly) {
            cookie.push('HttpOnly');
        }

        if (options.secure) {
            cookie.push('Secure');
        }

        document.cookie = cookies.join('; ');
    }



    function getCookie(name) {
        var cookies = document.cookie.split(';');
        var i, pair, key, value;

        for (i = 0; i < cookies.length; i += 1) {
            if (!cookies[i]) continue;
            
            pair = cookies[i].split('=');

            key   = pair[0].trim();
            value = pair[1].trim();

            if (key === name) {
                return decodeURIComponent(value);
            }
        }
    }



    function deleteCookie(name) {
        setCookie(name, '', { expires: -(day) });
    }



    //
    // Public API
    //
    APP.setCookie = setCookie;
    APP.getCookie = getCookie;
    APP.deleteCookie = deleteCookie;

})();
