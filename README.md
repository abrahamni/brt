![](----)  
### `DataPage Dev`
`Open source (developers) version of AAA DataPage platform.`


&nbsp;

&nbsp;

* * *
*WORK IN PROGRESS...*
* * *

&nbsp;

&nbsp;





# Software/System requirements

- Unix OS
- Nginx 1.8+
- NodeJs 4+
- NPM 3+
- foreverjs (CLI tool/daemon) 0.15+
- PostgreSQL 9.5+


&nbsp;

&nbsp;





# Configure and run backend/API
API runs behind Nginx proxy and handles all dynamic assets. Nginx handles all static assets.  
Example of Nginx configuration is proveded below:
```
server {
    listen 80;
    server_name example.com;
    
    root /var/www/example.com/web/public;    
    index index.html;

    location ~* ^/api {    
        proxy_set_header X-NginX-Proxy true;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;

        proxy_pass http://127.0.0.1:4321;
        proxy_redirect off; 
    }

    location / {
        try_files $uri $uri/ /index.html?$args;
    }
}
```

[foreverjs](https://github.com/foreverjs/forever) is used to run backend NodeJs application as daemon. It takes a configuration JSON file where location of application script, database connection and other relevant variables are provided.
```json
{
    "uid": "example.com",
    "append": true,
    "watch": false,
    "script": "api.js",
    "sourceDir": "/var/www/example.com/api",
    "args": ["--dbuser", "example_user", "--dbname", "example_website", "--dbpass", "123456789", "--pghost", "locahost", "--pgport", 5432]
}
```
```sh
forever start example.json
```



&nbsp;

&nbsp;



# Development
Both client wesbite and admin/managment websites are standalone Single Page Applications (SPA) that use backend/API for all create/read/update/delete (CRUD) operations.

Developments source files for both of those apps are located at `/web` and `/admin` directories respectively. Production, minfied files and other public assets are located at `/public` child directory inside those apps.

For watching and building source files `npm scripts` are used and they can be run for each of those apps individually.
```sh
npm run web
```
```sh
npm run admin
```





&nbsp;

&nbsp;




# API Concepts

## Request parameters

GET requests use standard query string parameters.

```
GET /api/form?id=1
```

POST, PUT and DELETE requests work with JSON objects.

```js
// jQuery example.
jQuery.ajax({
    url: '/api/form/response',
    type: 'POST',
    contentType: 'application/json; charset=utf-8',
    data: JSON.stringify({ ... })
})
```



## Response Object

All responses from API are in this standard format.

```js
{
    "error": "invalid-parameter", // or null if no error occured.
    "data": [] /* or */ {}
}
```



## Sessions

For all API calls where a valid user is required a client must send a session token parameter as HTTP header for every request.

```js
// jQuery example.
jQuery.ajax({
    url: '/api/something',
    headers: { 'x-session-token': 'v5234342bvcdg4d22' }
});
``` 



## Error messages

API calls returns just one or two word error messages and they work like error codes, for example:
if email exists server returns ```{ "error": "email-exists" }```, therefore client should use error messages to figure out what happened and not to print them to users.

**Messages and their meanings:**
<table>
<tr>
<td>server-error</td>
<td>An error that is not directly related to API call. A database connection problem, server exception and etc.</td>
</tr>
<tr>
<td>invalid-parameters</td>
<td>Parameters requried by an API call are missing.</td>
</tr>
<tr>
<td>invalid-token</td>
<td>A user session token sent by client is invalid or expired.</td>
</tr>
<tr>
<td>invalid-password-token</td>
<td>A password reset token sent by client is invalid or expired.</td>
</tr>
<tr>
<td>invalid-credentials</td>
<td>Email/password combination sent by client doesn't match any records in database.</td>
</tr>
<tr>
<td>invalid-email</td>
<td>Email is not formatted correctly.</td>
</tr>
<tr>
<td>password-nomatch</td>
<td>Two passwords sent by client doesn't match.</td>
</tr>
<tr>
<td>wrong-password</td>
<td>Password sent by client doesn't match the password in database.</td>
</tr>
<tr>
<td>email-exists</td>
<td>User with this email already exists in database.</td>
</tr>
<tr>
<td>permission-denied</td>
<td>Current user doesn't have necessary permission to do the requested action.</td>
</tr>
<tr>
<td>empty-fields</td>
<td>Required fields are missing.</td>
</tr>
</table>



&nbsp;

&nbsp;



# API Endpoints and Documentation
- [POST /api/signup](#post-apisignup)
- [POST /api/login](#post-apilogin)
- [POST /api/reset-password](#post-apireset-password)
- [POST /api/confirm-reset-password](#post-apiconfirm-reset-password)
<br /><br />
- [GET /api/languages](#get-apilanguages)
- [GET /api/ui-translations](#get-apiui-translations)
<br /><br />
- [GET /api/form](#get-apiform)
- [GET /api/form/responses](#get-apiformresponses)
- [POST /api/form/response](#post-apiformresponse)

&nbsp;



## POST /api/signup
Client sends two passwords and an email address.

```js
{
    "email": "lorem@ipsum.com",
    "password": "lorem",
    "password_repeated": "lorem",
}
```

API checks email validity and password match, but for faster user experience client should also check these before sending a request.
API also checks if email exists and responds with an error message if that's the case.

If every test passes, API creates a new user, creates a session token and responds with data that looks like this:
```js
{
    "id": "1",
    "email": "lorem@ipsum.com",
    "first_name": "",
    "last_name": "",
    "session_token": "x3424cvz3c56xzv4c2vcxzv1"
}
```

Possible errors:
```js
{ "error": "server-error" }
{ "error": "invalid-email" }
{ "error": "password-nomatch" }
{ "error": "email-exists" }
```



## POST /api/login
This API call has dual mode. One with `email` and `password` and one with just `session_token`.

```js
{
    "email": "lorem@ipsum.com",
    "password": "lorem"
}
{
    "session_token": "x3424cvz3c56xzv4c2vcxzv1"
}
```

If client sends email and password, API does usual authentication procedure and responds 
either with an error `invalid-credentials` or with successful data.
If client sends a session token, API checks if that token is "valid" and responds 
either with error `invalid-token` or with successful data.

Successful login response is same as response after successful sign up:
```js
{
    "id": "1",
    "email": "lorem@ipsum.com",
    "first_name": "",
    "last_name": "",
    "session_token": "x3424cvz3c56xzv4c2vcxzv1"
}
```

Possible errors:
```js
{ "error": "server-error" } 
{ "error": "invalid-credentials" } 
{ "error": "invalid-token" }
```


## POST /api/reset-password
Client sends an email address. 

```js
{  "email": "lorem@ipsum.com" }
```

If email address exists in database, API generates password reset token and 
sends an email to the user with a password reset link that looks like this:
```
http://example.com/confirm-reset-password?token=34b5234v52345d24g243v5234342bvcdg4d223
```

For security reasons there's no error for this API call, if email doesn't exists, API just ignores the call.



## POST /api/confirm-reset-password
Client sends the received password token (from url) with new password.

```js
{
    "password": "newlorem",
    "password_repeated": "newlorem",
    "password_reset_token": "34b5234v52345d24g243v5234342bvcdg4d223"
}
```

API checks if passwords match, reset token is still valid and changes the user's password.

Possible errors:
```js
{ "error": "server-error" } 
{ "error": "password-nomatch" } 
{ "error": "invalid-password-token" }
```



&nbsp;

&nbsp;



## GET /api/languages

Client does not send any parameters.  
API returns list of all languages, list of active/enabled languages and a default language.

```js
{
    "error": null,
    "data": {
        "languages": [
            ...
        ],
        "enabledLanguages": [{
            "code": "en",
            "name": "English",
            "native_name": "English"
        }, {
            "code": "AB",
            "name": "XY",
            "native_name": "zyers"
        }],
        "defaultLanguage": {
            "code": "en",
            "name": "English",
            "native_name": "English"
        }
    }
}
```

Possible errors:

```js
{ "error": "server-error" }
```


## GET /api/ui-translations

Client sends a language code.

```
lang: "en"
```

API returns list of predefined key/value text translations used throughout the platform.

```js
{
    "error": null,
    "data": [{
        "lang": "en",
        "t_key": "404-title",
        "t_value": "Oops... Page not found.",
        "t_group": "labels"
    }, {
        "lang": "en",
        "t_key": "about",
        "t_value": "About",
        "t_group": "labels"
    }, {
        "lang": "en",
        "t_key": "add-team-member",
        "t_value": "Add",
        "t_group": "labels"
    }]
}
```

Possible errors:

```js
{ "error": "server-error" }
{ "error": "invalid-parameters" }
```



&nbsp;

&nbsp;

&nbsp;



## GET /api/form

Client sends a language code.

```
lang: "en"
```

API returns currently active form in specified language.

```js
{
    "error": null,
    "data": {
        "id": "1",
        "created_at": "2016-08-01T09:45:46.135Z",
        "updated_at": "2016-08-01T09:45:46.135Z",
        "settings": {},
        "title": "Form title",
        "description": null,
        "items": [{
            "id": "1",
            "label": "Where you asked to ---?",
            "type": "choice",
            "settings": {
                "required": true
            },
            "options": [{
                "id": "1",
                "label": "Yes",
                "responses_count": "22"
            }, {
                "id": "2",
                "label": "No",
                "responses_count": "0"
            }],
            "items": [{
                "id": "2",
                "parent_id": "1",
                "label": "Did you pay ---?",
                "type": "choice",
                "settings": {},
                "options": [{
                    "id": "3",
                    "label": "Yes, ---",
                    "responses_count": "4"
                }, {
                    "id": "4",
                    "label": "No, ---",
                    "responses_count": "0"
                }]
            }
        }, {
            ...
        }]
    }
}
```

Possible errors:

```js
{ "error": "server-error" }
{ "error": "invalid-parameters" }
```



## GET /api/form/responses

Client sends a language code, form id and an optional start/end dates.

```
lang: "en",
form_id: 1,
from: "2015-01-30",
to: "2016-12-30"
```

API returns all submitted responses ordered by date.

```js
{
    "error": null,
    "data": [{
        "response_id": 1,
        "created_at": "2016-08-01T09:45:46.135Z",
        "items": [{
            "item_id": 1,
            "item_label": "Where you asked ---?",
            "item_type": "choice",
            "option_label": "Yes",
            "option_id": 1,
            "value": 1
        }, {
            "item_id": 1,
            "item_label": "Where you asked ---?",
            "item_type": "choice",
            "option_label": "No",
            "option_id": 1,
            "value": 2
        },
        ....
        ]
    },
    ....
    ]
}
```

Possible errors:

```js
{ "error": "server-error" }
{ "error": "invalid-parameters" }
```


## POST /api/form/response

Client sends form id and all required item responses.  
Each item must be an object with `item_id` property present.   
For `choice`, `scale` and `location-choice` type items an `option_id` must be specified.   
For `datetime` and `number` type items a `value` must be specified.   
For `text` type items an object with language code and corresponding value must be specified.

```js
{
    "form_id": 1,
    "items": [
        { "item_id": 5, "option_id": 8, "value": null }, // scale, choice, location-choice
        { "item_id": 6, "option_id": null, "value": "2016-08-07" }, // datetime
        { "item_id": 7, "option_id": null, "value": "1.5" }, // number
        { "item_id": 8, "option_id": null, "value": { "lang": "en", "text": "Lorem ipsum dollar sit amet." } } // text
    ]
}
```

API response with empty object if a call was successful.

```js
{
    "error": null,
    "data": {}
}
```

Possible errors:

```js
{ "error": "server-error" }
{ "error": "invalid-parameters" }
{ "error": "empty-fields" }
```
