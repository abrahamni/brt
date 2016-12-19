'use strict';

var bcrypt = require('bcrypt');
var parseArgs = require('minimist');
var ARGV = parseArgs(process.argv.slice(2));

if (ARGV.email && ARGV.password) {
    bcrypt.hash(ARGV.password, 10, function (err, hashedPassword) {
        if (err) { return console.error('signUp() > bcrypt.hash', err); }
        console.log('User password', hashedPassword);
    });
}