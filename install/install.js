'use strict';


var fs = require('fs');
var pg = require('pg');
var jsesc = require('jsesc');
var bcrypt = require('bcrypt');
var parseArgs = require('minimist');


var ARGV = parseArgs(process.argv.slice(2));
var DBUSER = ARGV.dbuser || 'postgres';
var DBPASS = ARGV.dbpass || 'xxxxx';
var DBNAME = ARGV.dbname || 'btr';
var PGHOST = ARGV.pghost || '127.0.0.1';
var PGPORT = ARGV.pgport || 5432;
var PG_CONN_STRING = 'postgres://'+DBUSER+':'+DBPASS+'@'+PGHOST+':'+PGPORT+'/'+DBNAME;
var FORM_FILE = ARGV.form || 'btr.json';



//
// Constants
// 
var REGEX_SETTINGS_FIELD = /^label|hint|type|options|items$/i;



// 
// Prompt
// 

// process.stdin.setEncoding('utf8');
// process.stdin.setRawMode(true);

// process.stdin.on('data', function (input) {
//     var chunk = process.stdin.read();
//     process.stdout.write('*');
    
//     // ctrl-c ( end of text )
//     if (input === '\u0003') {
//         process.exit(0);
//     }
//     // if (chunk !== null) {
//     //     process.stdout.write(`data: ${chunk}`);
//     // }
// });

// process.stdin.on('end', function () {
//     // process.stdout.write('end');
// });




var prompt = {
    show: function (route) {
        prompt.currentRoute = route;
        process.stdout.write(route.text);
    },

    //
    // save current prompt route
    // 
    currentRoute: null,

    //
    // collect entered data here
    // 
    data: {
        user: {
            id: null,
            email: null,
            password: null,
            passwordRe: null,
            firstName: null,
            lastName: null
        }
        // project: {
        //     id: null,
        //     title: null
        // }
    },

    // 
    // prompt questions with question text and handlers
    // 
    routes: {
        createUser: {
            text: 'Crate user. \nEmail: ',
            fn: function (input) {
                if (input.indexOf('@') === -1 || input.length < 3) {
                    return process.stdout.write('Enter non-blank valid email address: ');
                }
                prompt.data.user.email = input;
                countUsersByEmail(input, function (count) {
                    if (count > 0) {
                        process.stdout.write('Email already exists.\nEnter different email: ');
                    } else {
                        prompt.show(prompt.routes.createUserPassword);
                    }
                });
            }
        },
        createUserPassword: {
            text: 'Password: ',
            fn: function (input) {
                if (input.length < 3) {
                    return process.stdout.write('Minimum length must be 3 characters: ');
                }
                prompt.data.user.password = input;
                prompt.show(prompt.routes.createUserPasswordRe);
            }
        },
        createUserPasswordRe: {
            text: 'Confirm password: ',
            fn: function (input) {
                if (prompt.data.user.password != input) {
                    return process.stdout.write('Password missmatch. Enter again: ');
                }

                prompt.data.user.passwordRe = input;
                prompt.show(prompt.routes.createUserFirstName);
            }
        },
        createUserFirstName: {
            text: 'First name (optional): ',
            fn: function (input) {
                prompt.data.user.firstName = input.trim() || null;
                prompt.show(prompt.routes.createUserLastName);
            }
        },
        createUserLastName: {
            text: 'Last name (optional): ',
            fn: function (input) {
                prompt.data.user.lastName = input.trim() || null;
                createUser(prompt.data.user, function () {
                    prompt.show(prompt.routes.createForm);
                });
            }
        },
        // CREATE_PROJECT: {
        //     text: 'Now, let\'s create the project.\nTitle: ',
        //     fn: function (input) {
        //         if (input.trim().length === 0) {
        //             return process.stdout.write('Non-blank title is rquired: ');
        //         }
        //         prompt.data.project.title = input.trim();
        //         prompt.routes.CREATE_PROJECT_DONE.text = 
        //             prompt.routes.CREATE_PROJECT_DONE.text.replace('{title}', prompt.data.project.title);
        //         prompt(prompt.routes.CREATE_PROJECT_SLUG);
        //     }
        // },
        // CREATE_PROJECT_SLUG: {
        //     text: 'Url (e.g. funnystories.abc.org): ',
        //     fn: function (input) {
        //         if (input.trim().length === 0) {
        //             return process.stdout.write('Url can\'t be blank: ');
        //         }
        //         prompt.data.project.slug = input.trim();
        //         prompt(prompt.routes.CREATE_PROJECT_DONE);
        //     }
        // },
        // CREATE_PROJECT_DONE: {
        //     text: ['Project, "{title}" successfully crated.',
        //           'Now, create form.json file in root directory to add some survey.',
        //           '(press return(enter) to start inserting...) \n'].join('\n'),
        //     fn: function () {
        //     }
        // },
        createForm: {
            text: 'Make sure you have a form.json file present and hit Enter/Return key.\n',
            fn: function () {
                createForm(function () {
                    // console.log('Done.\n');
                    process.exit(0);
                });
            }
        },
        start: {
            text: 'Do you want to create an admin user or you have already got one? \nAnswer: Yes or No\n',
            fn: function (input) {
                switch (input.toLowerCase()) {
                    case 'yes':
                        prompt.show(prompt.routes.createUser); break;
                    case 'no':
                        prompt.show(prompt.routes.createForm); break;
                    default:
                        process.stdout.write('Do you have trouble writing "Yes" or "No"? Try again.\n');
                }
            }
        }
    }
};

function init() {
    countForms(function (count) {
        if (count > 0) {
            console.log(
                'Sorry, form(s) already exists. Another form creation is not allowed.');
            process.exit(0);
        }

        process.openStdin().addListener('data', function (data) {
            var input = data.toString().trim();
            prompt.currentRoute.fn(input);
        });

        prompt.show(prompt.routes.start);
    });
}

init();

 



//
// Db functinos
// 
function countForms(cb) {
    var client = new pg.Client(PG_CONN_STRING);
    client.connect();

    client.query('UPDATE forms SET status = -1');
    cb(0);

    // client.query('SELECT COUNT(1) AS count FROM forms WHERE status = 1', null, function (err, res) {
    //     if (err) {
    //         console.log('Error while retrieving forms. Please check your database.');
    //         console.log(err);
    //         process.exit(1);
    //         return client.end.bind(client); 
    //     }
    //     cb(res.rows[0].count);
    // });
}

function countUsersByEmail(email, cb) {
    var client = new pg.Client(PG_CONN_STRING);
    client.connect();

    transaction(client, function (err) {
        if (err) return rollback(client);

        client.query('SELECT COUNT(1) as count FROM users WHERE email = $1', [email], function (err, res) {
            if (err) {
                rollback(client);
                console.log('Error while counting users by email.');
                console.log('[error: ', err.detail, ']');
                process.exit(1);
            }
            cb(res.rows[0].count);
        });
    });
}

function createUser(user, cb) {
    var query = 'INSERT INTO users (email, password, first_name, last_name, settings) ' +
                'VALUES ($1, $2, $3, $4, $5) RETURNING id';
    var params = [
        user.email, 
        bcrypt.hashSync(user.password, 10), 
        user.firstName, 
        user.lastName,
        '{ "created-by": "installer" }'
    ];

    var client = new pg.Client(PG_CONN_STRING);
    client.connect();
    
    transaction(client, function (err) {
        if (err) return rollback(client);

        client.query(query, params, function (err, res) {
            if (err) {
                console.log('Error while creating user. Please, try again.');
                console.log('[error: ', err.detail, ']');
                prompt.show(prompt.routes.createUser);
                return rollback(client);
            }
            
            commit(client);
            user.id = res.rows[0].id;
            console.log('User ' + user.email + ' created successfully.\n');
            cb();
        });
    });
}

function createForm(cb) {
    var formJson,
        formObject;

    // 
    // Open file
    // 
    try {
        formJson = fs.readFileSync(FORM_FILE, { encoding: 'utf-8' });
    } catch(e) {
        return console.log('Error while opening file: ', e.message);
    }

    // 
    // Convert file text to JSON
    // 
    try {
        formObject = JSON.parse(formJson);
    } catch(e) {
        return console.log('Error while parsing json: ', e.message);
    }


    // 
    // Lang and last inserted IDs
    // 
    var LANG           = formObject.lang;
    var SEQ_FORM_ID    = "(SELECT currval('forms_id_seq'))";
    var SEQ_SECTION_ID = "(SELECT currval('form_sections_id_seq'))";
    var SEQ_ITEM_ID    = "(SELECT currval('form_items_id_seq'))";
    var SEQ_OPTION_ID  = "(SELECT currval('form_item_options_id_seq'))";



    //
    // Convert json object to SQL insert series
    // 
    function createFormQuery(form) {
        var query = [
            "INSERT INTO forms (status)",
            "VALUES (1);",

            // "INSERT INTO form_languages (form_id, lang)",
            // "VALUES (" + SEQ_FORM_ID + ", " + escape(LANG) + ");",

            "INSERT INTO form_translations(form_id, lang, title, description)",
            "VALUES (",
            SEQ_FORM_ID,
            ", " + escape(form.lang),
            ", " + escape(form.title),
            ", " + escape(form.description),
            ") RETURNING *;"
        ].join(" ");
        query += createSectionsQuery(form.sections);
        return query;
    }

    function createSectionsQuery(sections) {
        var query = "";
        sections.forEach(function (section) {
            query += [
                "INSERT INTO form_sections(form_id)",
                "VALUES (" + SEQ_FORM_ID + ");",

                "INSERT INTO form_section_translations (section_id, lang, title, description)",
                "VALUES (",
                SEQ_SECTION_ID,
                ", " + escape(LANG),
                ", " + escape(section.title),
                ", " + escape(section.description),
                ");"
            ].join(" ");
            query += createItemsQuery(section.items);
        });
        return query;
    }

    function createItemsQuery(items, parentId) {
        if (!Array.isArray(items)) return '';

        var query = "";
        
        items.forEach(function (item) {
            query += [
                "INSERT INTO form_items (form_id, section_id, parent_id, type, settings)",
                "SELECT", // Because of sequence... 
                SEQ_FORM_ID, 
                "," + SEQ_SECTION_ID, 
                "," + (parentId || 0),
                ", " + ("(SELECT id FROM form_item_types WHERE name = '" 
                     + item.type.toLowerCase().replace(/\s/ig, '-') + "')"),
                ", " + escape(createSettingsValue(item)),
                ";"
            ].join('');
            query += [
                "INSERT INTO form_item_translations (item_id, lang, label, description)",
                "SELECT", // Because of sequence... 
                SEQ_ITEM_ID,
                ", " + escape(LANG),
                ", " + escape(item.label),
                ", " + escape(item.description),
                ";"
            ].join(" ");
            query += createOptionsQuery(item.options);

            if (item.items) {
                query += createItemsQuery(item.items, SEQ_ITEM_ID);
            }
        });
        
        return query;
    }

    function createOptionsQuery(options) {
        if (!(options instanceof Array)) return "";
        var query = "";
        var valueCounter = 0;
        options.forEach(function (option) {
            valueCounter += 1;

            query += [
                "INSERT INTO form_item_options (form_id, section_id, item_id, value, settings)",
                "VALUES (",
                SEQ_FORM_ID,
                ", " + SEQ_SECTION_ID,
                ", " + SEQ_ITEM_ID,
                ", " + valueCounter,
                ", " + escape(createSettingsValue(option)),
                ");"
            ].join(" ");

            query += [
                "INSERT INTO form_item_option_translations (option_id, lang, label)",
                "VALUES (",
                SEQ_OPTION_ID,
                ", " + escape(LANG),
                ", " + escape(option.label),
                ");"
            ].join(" ");
        });
        return query;
    }

    function createSettingsValue(obj) {
        var settings = {};

        for(var key in obj) {
            if (!REGEX_SETTINGS_FIELD.test(key)) {
                settings[key] = obj[key];
            }
        }

        return JSON.stringify(settings);
    }

    // Whole sql insert query
    var QUERY_INSERT = createFormQuery(formObject);


    //
    // Execute SQL
    // 
    var client = new pg.Client(PG_CONN_STRING);
    client.connect();
    client.query('BEGIN', function (err) {
        if (err) rollback(client);
        client.query(QUERY_INSERT, null, function (err, form) {
            if (err) rollback(client);
            commit(client);
            console.log(err ? err : '"' + form.rows[0].title + '" with ID ' + form.rows[0].form_id + ' successfully created.');
            cb();
        });
    });
}



//
// Pg helper functions
// 
function escape(text) {
    return text ? "E'" + jsesc(text) + "'" : null;
}

function transaction(client, cb) {
    client.query('BEGIN', function (err, res) {
        if (err) process.stdout.write("Error while opnenting transaction. Please check your database.");
        cb(err, res);
    });
}

function rollback(client) {
    client.query('ROLLBACK', client.end.bind(client));
}

function commit(client) {
    client.query('COMMIT', client.end.bind(client));
}
