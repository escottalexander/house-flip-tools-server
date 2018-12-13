require('dotenv').config();
const express = require('express');
const { PORT, DATABASE_URL, CLIENT_ORIGIN } = require('./config');
const app = express();
const { sequelize } = require('./db/sequelize');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
const bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const { userRouter, propertyRouter } = require('./routes');
const { router: authRouter, localStrategy, jwtStrategy } = require('./auth');

// Logging
app.use(morgan('common'));

// CORS policy - CLIENT_ORIGIN enviroment variable must be set
app.use(
    cors({
        origin: CLIENT_ORIGIN
    })
);

// Initialize passport with our authentication strategies
passport.use(localStrategy);
passport.use(jwtStrategy);

const jwtAuth = passport.authenticate('jwt', {
    session: false
});

// Route to different endpoint handlers - check authentication before accessing propertyRouter
app.use('/api/users/', userRouter);
app.use('/api/auth/', authRouter);
app.use('/api/properties/', jwtAuth, propertyRouter);

app.use('*', (req, res) => {
    return res.status(404).json({ message: 'Not Found' });
});

// Server set up where it can be exported
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
        console.log('Closing server');
        server.close(err => {
            sequelize.close()
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