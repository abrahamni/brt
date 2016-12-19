(function () {
    'use strict';
    
    APP.LANG = {};



    //
    // Array of translations for the current active language.
    // This should be pre-filled before using APP.LANG.translateUI() and APP.LANG.text()
    // functions without passing `translations` parameter to them.
    //
    APP.LANG.translations = [];



    APP.LANG.getCurrentLanguageCode = function () {
        var langCode = APP.getCookie(APP.config.langCookieName);

        if (langCode === 'undefined') {
            langCode = undefined;
        }

        if (!langCode) {
            langCode = APP.config.defaultLanguage;
        }

        return langCode;
    };



    APP.LANG.setLanguageCode = function (lang) {
        APP.setCookie(APP.config.langCookieName, lang, 365);
        jQuery('#lang-switch > span').removeClass('lang-active');
        jQuery('#lang-switch > span[data-lang="' + lang + '"]').addClass('lang-active');
        jQuery('html').removeClass().addClass('lang-' + lang);
    };



    //
    // Get value from translations list.
    //
    function getValue(translations, key) {
        for (var i = 0; i < translations.length; i += 1) {
            if (translations[i].t_key === key) {
                return translations[i].t_value;
            }
        }
    }



    //
    // Translate all elements.
    //
    APP.LANG.translateUI = function (translations) {
        translations = translations || APP.LANG.translations;

        if (translations.length) {
            jQuery('[data-translation-key]').each(function () {
                var key = this.getAttribute('data-translation-key');
                this.innerHTML = getValue(translations, key);
            });

            jQuery('[data-translation-placeholder-key]').each(function () {
                var key = this.getAttribute('data-translation-placeholder-key');
                this.setAttribute('placeholder', getValue(translations, key));
            });

            jQuery('[data-translation-image-key]').each(function () {
                var key = this.getAttribute('data-translation-image-key');
                this.setAttribute('src', getValue(translations, key));
            });
        }
    };



    //
    // Get translated text.
    //
    APP.LANG.text = function (key, translations) {
        translations = translations || APP.LANG.translations;

        if (translations.length) {
            return getValue(translations, key);
        } else {
            return '';
        }
    };

})();