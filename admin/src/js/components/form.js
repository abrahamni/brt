(function () {
    'use strict';

    APP.FORM = {};



    APP.FORM.renderListing = function (data) {
        APP.service.getFormResponses({ lang: data.lang }, function (responses) {
            data.responses = responses.data;
            APP.render(APP.TEMPLATE.responses, data);
            APP.route.afterRender(data);

            initResponseListContent();

            // Status filter
            jQuery('input[name="status"]').on('change', function () {
                filterStatusItems(this.value);
            });

            // Date filters
            var firstResponseDate = new Date(data.responses[data.responses.length - 1].datetime);
            var lastResponseDate  = new Date(data.responses[0].datetime);
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
                        data.responses = responses.data;
                        jQuery('.reports-list').html(APP.TEMPLATE._responseList(data));
                        initResponseListContent();
                        filterStatusItems(jQuery('input[name="status"]:checked').val());
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
                    APP.FORM.lazyview();
                }
            };

            jQuery('#search').on('keyup', function () {
                filterTable(this.value);
            });
        });

        function filterStatusItems(status) {
            jQuery('.rl-item').show();
                
            if (status) {
                jQuery('.rl-item').not('[data-status="' + status + '"]').hide();
            }
        }

        function initResponseListContent() {
            APP.FORM.lazyview();

            jQuery('.rl-item-content').niceScroll({
                horizrailenabled: true,
                autohidemode: 'leave',
                hidecursordelay: 100,
                cursorborder: 'none',
                cursorwidth: 4,
                background: '#f5f5f5',
                cursorcolor: '#d0d0d0',
                scriptpath: '/img'
            });

            setTimeout(function () {
                jQuery('.rl-item-buttons, .rl-item-content').matchHeight();
            }, 0);

            // Aprpove a response
            jQuery('.rl-item-button-approve').on('click', function () {
                var btn  = jQuery(this);
                var item = btn.closest('.rl-item');
                var id   = item.attr('data-id');

                APP.service.approveFormResponse({ id: id }, function (response) {
                    if (!response.error) {
                        btn.hide();
                        item.attr('data-status', response.data.status);
                        item.find('.rl-status')
                            .attr('class', 'rl-status rl-status-' + response.data.status.toLowerCase())
                            .text(response.data.status);
                    } else {
                        APP.modalMessage({ title: 'Error', text: response.error });
                    }
                });
            });

            // Delete a response
            APP.confirmAction('.rl-item-button-delete', {
                title: APP.LANG.text('delete-response-modal-title'),
                description: APP.LANG.text('delete-response-modal-description'),
                height: 180,
                action: function (el) {
                    var btn  = jQuery(el);
                    var item = btn.closest('.rl-item');
                    var id   = item.attr('data-id');

                    APP.service.deleteFormResponse({ id: id }, function (response) {
                        if (!response.error) {
                            item.slideUp(300, function () {
                                jQuery('.rl-item-content').getNiceScroll().resize();
                            });
                        } else {
                            APP.modalMessage({ title: 'Error', text: response.error });
                        }
                    });
                }
            });
        }
    };



    APP.FORM.renderEditor = function (data) {
        jQuery.when(
            APP.service.getForm({ lang: data.lang }),
            APP.service.getFormResponse({ lang: data.lang, id: APP.params.id })
        ).done(function (xhrForm, xhrFormResponse) {
            data.form = xhrForm[0].data;
            data.response = xhrFormResponse[0].data;
        });
    };



    APP.FORM.renderTranslationsEditing = function (data) {
        APP.service.getFormTranslations({}, function (response) {
            if (!response.error) {
                data.formTranslations = response.data;
                APP.render(APP.FORM.buildTranslationEditingHTML(data), data);

                jQuery('.ft-item input').on('change', function () {
                    jQuery(this).addClass('ft-input-changed');
                });

                jQuery('.h-save-button').on('click', function () {
                    var btn = jQuery(this);
                    var itemTranslations   = [];
                    var optionTranslations = [];
                    
                    jQuery('.ft-input-changed[data-item-id]').each(function () {
                        var id   = this.getAttribute('data-item-id');
                        var lang = this.getAttribute('data-lang');

                        itemTranslations.push({ item_id: id, lang: lang, label: this.value });
                    });

                    jQuery('.ft-input-changed[data-option-id]').each(function () {
                        var id   = this.getAttribute('data-option-id');
                        var lang = this.getAttribute('data-lang');

                        optionTranslations.push({ option_id: id, lang: lang, label: this.value });
                    });

                    btn.addClass('h-button-submitting');

                    APP.service.updateFormTranslations({
                        item_translations: itemTranslations,
                        option_translations: optionTranslations
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



    APP.FORM.buildTranslationEditingHTML = function (data) {
        var html = '';

        function getTranslationLabel(tList, langCode) {
            var t = APP.findObject(tList, { lang: langCode }); 
            var val = t && t.label ? t.label : '';
            return APP.stripHtmlTags(val);
        }

        if (Array.isArray(data.formTranslations)) {
            html += '<ol class="form-translations">';
            data.formTranslations.forEach(function (it) {
                html += '<li class="ft-item">';

                data.enabledLanguages.forEach(function (lang) {
                    html += '<div><em>' + lang.code + '</em>';
                    html += '<input type="text" data-item-id="' + it.item_id + 
                            '" data-lang="' + lang.code + 
                            '" data-rtl="' + lang.rtl + 
                            '" value="' + getTranslationLabel(it.translations, lang.code) + 
                            '" />';
                    html += '</div>';
                });

                if (Array.isArray(it.options)) {
                    html += '<ol class="ft-options">';
                    it.options.forEach(function (ot) {
                        html += '<li class="ft-option-item">';
                        
                        data.enabledLanguages.forEach(function (lang) {
                            html += '<div>';
                            html += '<input type="text" data-option-id="' + ot.option_id + 
                                    '" data-lang="' + lang.code + 
                                    '" data-rtl="' + lang.rtl + 
                                    '" value="' + getTranslationLabel(ot.translations, lang.code) + 
                                    '" />';
                            html += '</div>';
                        });

                        html += '</li>';
                    });
                    html += '</ol>';
                }

                html += '</li>';
            });
            html += '</ol>';
        }

        return html;
    };



    APP.FORM.grabCategorizationItems = function (form) {
        var flatItems = [];

        function grabItems(obj) {
            if (obj.items) obj.items.forEach(function (item) {
                if (item.type === 'choice' || item.type === 'scale' || item.type === 'location-choice') {
                    flatItems.push(item);
                    grabItems(item);
                }
            });
        }

        form.sections.forEach(grabItems);
        return flatItems;
    };



    //
    // Hide lengthy list of items and lazy view them on a button click.
    //
    APP.FORM.lazyview = function (options) {
        options = options || {};
        options.initialItems = options.initialItems || 20;
        options.loadItems    = options.loadItems    || 10;

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

})();