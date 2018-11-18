'use strict';
const express = require('express');
const bodyParser = require('body-parser');

const { User } = require('../models');

const router = express.Router();

const jsonParser = bodyParser.json();

// Post to register a new user
router.post('/', jsonParser, (req, res) => {
    const requiredFields = ['username', 'password', 'email'];
    const missingField = requiredFields.find(field => !(field in req.body));

    if (missingField) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: 'Missing field',
            location: missingField
        });
    }

    const stringFields = ['username', 'password', 'email'];
    const nonStringField = stringFields.find(
        field => field in req.body && typeof req.body[field] !== 'string'
    );

    if (nonStringField) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: 'Incorrect field type: expected string',
            location: nonStringField
        });
    }

    // If the username and password aren't trimmed we give an error.  Users might
    // expect that these will work without trimming (i.e. they want the password
    // "foobar ", including the space at the end).  We need to reject such values
    // explicitly so the users know what's happening, rather than silently
    // trimming them and expecting the user to understand.
    // We'll silently trim the other fields, because they aren't credentials used
    // to log in, so it's less of a problem.
    const explicityTrimmedFields = ['username', 'password'];
    const nonTrimmedField = explicityTrimmedFields.find(
        field => req.body[field].trim() !== req.body[field]
    );

    if (nonTrimmedField) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: 'Cannot start or end with whitespace',
            location: nonTrimmedField
        });
    }

    const sizedFields = {
        username: {
            min: 1
        },
        password: {
            min: 10,
            // bcrypt truncates after 72 characters, so let's not give the illusion
            // of security by storing extra (unused) info
            max: 72
        }
    };
    const tooSmallField = Object.keys(sizedFields).find(
        field =>
            'min' in sizedFields[field] &&
            req.body[field].trim().length < sizedFields[field].min
    );
    const tooLargeField = Object.keys(sizedFields).find(
        field =>
            'max' in sizedFields[field] &&
            req.body[field].trim().length > sizedFields[field].max
    );

    if (tooSmallField || tooLargeField) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: tooSmallField
                ? `Must be at least ${sizedFields[tooSmallField]
                    .min} characters long`
                : `Must be at most ${sizedFields[tooLargeField]
                    .max} characters long`,
            location: tooSmallField || tooLargeField
        });
    }

    let { username, password, email } = req.body;
    // Username and password come in pre-trimmed, otherwise we throw an error
    // before this
    email = email.trim();

    return User.findOne({ where: { username: username } })
        .then(user => {
            if (user) {
                console.log("user exists!")
                // There is an existing user with the same username
                return Promise.reject({
                    code: 422,
                    reason: 'ValidationError',
                    message: 'Username already taken',
                    location: 'username'
                });
            }
            return User.hashPassword(password);
        })
        .then(hash => {
            return User.create({
                username,
                password: hash,
                email
            })
                .then((user) => {
                    return res.status(201).json(User.serialize(user));
                })
        })
        .catch(err => {
            // Forward validation errors on to the client, otherwise give a 500
            // error because something unexpected has happened
            if (err.reason === 'ValidationError') {
                return res.status(err.code).json(err);
            }
            res.status(500).json({ code: 500, message: err });
        });
});

// Never expose all your users like below in a prod application
// we're just doing this so we have a quick way to see
// if we're creating users. keep in mind, you can also
// verify this in the Mongo shell.
router.get('/', (req, res) => {
    return User.findAll()
        .then(users => res.json(users.map(user => User.apiRepr(user))))
        .catch(err => res.status(500).json({ message: 'Internal server error' }));
});


router.delete('/:id', (req, res) => {
    return User.destroy({
        where: {
            id: req.param.id
        }
    }).then(
        () => res.status(204).json({ message: "user deleted" })
    )
        .catch(err => {
            console.log(err)
            res.status(500).json({ message: err })
        });
});

module.exports = { router };