'use strict';

//
// Node.js modules sand 3rd party libs.
//
var lib = {
    http:        require('http'),
    https:       require('https'),
    fs:          require('fs'),
    path:        require('path'),
    url:         require('url'),
    querystring: require('querystring'),
    crypto:      require('crypto'),
    db:          require('postgresql-query'),
    parseArgs:   require('minimist'),
    multiparty:  require('multiparty'),
    bcrypt:      require('bcrypt'),
    uuid:        require('node-uuid')
};


//
// Various constants.
//
var SQL               = getAllFileContentsSync(__dirname + '/queries', '.sql');
var EMAIL_TEMPLATE    = getAllFileContentsSync(__dirname + '/email-templates', '.html');
var ARGV              = lib.parseArgs(process.argv.slice(2));
var PORT              = ARGV.port || 19582;
var HOST              = ARGV.host || '127.0.0.1';
var EMAIL_REGEX       = /[a-zA-Z_.0-9]+@[a-zA-Z0-9]+[.][a-zA-Z.0-9]+/;
var DATE_FORMAT_REGEX = /[0-9]{4}-[0-9]{2}-[0-9]{2}/;
var EMAIL_FROM        = ARGV.emailfrom || 'DataPage <info@datapa.ge>';
var POST_MAX_SIZE     = 20 * 1000 * 1000; // 20MB in bytes.
var SALT_LENGTH       = 10;
var LANG_CODE_LENGTH  = 2;
var SESSION_TIMEOUT   = 24; // hours


//
// Time constants.
//
var SECOND  = 1000;
var MINUTE  = SECOND * 60;
var HOUR    = MINUTE * 60;
var DAY     = HOUR   * 24;
var WEEK    = DAY    * 7;
var MONTH   = WEEK   * 4;
var QUARTER = MONTH  * 3;
var YEAR    = MONTH  * 12;


//
// Handy references to types and statuses in database.
//
var TOKEN_TYPE = {
    SESSION: 1,
    PASSWORD_RESET: 2
};
var PERMISSION = {
    OWNER: 1,
    ADMINISTRATOR: 50,
    EDITOR: 100,
    ASSISTANT: 150,
    USER: 1000
};
var STATUS = {
    DELETED: -1,
    ACTIVE: 1,
    DRAFT: 2,
    REVISION: 3
};
var FORM_ITEM_TYPE = {
    TEXT: 1,
    NUMBER: 2,
    SCALE: 3,
    CHOICE: 4,
    LOCATION_CHOICE: 5,
    LOCATION_SEARCH: 6,
    DATETIME: 7
};


//
// Error messages for API calls.
//
var ERROR = {
    SERVER_ERROR:           { error: 'server-error' },
    INVALID_PARAMETERS:     { error: 'invalid-parameters' },
    INVALID_TOKEN:          { error: 'invalid-token' },
    INVALID_PASSWORD_TOKEN: { error: 'invalid-password-token' },
    INVALID_INVITE_TOKEN:   { error: 'invalid-invite-token' },
    INVALID_CREDENTIALS:    { error: 'invalid-credentials' },
    INVALID_EMAIL:          { error: 'invalid-email' },
    PASSWORD_NOMATCH:       { error: 'password-nomatch' },
    WRONG_PASSWORD:         { error: 'wrong-password' },
    EMAIL_EXISTS:           { error: 'email-exists' },
    INVALID_PERMISSION:     { error: 'invalid-permission' },
    PERMISSION_DENIED:      { error: 'permission-denied' },
    EMPTY_FIELDS:           { error: 'empty-fields' }
};


//
// Routes with corresponding handler functions.
//
var API = {
    '/login':                 { POST: logIn },
    '/logout':                { POST: logOut },
    '/form':                  { GET:  getFormHierarchy },
    '/form/responses':        { GET:  getFormResponses },
    '/form/response':         { GET:  getFormResponse, POST: createFormResponse, DELETE: deleteFormResponse },
    '/form/response/approve': { PUT:  approveFormResponse },
    '/form/translations':     { GET:  getFormTranslations, PUT: updateFormTranslations },
    '/languages':             { GET:  getLanguages },
    '/ui-translations':       { GET:  getUITranslations, PUT: updateUITranslations },
    '/data/map':              { GET:  getMapData },
    '/data/xy':               { GET:  getXYData },
    '/data/bar-chart':        { GET:  getBarChartData },
    '/data/line-chart':       { GET:  getLineChartData }
};


//
// Handle an HTTP request and route it to a corresponding route handler
// or respond with an error message otherwise.
//
function requestRouter(req, res) {
    var parsedUrl = lib.url.parse(req.url, true);
    var qsParams  = parsedUrl.query;
    var apiPath   = parsedUrl.pathname.replace('/api', '');
    var method    = req.method.toUpperCase();

    var invalidMethodMsg    = { error: 'Invalid HTTP method: ' + method };
    var methodNotAllowedMsg = { error: method + ' HTTP method is not allowed at ' + apiPath };
    var unknownPathMsg      = { error: 'Unknown API path: ' + apiPath };

    if (['GET', 'POST', 'PUT', 'DELETE'].indexOf(method) === -1) {
        console.error(invalidMethodMsg); 
        res.end(invalidMethodMsg);
    }

    if (API[apiPath]) {
        if (API[apiPath][method]) {
            if (method === 'GET') {
                if (!qsParams.session_token) {
                    qsParams.session_token = req.headers['x-session-token'];
                }
                responseHandler(req, res, qsParams, API[apiPath][method]);
            } else if (API[apiPath].skipParsing) {
                responseHandler(req, res, {}, API[apiPath][method]);
            } else {
                parseJSONBody(req, res, function (params) {
                    responseHandler(req, res, params, API[apiPath][method]);
                });
            }
        } else {
            console.error(methodNotAllowedMsg);
            sendJSONBody(res, methodNotAllowedMsg);
        }
    } else {
        console.error(unknownPathMsg);
        sendJSONBody(res, unknownPathMsg);
    }
}


//
// Wrap a route handler and respond to a request 
// with a consistant response format.
//
// {
//     "error": "invalid-parameter", // or null if no error occured.
//     "data": [] /* or */ {}
// }
//
function responseHandler(req, res, params, routeHandler) {
    routeHandler(params, function (err, data) {
        if (err) {
            sendJSONBody(res, err);
        } else {
            sendJSONBody(res, { error: null, data: data });
        }
    });
}


//
// Configure the database module.
//
lib.db.config({
    username: ARGV.dbuser || 'postgres',
    password: ARGV.dbpass || 'xxxxx',
    database: ARGV.dbname || 'brt',
    host: ARGV.pghost || '127.0.0.1',
    port: ARGV.pgport || 5432
});


//
// Start the app server.
//
lib.http.createServer(requestRouter).listen(PORT, HOST);
console.log('Server started on ' + HOST + ':' + PORT);












//
//
// FORMS API
//
//

//
// Select an active form object.
//
// API params:
//    lang (string) - two letter ISO language code.
//
// Possible errors:
//     invalid-parameters
//     server-error
//
function getForm(params, callback) {
    if (!validLanguageParam(params.lang)) {
        return callback(ERROR.INVALID_PARAMETERS);
    }
    lib.db.queryOne(SQL.selectForm, [params.lang], function (err, form) {
        if (err) { return serverError('getForm()', err, callback); }
        callback(null, form);
    });
}

//
// Select an active form object with all its items.
//
// API params:
//     lang (string) - two letter ISO language code.
//
// Possible errors:
//     invalid-parameters
//     server-error
//
function getFormHierarchy(params, callback) {
    if (!validLanguageParam(params.lang)) {
        return callback(ERROR.INVALID_PARAMETERS);
    }
    lib.db.queryOne(SQL.selectForm, [params.lang], function (err, form) {
        if (err)   { return serverError('getFormHierarchy() > SQL.selectForm', err, callback); }
        if (!form) { return callback(null, {}); }

        var qValues = [params.lang, form.id, null];

        lib.db.query([
            [SQL.selectFormSections, qValues],
            [SQL.selectFormItems, qValues],
            [SQL.selectFormItemsOptions, qValues]
        ], function (err, sections, items, options) {
            if (err) { return serverError('getFormHierarchy() > query', err, callback); }
            form = buildFormHierarchy(form, sections, items, options);

            if (form.sections.length === 1) {
                form.items = form.sections[0].items;
                delete form.sections;
            }

            callback(null, form);
        });
    });
}

//
// Put a form, its sections, its items and all item's options 
// to a single hierarchical object.
//
function buildFormHierarchy(form, sections, items, options) {
    var i, j, k;

    form.sections = [];

    for (i = 0; i < sections.length; i += 1) {
        sections[i].items = [];

        for (j = 0; j < items.length; j += 1) {
            if (items[j].section_id === sections[i].id) {
                items[j].options = [];

                for (k = 0; k < options.length; k += 1) {
                    if (options[k].item_id === items[j].id) {
                        items[j].options.push(options[k]);
                    }
                }

                sections[i].items.push(items[j]);
            }
        }

        sections[i].items = nestItems(sections[i].items, 0);
        form.sections.push(sections[i]);
    }

    return form;
}

//
// Nest items recursively using their `parent_id` property.
//
function nestItems(items, parentId) {
    var tree = [];
    var i, children;

    for (i = 0; i < items.length; i += 1) {
        if (parseInt(items[i].parent_id, 10) === parentId) {
            children = nestItems(items, parseInt(items[i].id, 10));

            if (children.length) {
                items[i].items = children;
            }

            tree.push(items[i]);
        }
    }

    return tree;
}

//
// Select all responses on an active form.
//
// API params:
//     lang (string) - two letter ISO language code.
//     from (date string) [optional] - date in YYYY-MM-DD format.
//     to   (date string) [optional] - date in YYYY-MM-DD format.
//
// Possible errors:
//     invalid-parameters
//     server-error 
//
function getFormResponses(params, callback) {
    if (!validLanguageParam(params.lang)) {
        return callback(ERROR.INVALID_PARAMETERS);
    }

    if (params.from && params.to) {
        if (!DATE_FORMAT_REGEX.test(params.from) || !DATE_FORMAT_REGEX.test(params.to)) {
            return callback(ERROR.INVALID_PARAMETERS);
        }
    }

    function onResult(filter) {
        return function (err, responses) {
            if (err) { return serverError('getFormResponses()', err, callback); }

            if (isFunction(filter)) {
                responses = filter(responses);
            }

            callback(null, responses);
        };
    }

    getForm(params, function (err, form) {
        if (err || !form) { return callback(null, []); }

        validPermission(params, PERMISSION.ADMINISTRATOR, function (err, user) {
            var qValues;

            if (!err && user) {
                qValues = [params.lang, form.id, params.from, params.to, params.status || null, null];
                lib.db.query(SQL.selectFormResponses, qValues, onResult());
            } else {
                qValues = [params.lang, form.id, params.from, params.to, STATUS.ACTIVE, null];
                lib.db.query(SQL.selectFormResponses, qValues, onResult(filterPublicResponses));
            }
        });
    });
}

//
// Select a single response object with all its items.
//
// API params:
//     lang (string) - two letter ISO language code.
//     id (integer) - id of a single response.
//
// Possible errors:
//     invalid-parameters
//     server-error 
//
function getFormResponse(params, callback) {
    if (!validLanguageParam(params.lang)) {
        return callback(ERROR.INVALID_PARAMETERS);
    }

    params.id = parseInt(params.id, 10);

    if (!params.id) {
        return callback(ERROR.INVALID_PARAMETERS);
    }

    function onResult(filter) {
        return function (err, responses) {
            if (err) { return serverError('getFormResponse()', err, callback); }

            if (isFunction(filter)) {
                responses = filter(responses);
            }

            callback(null, responses && responses.length ? responses[0] : responses);
        };
    }

    getForm(params, function (err, form) {
        if (err || !form) { return callback(null, []); }

        validPermission(params, PERMISSION.ADMINISTRATOR, function (err, user) {
            var qValues;

            if (user) {
                qValues = [params.lang, form.id, null, null, params.status || null, params.id];
                lib.db.query(SQL.selectFormResponses, qValues, onResult());
            } else {
                qValues = [params.lang, form.id, null, null, STATUS.ACTIVE, params.id];
                lib.db.query(SQL.selectFormResponses, qValues, onResult(filterPublicResponses));
            }
        });
    });
}

//
// Remove "hidden_from_public" items.
//
function filterPublicResponses(responses) {
    var i, j;

    if (Array.isArray(responses)) {
        for (i = 0; i < responses.length; i += 1) {
            j = responses[i].items.length;

            while (j -= 1) {
                if (responses[i].items[j].item_settings.hidden_from_public) {
                    responses[i].items.splice(j, 1);
                }
            }
        }
    }

    return responses;
}

//
// Create a new response.
//
// TODO: Refactor.
//
function createFormResponse(params, callback) {
    if (!Array.isArray(params.items) || !params.items.length) {
        return callback(ERROR.INVALID_PARAMETERS);
    }

    params.form_id = parseInt(params.form_id, 10);

    if (!params.form_id) {
        return callback(ERROR.INVALID_PARAMETERS);
    }

    // lib.db.query(SQL.selectFormItems, [null, params.form_id], function (err, formItems) {
    //     if (err) { return serverError('createFormResponse() > SQL.selectFormItems', err, callback); }
    //     console.log(formItems);
    //     callback(null, {});
    // });

    // Temporary solution for Android.
    if (params.lang) {
        var textTypeIds = [8, 9, 11, 12, 13];
        for (var i = 0; i < params.items.length; i += 1) {
            if (textTypeIds.indexOf(parseFloat(params.items[i].item_id)) !== -1) {
                params.items[i].value = {
                    lang: params.lang,
                    text: params.items[i].value
                };
            }
        }
    }

    var multiResponseMode = Array.isArray(params.items[0]);
    var savedResponsesCount = 0;
    var savedResponseItemsCount = 0;
    var savedResponseItemTranslationsCount = 0;
    var receivedResponsesCount = 0;
    var receivedResponseItemsCount = 0;
    var receivedResponseItemTranslationsCount = 0;

    function finished(transaction) {
        if (
            savedResponsesCount === receivedResponsesCount &&
            savedResponseItemsCount === receivedResponseItemsCount &&
            savedResponseItemTranslationsCount === receivedResponseItemTranslationsCount
        ) {
            transaction.commit();
            callback(null, {});
            return true;
        }
    }

    lib.db.query(SQL.selectFormItems, [null, params.form_id, null], function (err, formItems) {
        if (err) { return serverError('createFormResponse() > SQL.selectFormItems', err, callback); }

        if (multiResponseMode) {
            receivedResponsesCount = params.items.length;
            params.items.forEach(function (items) {
                receivedResponseItemsCount += items.length;

                if (!checkRequiredFields(formItems, items)) {
                    return callback(ERROR.EMPTY_FIELDS);
                }
                items.forEach(function (item) {
                    receivedResponseItemTranslationsCount += responseItemTextTranslationsCount(item);
                });
            });
        } else {
            receivedResponsesCount = 1;
            receivedResponseItemsCount = params.items.length;

            if (!checkRequiredFields(formItems, params.items)) {
                return callback(ERROR.EMPTY_FIELDS);
            }
            params.items.forEach(function (item) {
                receivedResponseItemTranslationsCount += responseItemTextTranslationsCount(item);
            });
        }

        lib.db.beginTransaction(function (transaction) {
            createResponses(transaction, formItems);
        });
    });

    function createResponses(transaction, formItems) {
        if (multiResponseMode) {
            params.items.forEach(function (items) {
                createResponse(transaction, formItems, items);
            });
        } else {
            createResponse(transaction, formItems, params.items);
        }
    }

    function createResponse(transaction, formItems, responseItems) {
        var fields = {
            form_id: params.form_id
        };
        
        var dateTimeValue = responseFindDateTimeItemValue(formItems, responseItems);
        if (dateTimeValue) {
            fields.datetime = dateTimeValue;
        }

        transaction.query({
            table: 'form_responses',
            fields: fields,
            returnValue: '*'
        }, function (err, row) {
            if (err) { 
                transaction.rollback(); 
                return serverError('createFormResponse() > createResponse()', err, callback);
            }
            savedResponsesCount += 1;
            if (!finished(transaction)) {
                responseItems.forEach(function (rItem) {
                    var formItem = findObject(formItems, { id: rItem.item_id });
                    createResponseItem(transaction, row.id, formItem, rItem);
                });
            }
        });
    }

    function createResponseItem(transaction, responseId, formItem, responseItem) {
        var fields = {
            response_id: responseId,
            form_id: params.form_id,
            item_id: formItem.id,
            option_id: null,
            value: null
        };

        if (formItem.type === 'scale' || formItem.type === 'choice' || formItem.type === 'location-choice') {
            if (responseItem.option_id) {
                fields.option_id = responseItem.option_id;
            } else {
                savedResponseItemsCount += 1;
                return finished(transaction);
            }
        } else if (formItem.type === 'datetime' || formItem.type === 'number') {
            if (responseItem.value) {
                fields.value = stripHtmlTags(responseItem.value);
            } else {
                savedResponseItemsCount += 1;
                return finished(transaction);
            }
        } else if (formItem.type === 'text') {
            if (!responseItemTextTranslationsCount(responseItem)) {
                savedResponseItemsCount += 1;
                return finished(transaction);
            }
        }

        transaction.query({
            table: 'form_response_items',
            fields: fields,
            returnValue: '*'
        }, function (err, row) {
            if (err) { 
                transaction.rollback(); 
                return serverError('createFormResponse() > createResponseItem()', err, callback);
            }

            savedResponseItemsCount += 1;

            if (!finished(transaction)) {
                if (formItem.type === 'text' && responseItemTextTranslationsCount(responseItem)) {
                    createResponseItemTranslations(transaction, row.id, responseItem);
                }
            }
        });
    }

    function createResponseItemTranslations(transaction, responseItemId, responseItem) {
        var tValues = [];

        if (isObject(responseItem.value)) {
            tValues.push(responseItem.value);
        } else if (Array.isArray(responseItem.value)) {
            tValues = responseItem.value;
        }

        var tQueries = tValues.map(function (t) {
            return {
                table: 'form_response_item_translations',
                fields: {
                    response_item_id: responseItemId,
                    lang: t.lang,
                    value: stripHtmlTags(t.text)
                }
            };
        });

        transaction.query(tQueries, function (err) {
            if (err) { 
                transaction.rollback(); 
                return serverError('createFormResponse() > createResponseItemTranslations()', err, callback);
            }
            savedResponseItemTranslationsCount += tQueries.length;
            finished(transaction);
        });
    }
}

//
// Check all required fields.
//
// TODO: Refactor.
//
function checkRequiredFields(formItems, responseItems) {
    var i, rItem, formItem;
    
    for (i = 0; i < responseItems.length; i += 1) {
        rItem = responseItems[i];
        formItem = findObject(formItems, { id: rItem.item_id });
        
        if (!formItem) {
            return false;
        }
        if (formItem.settings.required) {
            if (formItem.type === 'scale' || formItem.type === 'choice' || formItem.type === 'location-choice') {
                if (!rItem.option_id) {
                    return false;
                }
            } else if (formItem.type === 'datetime') {
                if (!rItem.value) {
                    return false;
                }
            } else if (formItem.type === 'number') {
                if (rItem.value === null && rItem.value === undefined) {
                    return false;
                }
            } else if (formItem.type === 'text') {
                if (!responseItemTextTranslationsCount(rItem)) {
                    return false;
                }
            }
        }
    }

    return true;
}

//
// Count text translations in a response.
//
// TODO: Refactor.
//
function responseItemTextTranslationsCount(responseItem) {
    if (isObject(responseItem.value) && responseItem.value.lang) {
        return 1;
    } else if (Array.isArray(responseItem.value)) {
        for (var i = 0; i < responseItem.value.length; i += 1) {
            if (!isObject(responseItem.value[i])) {
                return 0;
            } else if (!responseItem.value[i].lang) {
                return 0;
            }
        }
        return responseItem.value.length;
    } else {
        return 0;
    }
}

//
// Find a date item inside the response.
//
// TODO: Refactor.
//
function responseFindDateTimeItemValue(formItems, responseItems) {
    var dateTimeFormItem = findObject(formItems, { type: 'datetime' });
    var dateTimeResponseItem;

    if (dateTimeFormItem) {
        dateTimeResponseItem = findObject(responseItems, { item_id: dateTimeFormItem.id });

        if (dateTimeResponseItem) {
            return dateTimeResponseItem.value;
        }
    }
    
    return null;
}

//
// Change status of a response to active.
//
// API params:  
//     id (integer) - id of a response.
//
// Possible errors:
//     invalid-parameters
//     invalid-permission
//     server-error
//
function approveFormResponse(params, callback) {
    params.status = STATUS.ACTIVE;
    updateFormResponseStatus(params, callback);
}

//
// Change status of a response to deleted.
//
// API params:  
//     id (integer) - id of a response.
//
// Possible errors:
//     invalid-parameters
//     invalid-permission
//     server-error
//
function deleteFormResponse(params, callback) {
    params.status = STATUS.DELETED;
    updateFormResponseStatus(params, callback);
}

//
// Update response status.
//
function updateFormResponseStatus(params, callback) {
    params.id     = parseInt(params.id, 10);
    params.status = parseInt(params.status, 10);

    if (!params.id || !params.status) {
        return callback(ERROR.INVALID_PARAMETERS);
    }

    validPermission(params, PERMISSION.ADMINISTRATOR, function (err, user) {
        if (err || !user) { return callback(ERROR.INVALID_PERMISSION); }

        lib.db.queryUpdate({
            table: 'form_responses',
            fields: {
                status: params.status
            },
            where: {
                id: params.id
            }
        }, function (err) {
            if (err) { return serverError('updateFormResponseStatus()', err, callback); }

            lib.db.queryOne(SQL.selectStatusName, params.status, function (err, status) {
                if (err) { return serverError('SQL.selectStatusName', err, callback); }

                callback(null, { id: params.id, status: status.name });
            });
        });
    });
}

//
// Select form translations.
//
// API params:
//     This API endpoint doesn't take any parameters.
//
// Possible errors:
//     invalid-permission
//     server-error 
//
function getFormTranslations(params, callback) {
    validPermission(params, PERMISSION.ADMINISTRATOR, function (err, user) {
        if (err || !user) { return callback(ERROR.INVALID_PERMISSION); }

        lib.db.queryOne(SQL.selectForm, [params.lang], function (err, form) {
            if (err)   { return serverError('getFormTranslations() > SQL.selectForm', err, callback); }
            if (!form) { return callback(null, {}); }

            lib.db.query([
                [SQL.selectAllFormItemsTranslations, form.id],
                [SQL.selectAllFormItemsOptionsTranslations, form.id]
            ], function (err, itemsTranslations, optionsTranslations) {
                if (err) { return serverError('getFormTranslations() > query', err, callback); }
                
                var i, j;

                for (i = 0; i < optionsTranslations.length; i += 1) {
                    for (j = 0; j < itemsTranslations.length; j += 1) {
                        if (optionsTranslations[i].item_id === itemsTranslations[j].item_id) {
                            if (!Array.isArray(itemsTranslations[j].options)) {
                                itemsTranslations[j].options = [];
                            }
                            itemsTranslations[j].options.push(optionsTranslations[i]);
                        }
                    }
                }

                callback(null, itemsTranslations);
            });
        });
    });
}

//
// Update form items and options translations.
//
// API params:
//     item_translations (array) - list of translations to update.
//         format: [{ "item_id": 1, "lang": "en", "label": "lorem ipsum..." }, ...]
//
//     option_translations (array) - list of translations to update.
//         format: [{ "option_id": 1, "lang": "en", "label": "lorem ipsum..." }, ...]
//
// Possible errors:
//     invalid-permission
//     server-error 
//
function updateFormTranslations(params, callback) {
    validPermission(params, PERMISSION.ADMINISTRATOR, function (err, user) {
        if (err || !user) { return callback(ERROR.INVALID_PERMISSION); }

        if (!Array.isArray(params.item_translations) || !Array.isArray(params.option_translations)) {
            return callback(ERROR.INVALID_PARAMETERS);
        }
        
        var tQueries = [];

        params.item_translations.forEach(function (it) {
            it.item_id = parseInt(it.item_id, 10);

            if (it.item_id && validLanguageParam(it.lang) && it.label) {
                tQueries.push([SQL.updateFormItemTranslation, it.item_id, it.lang, it.label]);
            }
        });

        params.option_translations.forEach(function (ot) {
            ot.option_id = parseInt(ot.option_id, 10);

            if (ot.option_id && validLanguageParam(ot.lang) && ot.label) {
                tQueries.push([SQL.updateFormItemOptionTranslation, ot.option_id, ot.lang, ot.label]);
            }
        });

        if (tQueries.length) {
            lib.db.beginTransaction(function (transaction) {
                transaction.query(tQueries, function (err) {
                    if (err) { 
                        transaction.rollback(); 
                        return serverError('updateFormTranslations()', err, callback);
                    }
                    transaction.commit();
                    callback(null, params);
                });
            });
        } else {
            return callback(null, params);
        }
    });
}












//
//
// SETTINGS, LANGUAGES & TRANSLATIONS API
//
//

//
// Select all languages in the platform.
//
// API params:
//     lang (string) - two letter ISO language code.
//
// Possible errors:
//     server-error 
//
function getLanguages(params, callback) {
    lib.db.query(SQL.selectLanguages, function (err, languages) {
        if (err) { return serverError('getLanguages()', err, callback); }

        var langs = {
            languages: [],
            enabledLanguages: []
        };

        langs.languages = languages;
        langs.enabledLanguages = languages.filter(function (lang) {
            return lang.enabled;
        });

        callback(null, langs);
    });
}

//
// Select UI translations for specified language or for all languages.
//
// API params:
//     lang (string) [optional] - two letter ISO language code.
//
// Possible errors:
//     invalid-parameters
//     server-error 
//
function getUITranslations(params, callback) {
    if (params.lang && !validLanguageParam(params.lang)) {
        return callback(ERROR.INVALID_PARAMETERS);
    }

    function onResult(err, uiTranslations) {
        if (err) { return serverError('getUITranslations()', err, callback); }
        callback(null, uiTranslations);
    }

    if (params.lang) {
        lib.db.query(SQL.selectUiTranslations, params.lang, onResult);
    } else {
        lib.db.query(SQL.selectAllUiTranslations, onResult);
    }
}

//
// Update UI translations.
//
// API params:
//     ui_translations (array) - list of translations to update.
//         format: [{ "t_key": "lorem-ipsum", "lang": "en", "t_value": "lorem ipsum..." }, ...]
//
// Possible errors:
//     invalid-permission
//     server-error 
//
function updateUITranslations(params, callback) {
    validPermission(params, PERMISSION.ADMINISTRATOR, function (err, user) {
        if (err || !user) { return callback(ERROR.INVALID_PERMISSION); }

        if (!Array.isArray(params.ui_translations)) {
            return callback(ERROR.INVALID_PARAMETERS);
        }
        
        var tQueries = [];

        params.ui_translations.forEach(function (uit) {
            if (uit.t_key && validLanguageParam(uit.lang) && uit.t_value) {
                tQueries.push([SQL.updateUiTranslation, uit.t_key, uit.lang, uit.t_value]);
            }
        });

        if (tQueries.length) {
            lib.db.beginTransaction(function (transaction) {
                transaction.query(tQueries, function (err) {
                    if (err) { 
                        transaction.rollback(); 
                        return serverError('updateUITranslations()', err, callback);
                    }
                    transaction.commit();
                    callback(null, params);
                });
            });
        } else {
            return callback(null, params);
        }
    });
}

//
// Check if a language parameter is two letter string.
//
function validLanguageParam(p) {
    return p && typeof p === 'string' && /[a-zA-Z]{2}/.test(p);
}












//
//
// USER API
//
//

//
// Authenticate user.
//
// API params:
//     session_token (string) - A valid unique token aquired during previous authentication.
//     or
//     email (string) - An unique email or username that was used during signup.
//     password (string) - Corresponding password.
//
// Possible errors:
//     invalid-token
//     invalid-credentials
//     server-error 
//
function logIn(params, callback) {
    var newToken = generateToken();

    function sendUserData(user) {
        lib.db.query(SQL.invalidateUserToken, [params.session_token]);
        lib.db.queryOne(SQL.createUserToken, [TOKEN_TYPE.SESSION, user.id, newToken], function (err) {
            if (err) { return serverError('logIn() > SQL.createUserToken', err, callback); }

            delete user.password;
            user.session_token = newToken;
            callback(null, user);
        });
    }

    if (params.session_token) {
        lib.db.queryOne(SQL.selectUserByToken, [TOKEN_TYPE.SESSION, params.session_token], function (err, user) {
            if (err)   { return serverError('logIn() > SQL.selectUserByToken', err, callback); }
            if (!user) { return callback(ERROR.INVALID_TOKEN); }
            sendUserData(user);
        });
    } else if (params.email && params.password) {
        lib.db.queryOne(SQL.selectUserByEmail, params.email, function (err, user) {
            if (err)   { return serverError('logIn() > SQL.selectUserByEmail', err, callback); }
            if (!user) { return callback(ERROR.INVALID_CREDENTIALS); }

            lib.bcrypt.compare(params.password, user.password, function (err, match) {
                if (err || !match) { return callback(ERROR.INVALID_CREDENTIALS); }
                sendUserData(user);
            });
        });
    } else {
        callback(ERROR.INVALID_CREDENTIALS);
    }
}

//
// Invalidate user's active session token.
//
// API params:
//     session_token (string) - A valid unique token aquired during previous authentication.
//
// Possible errors:
//     invalid-token
//     server-error 
//
function logOut(params, callback) {
    validUserSession(params, function (err, user) {
        if (err) { return callback(err); }
        lib.db.query(SQL.invalidateUserToken, [params.session_token]);
        callback(null, {});
    });
}

//
// Check if user's session_token is still valid.
//
function validUserSession(params, callback) {
    lib.db.queryOne(SQL.selectUserByToken, [TOKEN_TYPE.SESSION, params.session_token], function (err, user) {
        if (err || !user) { 
            return callback(ERROR.INVALID_TOKEN); 
        }
        callback(null, user);
    });
}

//
// Check if user has the requested permission.
//
function validPermission(params, requestedPermission, callback) {
    validUserSession(params, function (err, user) {
        if (err) { return callback(err); }

        // Low permission id is higher rank. Owner is 1, Administrator 50 and etc.
        if (user.permission <= requestedPermission) {
            callback(null, user);
        } else {
            callback(ERROR.PERMISSION_DENIED);
        }
    });
}












//
//
// DATA API
//
//

//
// Get responses formatted for map usage.
//
// TODO: Refactor.
//
function getMapData(params, callback) {
    var qValues = [params.lang, params.form_id, null];
    var locationItem = null;
    var locationItems = [];
    var mappableItems = [];
    var mappableResponses = [];
    var maxIntervals = 100;

    lib.db.query([
        [SQL.selectFormItems, qValues],
        [SQL.selectFormItemsOptions, qValues],
        [SQL.selectFormResponses, [params.lang, params.form_id, params.from || null, params.to || null, STATUS.ACTIVE, null]]
    ], function (err, items, options, responses) {
        if (err) { return serverError('getMapData()', err, callback); }

        responses = filterPublicResponses(responses);

        var i, j, rItem;

        // Extract location, choice and scale type items from a form.
        for (i = 0; i < items.length; i += 1) {
            for (j = 0; j < options.length; j += 1) {
                if (items[i].id == options[j].item_id) {
                    items[i].options = items[i].options || [];
                    items[i].options.push(options[j]);
                }
            }
            if (items[i].type_id == FORM_ITEM_TYPE.LOCATION_CHOICE) {
                locationItems.push(items[i]);
            }
            if (items[i].type_id == FORM_ITEM_TYPE.CHOICE || items[i].type_id == FORM_ITEM_TYPE.SCALE) {
                if (!items[i].settings.hidden_from_map) {
                    mappableItems.push(items[i]);
                }
            }
        }

        // Pick a location item (if there're multiple location items).
        if (params.location_item_id) {
            for (i = 0; i < locationItems.length; i += 1) {
                if (params.location_item_id == locationItems[i].id) {
                    locationItem = locationItems[i]; break;
                }
            }
        } else {
            locationItem = locationItems[0];
        }

        if (!locationItem) {
            return callback({ error: 'No location item found.' });
        }

        // Filter responses, the ones that have correct location and datetime.
        for (i = 0; i < responses.length; i += 1) {
            if (params.item_id && params.option_id) {
                if (!findObject(responses[i].items, { item_id: params.item_id, option_id: params.option_id })) {
                    continue;
                }
            } else if (params.item_id) {
                if (!findObject(responses[i].items, { item_id: params.item_id })) {
                    continue;
                }
            }
            for (j = 0; j < responses[i].items.length; j += 1) {
                rItem = responses[i].items[j];

                if (locationItem.id == rItem.item_id && rItem.option_settings) {
                    responses[i].lat = rItem.option_settings.lat;
                    responses[i].lng = rItem.option_settings.lng;
                }
            }
            if (responses[i].datetime) {
                try {
                    responses[i].timestamp = Date.parse(responses[i].datetime);
                } catch (e) {}
            }
            if (responses[i].timestamp && responses[i].lat && responses[i].lng) {
                mappableResponses.push(responses[i]);
            }
        }

        if (!mappableResponses.length) {
            return callback(null, {});
        }

        // Group responses in date intervals for timeline player.
        var firstResponse = mappableResponses[mappableResponses.length - 1];
        var lastResponse = mappableResponses[0];
        var intervaledResponses = dateRangeMap(firstResponse.timestamp, lastResponse.timestamp, WEEK);
        var dateRangeKeys = Object.keys(intervaledResponses);
        var inserted = {};
        var t;

        if (dateRangeKeys.length > maxIntervals) {
            return callback({ error: 'Date interval is too small for specified range of responses.' });
        }

        for (i = 0; i < mappableResponses.length; i += 1) {
            for (j = 0; j < dateRangeKeys.length; j += 1) {
                t = parseFloat(dateRangeKeys[j]);

                if (!inserted[i] && mappableResponses[i].timestamp <= (t + WEEK)) {
                    inserted[i] = true;
                    intervaledResponses[t].push(mappableResponses[i]);
                }
            }
        }

        callback(null, { 
            location_item: locationItem,
            caption_items: mappableItems,
            intervaled_responses: intervaledResponses,
            responses: mappableResponses
        });
    });
}

//
// Create an object where each interval date is a key (in milliseconds) 
// with an empty array as a value.
//
// Example: 
//    dateRangeMap('2014-08-01', '2014-08-29');
//
//    {
//       1406851200000: []
//       1407456000000: []
//       1408060800000: []
//       1408665600000: []
//    }
//
function dateRangeMap(fromTimestamp, toTimestamp, intervalMS) {
    var range = {};

    if (typeof fromTimestamp === 'string') {
        fromTimestamp = Date.parse(fromTimestamp);
    } else if (isDate(fromTimestamp)) {
        fromTimestamp = fromTimestamp.getTime();
    }

    if (typeof toTimestamp === 'string') {
        toTimestamp = Date.parse(toTimestamp);
    } else if (isDate(toTimestamp)) {
        toTimestamp = toTimestamp.getTime();
    }

    if (typeof intervalMS !== 'number' || fromTimestamp < 1 || toTimestamp < 1) {
        return range;
    }

    var i = fromTimestamp;
    range[i] = [];

    while ((i += intervalMS) < toTimestamp) {
        range[i] = [];
    }

    return range;
}

//
// Select cross form items in an intermediate format
// that is used to build chart data structures.
//
function getXYData(params, callback) {
    var xAxisItemId = parseInt(params.x_axis, 10);
    var yAxisItemId = parseInt(params.y_axis, 10);

    if (!validLanguageParam(params.lang) || !xAxisItemId || !yAxisItemId) {
        return callback(ERROR.INVALID_PARAMETERS);
    }

    lib.db.queryOne(SQL.selectForm, [params.lang], function (err, form) {
        if (err)   { return serverError('getXYData() > SQL.selectForm', err, callback); }
        if (!form) { return callback(null, {}); }

        var qValuesX = [params.lang, form.id, xAxisItemId];
        var qValuesY = [params.lang, form.id, yAxisItemId];

        lib.db.query([
            [SQL.selectFormItems, qValuesX],
            [SQL.selectFormItemsOptions, qValuesX],
            [SQL.selectFormItems, qValuesY],
            [SQL.selectFormItemsOptions, qValuesY]
        ], function (err, xAxisItem, xAxisItemOptions, yAxisItem, yAxisItemOptions) {
            if (err || !Array.isArray(xAxisItem) || !Array.isArray(yAxisItem)) {
                return serverError('getXYData() > lib.db.query', err, callback);
            }

            xAxisItem = xAxisItem[0];
            yAxisItem = yAxisItem[0];

            if (!xAxisItem || !yAxisItem) {
                return serverError('getXYData() > !xAxisItem || !yAxisItem', err, callback);
            }

            xAxisItem.options = xAxisItemOptions;
            yAxisItem.options = yAxisItemOptions;

            var qValues = [params.lang, form.id, xAxisItemId, yAxisItemId, params.from || null, params.to || null];
            
            lib.db.query(SQL.selectDataCalculations, qValues, function (err, results) {
                if (err) { serverError('getXYData() > SQL.selectDataCalculations', err, callback); }
                callback(null, xAxisItem, yAxisItem, results);
            });
        });
    });
}

//
// TODO
//
function getBarChartData(params, callback) {
    getXYData(params, function (err, xAxisItem, yAxisItem, data) {
        if (err) { serverError('getBarChartData()', err, callback); }

        var chartData = {
            xAxis: {
                categories: xAxisItem.options.map(function (option) {
                    return option.label;
                }),
                title: {
                    text: params.x_axis_title || null
                }
            },
            yAxis: {
                title: { 
                    text: params.y_axis_title || null
                }
            },
            // colors: yAxisItem.options.map(function (option) {
            //     return option.settings.color;
            // }),
            chart: {
                type: params.chart_type || 'column'
            },
            title: {
                text: params.chart_title || null
            },
            series: {}
        };

        yAxisItem.options.forEach(function (yOption) {
            chartData.series[yOption.label] = {
                name: yOption.label,
                data: {}
            };
            xAxisItem.options.forEach(function (xOption) {
                chartData.series[yOption.label].data[xOption.label] = 0;
            })
        });

        data.forEach(function (d) {
            chartData.series[d.y_axis_label].data[d.x_axis_label] = parseFloat(d.count);
        });

        var seriesArray = [];
        Object.keys(chartData.series).forEach(function (sName) {
            var sItem = chartData.series[sName];

            var dataArray = [];
            Object.keys(sItem.data).forEach(function (dName) {
                dataArray.push(sItem.data[dName]);
            });

            seriesArray.push({
                name: sItem.name,
                data: dataArray
            });
        });

        chartData.series = seriesArray;
        callback(null, chartData);
    });
}

//
// TODO
//
function getLineChartData(req, res, params) {
    getXYData(req, res, params, function (xAxisItem, yAxisItem, data) {
        // build line chart data structure.
        sendJSONBody(res, arguments);
    });
}












//
//
// H E L P E R   F U N C T I O N S
//
//


//
// Handy wrapper for Node's http.request
// https://nodejs.org/api/http.html#http_http_request_options_callback
//
//    request({
//        method: 'GET',
//        host: 'apple.com',
//        path: '/ipad'
//    }, function (err, response) {
//        console.log(response.body); 
//    });
//
function request(options, params, callback) {
    var isHTTPS = options.https || options.protocol === 'https:';

    if (options.username && options.password) {
        options.auth = options.username + ':' + options.password;
    }

    options = {
        method: options.method || 'GET',
        hostname: options.host || options.hostname,
        port: options.port,
        path: options.path,
        headers: options.headers || {},
        auth: options.auth,
        agent: options.agent
    };

    if (isObject(params) || Array.isArray(params)) {
        if (/GET|HEAD/.test(options.method)) {
            
            var prefix = (options.path.indexOf('?') !== -1) ? '&' : '?';
            options.path += prefix + lib.querystring.stringify(params);

        } else if (/POST|PUT|DELETE/.test(options.method)) {

            if (!options.headers['Content-Type']) {
                params = lib.querystring.stringify(params);
                options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            } else if (options.headers['Content-Type'] === 'application/json') {
                params = JSON.stringify(params);
            }

            if (typeof params === 'string') {
                options.headers['Content-Length'] = params.length;
            }
        }
    }

    var client = isHTTPS ? lib.https : lib.http;
    var req = client.request(options, function (res) {
        parseSocketBody(res, function (err, body) {
            callback(err, {
                status: { 
                    code: res.statusCode, 
                    message: res.statusMessage 
                }, 
                headers: res.headers, 
                body: body 
            });
        });
    });

    req.on('err', function (err) {
        callback(err, { status: {}, headers: {}, body: '' });
    })

    if (/POST|PUT|DELETE/.test(options.method) && typeof params === 'string') {
        req.write(params);
    }

    req.end();
}


//
// Generic request/response socket body parser.
//
function parseSocketBody(socket, callback, options) {
    options = options || {};

    var sizeLimit = options.sizeLimit || POST_MAX_SIZE;
    var body = '';

    socket.on('data', function (chunk) {
        body += chunk;

        if (body.length > sizeLimit) {
            callback({ message: 'Socket size limit reached.' });
        }
    });

    socket.on('error', function (err) {
        callback(err, body);
    });

    socket.on('end', function () {
        callback(null, body);
    });
}


//
// Parse data form an urlencoded POST request.
//
function parsePOSTBody(req, res, callback) {
    parseSocketBody(req, function (err, body) {
        var params;

        if (err) {
            console.error('parsePOSTBody()', err);
            return sendJSONBody(res, ERROR.INVALID_PARAMETERS);
        }

        try {
            params = lib.querystring.parse(body);
        } catch (e) {
            console.error('parsePOSTBody()', e);
            return sendJSONBody(res, ERROR.INVALID_PARAMETERS);
        }

        callback(params);
    });
}


//
// Parse JSON data from a request.
//
function parseJSONBody(req, res, callback) {
    parseSocketBody(req, function (err, body) {
        var params;

        if (err) {
            console.error('parseJSONBody()', err);
            return sendJSONBody(res, ERROR.INVALID_PARAMETERS);
        }

        try {
            params = JSON.parse(body);
        } catch (e) {
            console.error('parseJSONBody()', e);
            return sendJSONBody(res, ERROR.INVALID_PARAMETERS);
        }

        if (!params.session_token) {
            params.session_token = req.headers['x-session-token'];
        }

        callback(params);
    });
}


//
// Send JSON response to a client.
//
function sendJSONBody(res, content) {
    var body = '{}';

    try {
        body = JSON.stringify(content);
    } catch (e) {}

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(body);
}


//
// Send a public error message to client and 
// log internal error message to STDERR.
//
function serverError(name, err, callback, publicErrMessage) {
    if (isFunction(callback)) {
        callback(publicErrMessage || ERROR.SERVER_ERROR);
    }
    console.error(name, err);
}


//
// Send email via Mailgun
//
function sendEmail(address, subject, html, callback) {
    request({
        method: 'POST',
        host: 'api.mailgun.net',
        path: '/v3/sandboxe17da976d031483d8d03ccdfc481b1aa.mailgun.org/messages',
        username: 'api',
        password: 'key-b775152af2341393f1ae467f02e9f0d6',
        https: true
    }, { 
        from: EMAIL_FROM,
        to: address,
        subject: subject,
        html: html
    }, function (err, response) {
        if (isFunction(callback)) {
            callback(err, body ? JSON.parse(body) : {});
        }
    });
}


//
// Compile HTML template by replaceing all {{variable}}
// strings with corresponding values.
//
function compileHTMLTemplate(templateString, values) {
    var varStart = '\\{\\{';
    var varEnd   = '\\}\\}';
    var names = Object.keys(values).join(varEnd + '|' + varStart);
    var regex = new RegExp(varStart + names + varEnd, 'g');

    return templateString.replace(regex, function (varName) {
        varName = varName.replace('{{', '').replace('}}', '');
        return values[varName];
    });
}


//
// Walk inside a directory hierarcy recursively 
// and return an array of all file paths found.
//
function getAllFilePathsSync(dirPath) {
    var files = [];

    lib.fs.readdirSync(dirPath).forEach(function (filename) {
        var path = lib.path.join(dirPath, filename);
        var stat = lib.fs.statSync(path);

        if (stat && stat.isDirectory()) {
            files = files.concat(getAllFilePathsSync(path));
        } else {
            files.push(path);
        }
    });

    return files;
}


//
// Get all files with specified extension and put them into an object.
// Filename of a file becomes a camelCased key in the object
// and the content of the file becomes a string value.
//
function getAllFileContentsSync(dirPath, extension) {
    var filePaths = getAllFilePathsSync(dirPath);
    var newlines  = /\n/g;
    var files     = {};

    filePaths.forEach(function (filePath) {
        if (lib.fs.statSync(filePath).isFile() && filePath.indexOf(extension) !== -1) {
            var fileContent = lib.fs.readFileSync(filePath, 'utf8');
            var fileName    = lib.path.basename(filePath, extension);
            var qName       = camelCase(fileName);
            files[qName]    = fileContent.replace(newlines, ' ');
        }
    });

    return files;
}


//
// Convert dashed/underscored string to camelCased one.
//
function camelCase(str) { 
    return str.toLowerCase().replace(/-|_(.)/g, function (match, charAfterDash) {
        return charAfterDash.toUpperCase();
    });
}


//
// Create an unique token.
//
function generateToken() {
    return lib.uuid.v1();
}


//
// Convert string to md5 hash.
//
function stringToHash(str) {
    return lib.crypto.createHash('md5').update(str).digest('hex');
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
            if (isObject(obj[prop])) {
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
// Merge any number of objects into a new object.
//
function merge() {
    var objects = Array.prototype.slice.call(arguments);
    return extend.apply(null, [{}].concat(objects));
}


//
// Convert any number of multi-diemensional array-like objects 
// into a single flat array.
//
// Example:
//   flatArray(1, 2, [3, 4, [5]], '6', ['7'], { num: 8 }, [9], 10);
//      => [1, 2, 3, 4, 5, '6', '7', { num: 8 }, 9, 10]
//
function flatArray() {
    var flat = [], i, arg, isArrayLike;

    for (i = 0; i < arguments.length; i += 1) {
        arg = arguments[i];
        isArrayLike = arg && typeof arg === 'object' && arg.length !== undefined;

        if (isArrayLike) {
            flat = flat.concat(flatArray.apply(null, arg));
        } else {
            flat.push(arg);
        }
    }

    return flat;
}


//
// Prepend zero to a number if it's less then ten.
// Used for Date objects.
//
function padZero(num) {
    return num < 10 ? '0' + num : num;
}


//
// From an array of obejcts find the one 
// that contains the passed key/value pairs.
//
function findObject(objects, searchPairs) {
    if (!Array.isArray(objects) || !isObject(searchPairs)) {
        return null;
    }

    var names = Object.keys(searchPairs);
    var i, j, matchesCount;

    for (i = 0; i < objects.length; i += 1) {
        matchesCount = 0;

        for (j = 0; j < names.length; j += 1) {
            if (objects[i][names[j]] == searchPairs[names[j]]) {
                matchesCount += 1;
            }
        }
        if (names.length === matchesCount) {
            return objects[i];
        }
    }

    return null;
}


//
// Check if variable is a valid object.
//
function isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
}


//
// Check if variable is a valid date object.
//
function isDate(obj) {
    return Object.prototype.toString.call(obj) === '[object Date]';
}


//
// Check if variable is a valid function.
//
function isFunction(obj) {
    return typeof obj === 'function';
}


//
// Remove all HTML tags from a string.
//
function stripHtmlTags(str) {
    return typeof str === 'string' ? str.replace(/<[^>]+>/ig, '') : '';
}


//
// An empty function. a.k.a noop function.
//
function doNothing() {}