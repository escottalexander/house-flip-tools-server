require('dotenv').config();
const { PORT } = require('../config');
const { runServer, closeServer } = require('../server');
const { sequelize } = require('../db/sequelize');
// we have global `before` and `after` routines here
// that run before and after the entire suite of tests
// run (even when there's multiple test files).

before(function () {
    // sequelize will create all tables it needs for the models
    // it has imported in `../db/sequelize`.
    return sequelize
        // this option will force any existing tables with same
        // name as the ones it's creating to be dropped.
        // http://docs.sequelizejs.com/en/latest/api/sequelize/#syncoptions-promise
        .sync({ force: true })
        // start the server only after we've successfully created our
        // tables
        .then(() => {
            runServer(PORT);
        })
        .catch((error) => {
            console.error(error)
            done(error);
        });
});

// we close only once: when all the tests have finished running.
after(function () {
    // N.B. `closeServer` both disconnects from the database and
    // stops the server
    return closeServer();
});