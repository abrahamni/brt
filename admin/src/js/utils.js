/*!
    Helper functions.
*/

(function () {
    'use strict';



    //
    // Progress bar
    //
    APP.progressBar = {
        markup: '<div class="progress-bar"><span></span></div>',
        show: function () {
            var bar = jQuery(this.markup).prependTo(document.body);
            setTimeout(function () {
                bar.addClass('progress-bar-show');
            }, 0);
        },
        hide: function () {
            jQuery('.progress-bar').remove();
        }
    };



    //
    // Confirm action modal window.
    //
    APP.confirmAction = function (triggerSelector, options) {
        var modalHTML =  '<div>';
            modalHTML += '<h2>' + options.title + '</h2>';
            modalHTML += '<p>' + options.description + '</p>';
            modalHTML += '</div>';

        jQuery(triggerSelector).on('click', function (e) {
            e.preventDefault();

            var buttons = {};
            buttons[options.actionLabel || 'Delete'] = function() {
                jQuery(this).dialog('destroy');
                if (typeof options.action === 'function') {
                    options.action(e.currentTarget, e);
                }
            };
            buttons['Cancel'] = function() {
                jQuery(this).dialog('destroy');
            };

            jQuery(modalHTML).dialog({
                dialogClass: 'admin-modal-confirm-action',
                resizable: false,
                width: options.width || 500,
                height: options.height || 220,
                modal: true,
                buttons: buttons
            });
        });
    };



    //
    // Show a modal message to user.
    //
    APP.modalMessage = function (options) {
        options = options || {};

        var modalHTML =  '<div>';
            modalHTML += '<h2>' + options.title + '</h2>';
            modalHTML += '<p>' + options.text + '</p>';
            modalHTML += '</div>';

        jQuery(modalHTML).dialog({
            dialogClass: 'admin-modal-message',
            resizable: false,
            width: options.width || 500,
            height: options.height || 190,
            modal: true,
            buttons: {
                Close: function () {
                    jQuery(this).dialog('destroy');

                    if (typeof options.action === 'function') {
                        options.action(e.currentTarget, e);
                    }
                }
            }
        });
    };



    //
    // Convinient wrapper for resolving file urls.
    //
    APP.fileUrl = function (filename) {
        if (!filename) { 
            return ''; 
        } else if (/http:|https:/.test(filename)) {
            return filename;
        } else {
            if (filename[0] !== '/') {
                filename = '/' + filename;
            }
            return APP.config.publicFilesUrlPath + filename;
        }
    };



    //
    // Try to get an user's full name.
    //
    APP.resolveUserFullName = function (user) {
        if (!user) { return '' };

        if (user.first_name) {
            return user.first_name + ' ' + user.last_name;
        } else {
            return user.email.split('@')[0];
        }
    };



    //
    // Use Javascript's defineProperty to make `APP.params`
    // act like an object that contains all query string parameters.
    //
    Object.defineProperty(APP, 'params', {
        get: function () {
            var params = {};

            if (APP.cache[location.href]) {
                return APP.cache[location.href];

            } else if (location.search.length > 1) {
                location.search.slice(1).split('&').forEach(function (param) {
                    var pair = param.split('=');
                    var key  = decodeURIComponent(pair[0]);
                    var val  = decodeURIComponent(pair[1]);
                    params[key] = val;
                });
                APP.cache[location.href] = params;
            }

            return params;
        }
    });



    //
    // Extend an object recursively with properties from other objects.
    //
    APP.extend = function (target) {
        var i, obj, prop, objects = Array.prototype.slice.call(arguments, 1);

        target = target || {};

        for (i = 0; i < objects.length; i += 1) {
            obj = objects[i];
            
            if (obj) for (prop in obj) if (obj.hasOwnProperty(prop)) {
                if (Object.prototype.toString.call(obj[prop]) === '[object Object]') {
                    target[prop] = target[prop] || {};
                    APP.extend(target[prop], obj[prop]);
                } else {
                    target[prop] = obj[prop];
                }
            }
        }

        return target;
    };



    //
    // Merge any number of objects into a new object.
    //
    APP.merge = function () {
        var objects = Array.prototype.slice.call(arguments);
        return APP.extend.apply(null, [{}].concat(objects));
    };



    //
    // Get top level domain name from widnow.location.host
    //
    APP.getDomainName = function () {
        var parts = location.host.split('.');
        var length = parts.length;

        if (length > 1) {
            return parts[length - 2] + '.' + parts[length - 1];
        } else {
            return location.host;
        }
    };



    //
    // Return date string in this format: 2015-07-25
    //
    APP.formatDate = function (date, options) {
        options = options || {};

        if (typeof date === 'string') {
            date = new Date(date);
        }

        var year   = date.getFullYear();
        var month  = APP.padZero(date.getMonth() + 1);
        var day    = APP.padZero(date.getDate());
        var hour   = APP.padZero(date.getHours());
        var minute = APP.padZero(date.getMinutes());
        var time   = '';

        if (options.includeTime) {
            time = ' ' + hour + ':' + minute;
        }

        return year + '-' + month + '-' + day + time;
    };



    //
    // Prepend zero to a number if it's less then tan.
    // Useful for values returned by Date objects.
    //
    APP.padZero = function (num) {
        return num < 10 ? '0' + num : num;
    };



    //
    // From an array of obejcts find the one 
    // that contains the passed key/value pair.
    //
    APP.findObject = function (objects, searchPair) {
        if (!Array.isArray(objects) || typeof searchPair !== 'object') return;

        var name  = Object.keys(searchPair)[0];
        var value = searchPair[name];

        for (var i = 0; i < objects.length; i += 1) {
            if (objects[i][name] === value) {
                return objects[i];
            }
        }

        return {};
    };



    //
    // Round to at most 2 decimal places
    //
    APP.roundNumber = function (num) {
        return Math.round(num * 100) / 100;
    };



    //
    // Remove all HTML tags from a string.
    //
    APP.stripHtmlTags = function (str) {
        return typeof str === 'string' ? str.replace(/<[^>]+>/ig, '') : '';
    };



    //
    // Truncate text if it's bigger than specified length.
    //
    APP.truncate = function (str, length, textToAppend) {
        length = length || 50;
        textToAppend = textToAppend || '...';

        if (str.length > length) {
            return str.substr(0, length) + textToAppend;
        } else {
            return str;
        }
    };



    _.escape = function (string) {
        var matchHtmlRegExp = /["'&<>]/;
        var str = '' + string;
        var match = matchHtmlRegExp.exec(str);

        if (!match) {
            return str;
        }

        var escape;
        var html = '';
        var index = 0;
        var lastIndex = 0;

        for (index = match.index; index < str.length; index++) {
            switch (str.charCodeAt(index)) {
              case 34: // "
                escape = '&quot;';
                break;
              case 38: // &
                escape = '&amp;';
                break;
              case 39: // '
                escape = '&#39;';
                break;
              case 60: // <
                escape = '&lt;';
                break;
              case 62: // >
                escape = '&gt;';
                break;
              default:
                continue;
            }

            if (lastIndex !== index) {
                html += str.substring(lastIndex, index);
            }

            lastIndex = index + 1;
            html += escape;
        }

        return  lastIndex !== index
                ? html + str.substring(lastIndex, index)
                : html;
    };

})();