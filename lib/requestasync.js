"use strict";
let Request = require(`request`);
let Promise = require(`bluebird`);
let RequestAsync = Promise.promisify(Request);

module.exports.request = RequestAsync;
