require('dotenv').config();
const { PORT } = require('../config');
const { runServer, closeServer } = require('../server');
const { sequelize } = require('../db/sequelize');

before(function () {
    return sequelize
        .sync({ force: true })
        .then(() => {
            runServer(PORT);
        })
        .catch((error) => {
            console.error(error)
            done(error);
        });
});

after(function () {
    return closeServer();
});