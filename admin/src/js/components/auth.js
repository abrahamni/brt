(function () {
    'use strict';

    APP.AUTH = {};



    APP.AUTH.handleLogIn = function (data) {
        APP.render(APP.TEMPLATE.auth.login, data, { layout: false });
        APP.route.afterRender(data);

        var form = jQuery('#admin-login');
        var err = form.find('.form-error');

        function handleForm(e) {
            err.slideUp('fast');
            e.preventDefault();

            var email  = form.find('input[name="email"]').val();
            var passwd = form.find('input[name="password"]').val();

            if (!email || !passwd) {
                return err.html(APP.LANG.text('empty-fields')).slideDown('fast');
            }

            form.addClass('form-submitting');

            APP.service.logIn({
                email: email,
                password: passwd
            }, function (response) {
                form.removeClass('form-submitting');

                if (response.error) {
                    err.html(APP.LANG.text('invalid-credentials')).slideDown('fast');
                } else {
                    APP.AUTH.afterLogIn(response.data, { redirect: '/' });
                }
            });
        }

        form.on('submit', handleForm);
    };



    APP.AUTH.afterLogIn = function (user, options) {
        APP.currentUser = user;
        APP.setCookie(APP.config.sessionCookieName, user.session_token);
        if (options && options.redirect) {
            APP.router.redirect(options.redirect);
        }
    };



    APP.AUTH.logOut = function (data) {
        APP.service.logOut();
        APP.deleteCookie(APP.config.sessionCookieName);
        location.href = '/';
    };

})();