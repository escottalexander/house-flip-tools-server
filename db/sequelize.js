'use strict';
require('dotenv').config();
// this module initializes and exports a sequelize instance
// connected to the database specified in `../config.js`.
// Sequelize uses a *singleton* design pattern, meaning
// that we should only have a single sequelize instance
// and connection in our app.
// we'll import this sequelize instance in our model files
// and in server.js
const Sequelize = require('sequelize');
// `DATABASE_URL` is the url (inclusive of username, password, port,
// if required) of the db to connect to. `SEQUELIZE_OPTIONS` is an
// object that can contain the properties indicated at
// http://docs.sequelizejs.com/en/latest/api/sequelize/#new-sequelizedatabase-usernamenull-passwordnull-options
const { DATABASE_URL, SEQUELIZE_OPTIONS } = require('../config');

console.log(`Connecting to database at ${DATABASE_URL}`);
const sequelize = new Sequelize(DATABASE_URL, SEQUELIZE_OPTIONS);

// we shouldn't initialize a new Sequelize instance anywhere else
// in this app. if another module needs a sequelize instance, it
// should import this one.
module.exports = {
    sequelize
};