require('dotenv').config();
const express = require('express');
const { PORT, DATABASE_URL } = require('./config');
const app = express();
const { sequelize } = require('./db/sequelize');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
const { CLIENT_ORIGIN } = require('./config');

const { router: usersRouter } = require('./users');
const { router: authRouter, localStrategy, jwtStrategy } = require('./auth');

app.use(morgan('common'));

app.use(
    cors({
        origin: CLIENT_ORIGIN
    })
);

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use('/api/users/', usersRouter);
app.use('/api/auth/', authRouter);

const jwtAuth = passport.authenticate('jwt', { session: false });

app.get('/dashboard', jwtAuth, (req, res) => {
    return res.json({
        data: 'rosebud'
    });
});

app.use('*', (req, res) => {
    return res.status(404).json({ message: 'Not Found' });
});

let server;

function runServer(port) {
    return new Promise((resolve, reject) => {
        try {
            server = app.listen(port, () => {
                console.log(`App listening on port ${port}`);
                resolve();
            });
        }
        catch (err) {
            console.error(`Can't start server: ${err}`);
            reject(err);
        }
    });
}

function closeServer() {
    return new Promise((resolve, reject) => {
        // not a promise yet, but will be soon?
        // https://github.com/sequelize/sequelize/pull/5776
        console.log('Closing server');
        server.close(err => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}

if (require.main === module) {
    runServer(PORT).catch(
        err => {
            console.error(`Can't start server: ${err}`);
            throw err;
        });
};

module.exports = { app, runServer, closeServer };