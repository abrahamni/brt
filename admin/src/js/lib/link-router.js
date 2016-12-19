/*!
    LinkRouter
    Minimalist router for single page web-applications.

    Lasha Tavartkiladze
    2016-03-23
*/

(function () {
    'use strict';

    var hasHistoryAPI = (window.history && history.pushState);
    var forEach       = Array.prototype.forEach;
    var doNothing     = function () {};



    function LinkRouter(options) {
        if (!(this instanceof LinkRouter)) {
            return new LinkRouter(options);
        }

        options = options || {};

        var r = this;

        r.skipSelector = options.skipSelector || 'a:not([target]):not([href="#"])';
        r.onChange = options.onChange || doNothing;

        r.linkHandler = function (e) {
            e.preventDefault();
            r.pushState(this.href);
        };

        function onPopState() {
            r.changed();
        }

        // Workaround for old Chrome and Safari firing 'popstate' on page load.
        window.addEventListener('load', function () {
            setTimeout(function () {
                window.addEventListener('popstate', onPopState);
            }, 0);
        });

        return r;
    }



    //
    // Push history state and call APP.router() afterwards.
    //
    LinkRouter.prototype.pushState = function (url) {
        history.pushState({}, null, url);
        this.changed();

        if (document.documentElement.scrollIntoView) {
            document.documentElement.scrollIntoView();
        }

        return this;
    };



    //
    // Change default behavior of router enabled links.
    //
    LinkRouter.prototype.link = LinkRouter.prototype.relink = function () {
        var r = this;

        if (hasHistoryAPI) {
            forEach.call(document.querySelectorAll(r.skipSelector), function (a) {
                a.removeEventListener('click', r.linkHandler);
                a.addEventListener('click', r.linkHandler);
            });
        }

        return r;
    };



    //
    // This is the function that is called each time a browser's url changes.
    //
    LinkRouter.prototype.changed = function () {
        this.onChange(location.pathname);
        return this;
    };



    //
    // Reattach all <a> tags and execute change event.
    //
    LinkRouter.prototype.start = LinkRouter.prototype.restart = function () {
        return this.link().changed();
    };



    //
    // "Redirect" user to another page.
    //
    LinkRouter.prototype.redirect = function (url) {
        if (hasHistoryAPI) {
            this.pushState(url);
        } else {
            location.href = url;
        }

        return this;
    };



    //
    // Public API
    //
    APP.LinkRouter = LinkRouter;

})();