(function () {
    'use strict';
    
    APP.LANG = {};



    //
    // Array of translations for the current active language.
    // This should be pre-filled in order to use APP.LANG.translateUI() and APP.LANG.text()
    // functions without passing `translations` parameter to them.
    //
    APP.LANG.translations = [];



    APP.LANG.getCurrentLanguageCode = function () {
        var langCode = APP.getCookie(APP.config.langCookieName);

        if (langCode === 'undefined') {
            langCode = undefined;
        }

        if (!langCode) {
            langCode = APP.config.defaultUILanguage;
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



    APP.LANG.renderUITranslations = function (data) {
        APP.service.getUITranslations({}, function (response) {
            if (!response.error) {
                data.uiTranslations = response.data.filter(function (tItem) {
                    return tItem.t_group.indexOf('admin') === -1;
                });
                APP.render(APP.LANG.buildTranslationEditingHTML(data), data);

                jQuery('.uit-item input').on('change', function () {
                    jQuery(this).addClass('uit-input-changed');
                });

                jQuery('.h-save-button').on('click', function () {
                    var btn = jQuery(this);
                    var translations = [];
                    
                    jQuery('.uit-input-changed[data-key]').each(function () {
                        var key  = this.getAttribute('data-key');
                        var lang = this.getAttribute('data-lang');

                        translations.push({ t_key: key, lang: lang, t_value: this.value });
                    });

                    btn.addClass('h-button-submitting');

                    APP.service.updateUITranslations({
                        ui_translations: translations
                    }, function (response) {
                        if (!response.error) {
                            btn.removeClass('h-button-submitting');
                            btn.addClass('h-button-saved');

                            setTimeout(function () {
                                btn.removeClass('h-button-saved');
                            }, 1500);
                        } else {
                            APP.modalMessage({ title: 'Error', text: response.error });
                        }
                    });
                });
            }

            APP.route.afterRender(data);
        });
    };



    APP.LANG.buildTranslationEditingHTML = function (data) {
        var html = '';

        function getTranslationLabel(tList, langCode) {
            var t = APP.findObject(tList, { lang: langCode }); 
            var val = t && t.t_value ? t.t_value : '';
            return APP.stripHtmlTags(val);
        }

        if (Array.isArray(data.uiTranslations)) {
            html += '<ol class="ui-translations">';
            data.uiTranslations.forEach(function (uit) {
                html += '<li class="uit-item">';

                data.enabledLanguages.forEach(function (lang) {
                    html += '<div><em>' + lang.code + '</em>';
                    html += '<input type="text" data-key="' + uit.t_key + 
                            '" data-lang="' + lang.code + 
                            '" data-rtl="' + lang.rtl + 
                            '" value="' + getTranslationLabel(uit.translations, lang.code) + 
                            '" />';
                    html += '</div>';
                });

                html += '</li>';
            });
            html += '</ol>';
        }

        return html;
    };

})();