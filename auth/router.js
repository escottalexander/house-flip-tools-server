'use strict';
const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { User } = require('../models')
const config = require('../config');
const router = express.Router();

// Create an auth token with the users credentials and secret pass phrase
const createAuthToken = function (user) {
    return jwt.sign({ user }, config.JWT_SECRET, {
        subject: user.username,
        expiresIn: config.JWT_EXPIRY,
        algorithm: 'HS256'
    });
};

const localAuth = passport.authenticate('local', { session: false });

router.use(bodyParser.json());

// Login endpoint - Verify user exists and password is correct. Provide a new JWT token.
router.post('/login', localAuth, (req, res) => {

    return User.find({ where: { username: req.body.username } })
        .then(user => createAuthToken(User.apiRepr(user)))
        .then(authToken => res.json({
            authToken
        }))
});

const jwtAuth = passport.authenticate('jwt', { session: false });

// Refresh endpoint to refresh expiration of JWT token - not used in house flip tools
router.post('/refresh', jwtAuth, (req, res) => {
    const authToken = createAuthToken(req.user);
    res.json({ authToken });
});

module.exports = { router };

