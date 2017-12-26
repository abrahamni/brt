(function () {
    'use strict';
    
    APP.FORM = {};



    APP.FORM.create = function (domContainer, data) {
        var formEl = document.querySelector(domContainer || '#form');

        formEl.setAttribute('data-id', data.form.id);
        formEl.appendChild(createItems(data.form.items));

        attacheEventHandlers(formEl);
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

        grabItems(form);
        return flatItems;
    };



    function attacheEventHandlers(formEl) {
        var modal;
        var modalSettings = {
            autoOpen: false,
            height: 600,
            width: 700,
            modal: true,
            buttons: {},
            close: function() {
                formEl.reset();
            },
            open: function() {
                kamaDatepicker('datetime-6', {
                    markToday: true
                });
            }
        };
        modalSettings.buttons[APP.LANG.text('submit')] = handleSubmit;
        modalSettings.buttons[APP.LANG.text('cancel')] = function () {
            modal.dialog('close');
        };
        modal = jQuery(formEl).dialog(modalSettings);

        function showHideChildQuestions(itemId, show) {
            var children = modal.find('.form-item[data-item-id="' + itemId + '"] .form-item');

            if (show) {
                children.show();
            } else {
                children.hide();
            }
        }

        jQuery('#form-header > span').on('click', function () {
            var itemId   = this.getAttribute('data-item-id');
            var optionId = this.getAttribute('data-option-id');

            formEl.querySelector('input[name="item-' + itemId + '"][value="' + optionId + '"]').checked = true;
            modal.dialog('open');
            showHideChildQuestions(itemId, optionId == 1);
        });

        modal.find('> .form-item-choice > .form-item-content input[type="radio"]').on('change', function () {
            var childItems = jQuery(this).parents('.form-item').find('.form-item').hide();
            childItems.find('input[type="radio"]').prop('checked', false);
            childItems.find('input,textarea').val('');
            modal.find('[data-show-if="' + this.value + '"]').show();
        });

        modal.find('.form-item[data-depends-on]').each(function () {
            var dependentItem = jQuery(this);
            var dependentItemId = dependentItem.attr('data-depends-on');
            var dependentSelect = dependentItem.find('select');
            var dependentSelectClone = dependentSelect.clone();
            dependentSelect.html('<option></option>');

            modal.find('.form-item-choice[data-item-id="' + dependentItemId + '"] select').on('change', function () {
                dependentSelect.html('');
                dependentSelectClone.find('option[data-parent-option-id="' + this.value + '"]').clone().appendTo(dependentSelect);
            });
        });
        
        // modal.find('.form-item-datetime > .form-item-content > input').datepicker({ 
        //     dateFormat: 'yy-mm-dd', 
        //     firstDay: 1,
        //     maxDate: new Date()
        // });
    }



    function handleSubmit() {
        var modal  = jQuery(this);
        var formId = modal.attr('data-id');

        var formData = {
            form_id: formId,
            lang: APP.LANG.getCurrentLanguageCode(),
            items: []
        };

        jQuery('.form-item-content').each(function () {
            var contentEl = jQuery(this);
            var itemEl    = contentEl.parent('.form-item');
            var itemId    = itemEl.attr('data-item-id');
            var itemType  = itemEl.attr('data-type');
           
            var val = { 
                item_id: itemId, 
                option_id: null, 
                value: null
            };

            if (itemType === 'choice') {
                if (contentEl.find('input[type="radio"]:checked').length) {
                    val.option_id = contentEl.find('input[type="radio"]:checked').val();
                } else if (contentEl.find('select').length) {
                    val.option_id = contentEl.find('select').val();
                }
            } else if (itemType === 'location-choice') {
                val.option_id = contentEl.find('select').val();
            } else if (itemType === 'datetime' || itemType === 'number') {
                val.value = contentEl.find('input').val();
            } else if (itemType === 'text') {
                var text = itemEl.find('textarea').val() || itemEl.find('input').val() || '';
                val.value = text;
                // val.value = { lang: APP.LANG.getCurrentLanguageCode(), text: text };
            }

            formData.items.push(val);
        });

        APP.service.createFormResponse(formData, function (result) {
            console.log(JSON.stringify(formData));

            if (!result.error) {
                var html = modal.html();
                modal.html('<div class="form-success-message">' + APP.LANG.text('form-success-message') + '</div>');
                modal.next('.ui-dialog-buttonpane').hide();
                modal.dialog('option', 'height', 110);

                setTimeout(function () {
                    modal.dialog('close');
                    modal.html(html);
                    modal.next('.ui-dialog-buttonpane').show();
                    modal.dialog('option', 'height', 600);
                }, 2000);
            }
        });
    }



    function createItems(items) {
        var fragment = document.createDocumentFragment();

        if (items) items.forEach(function (item) {
            var el = createItem(item);

            if (item.items) {
                el.appendChild(createItems(item.items));
            }

            fragment.appendChild(el);
        });

        return fragment;
    }



    function createItem(item) {
        var attributes = {
            'data-form-id': item.form_id,
            'data-section-id': item.section_id,
            'data-item-id': item.id,
            'data-parent-id': item.parent_id,
            'data-sort-order': item.sort_order,
            'data-type': item.type,
            'class': 'form-item form-item-' + item.type
        };

        if (item.settings.show_if) {
            attributes['data-show-if'] = item.settings.show_if;
        }

        if (item.settings.depends_on) {
            attributes['data-depends-on'] = item.settings.depends_on;
        }

        var el = createElement('div', attributes);
        var elHeader = createItemHeader(item);
        var elContent = createElement('div', { 'class': 'form-item-content' });

        elContent.insertAdjacentHTML('beforeend', createItemOptionsHtml(item));
        el.appendChild(elHeader);
        el.appendChild(elContent);

        return el;
    }



    function createItemHeader(item) {
        var el = createElement('div', { 'class': 'form-item-header' }, '<h4>' + item.label + '</h4>');
        var p;

        if (item.description) {
            p = createElement('p', {}, item.description);

            if (item.note) {
                p.appendChild(createElement('span', {}, item.note));
            }

            el.appendChild(p);
        }

        return el;
    }



    function createItemOptionsHtml(item) {
        var html = '';

        if (item.options && item.options.length) {
            if (item.type === 'choice' && item.settings.allow_multiple) {
                html = createCheckboxes(item);
            } else if (item.type === 'scale') {
                html = createStandardRadioButtons(item);
            } else if (item.type === 'choice' || item.type === 'location-choice') {
                if (item.options.length === 2) {
                    // optimize for yes/no items.
                    html = createYesNoRadioButtons(item);
                } else if (item.options.length > 2 && item.options.length <= 8) {
                    // standard radio buttons.
                    html = createStandardRadioButtons(item);
                } else {
                    // dropdown selection.
                    html = createDropdownSelection(item);
                }
            }
        } else {
            switch (item.type) {
                case 'datetime':
                    html = '<input type="text" id="datetime-' + item.id + '" value="' + outputAsJalaliDate(new Date()) + '" />';
                    break;
                case 'number':
                    html = '<input type="number" value="0" />';
                    break;
                case 'text':
                    if (item.settings.multiline) {
                        html = '<textarea placeholder=""></textarea>';
                    } else {
                        html = '<input type="text" />';
                    }                    
                    break;
            }
        }

        return html;
    }



    function createYesNoRadioButtons(item) {
        var html = '';

        item.options.forEach(function (option, i) {
            html += '<div class="form-item-choice-yes-no">' + 
                        '<input type="radio" id="option-' + option.id + '" name="item-' + item.id + '" value="' + option.id + '" />' + 
                        '<label for="option-' + option.id + '">' + option.label + '</label>' +
                    '</div>';
        });
        
        return html;
    }



    function createStandardRadioButtons(item) {
        var html = '';

        item.options.forEach(function (option, i) {
            html += '<div class="form-item-choice-radio-button">' + 
                        '<input type="radio" id="option-' + option.id + '" name="item-' + item.id + '" value="' + option.id + '" />' + 
                        '<label for="option-' + option.id + '">' + option.label + '</label>' +
                    '</div>';
        });
        
        return html;
    }



    function createCheckboxes(item) {
        var html = '';

        item.options.forEach(function (option, i) {
            html += '<div class="form-item-checkbox">' + 
                        '<input type="checkbox" id="option-' + option.id + '" name="item-' + item.id + '" value="' + option.id + '" />' +
                        '<label for="option-' + option.id + '">' + option.label + '</label>' +
                    '</div>';
        });

        return html;
    }



    function createDropdownSelection(item) {
        var html = '<select name="item-' + item.id + '"><option></option>';
        
        item.options.forEach(function (option, i) {
            html += '<option value="' + option.id +
                        (option.settings.parent_area_option_id ? '" data-parent-option-id="' + option.settings.parent_area_option_id : '') + '">' + 
                        option.label + 
                    '</option>';
        });

        html += '</select>';
        return html;
    }



    function createElement(name, attributes, content) {
        var elem = document.createElement(name);

        if (attributes) Object.keys(attributes).forEach(function (attr) {
            elem.setAttribute(attr, attributes[attr]);
        });

        if (content) {
            if (typeof content === 'object') {
                elem.appendChild(content);
            } else {
                elem.innerHTML = content;
            }
        }

        return elem;
    }

})();