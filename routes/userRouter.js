'use strict';
const express = require('express');
const bodyParser = require('body-parser');

const { User } = require('../models');

const router = express.Router();

const jsonParser = bodyParser.json();

// POST to register a new user
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
    email = email.trim();

    return User.findOne({ where: { username: username } })
        .then(user => {
            if (user) {
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
            if (err.reason === 'ValidationError') {
                return res.status(err.code).json(err);
            }
            res.status(500).json({ code: 500, message: err });
        });
});

// GET all users - Not to be used in production application
router.get('/', (req, res) => {
    return User.findAll()
        .then(users => res.json(users.map(user => User.apiRepr(user))))
        .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

// DELETE a user
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