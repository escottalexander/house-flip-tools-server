'use strict';
const express = require('express');
const Sequelize = require('sequelize');
const { User, Property, Improvement } = require('../models');
const router = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const Op = Sequelize.Op

// GET all properties of user based on user id
router.get('/:id', (req, res) => {
    Property.findAll(
        {
            where: {
                user_id: req.params.id
            },
            include: [{
                model: Improvement,
                as: 'improvements'
            }]
        })
        .then(properties => res.json({
            properties: properties.map(property => Property.apiRepr(property))
        }))
        .catch(err => console.log(err))
});

// GET one property of user based on user id and property slug
router.get('/:id/:slug', (req, res) => {
    Property.findOne({
        where: {
            user_id: req.params.id,
            slug: req.params.slug
        },
        include: [{
            model: Improvement,
            as: 'improvements'
        }]
    })
        .then(property => res.json(Property.apiRepr(property)))
}
);

// POST a new property on a specific users account
router.post('/add', jsonParser, (req, res) => {
    const requiredFields = ['address'];
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        if (!(field in req.body)) {
            const message = `Missing \`${field}\` in request body`
            console.error(message);
            return res.status(400).send(message);
        }
    }
    return Property
        .create({
            user_id: req.user.id,
            slug: slugify(req.body.address),
            image_src: req.body.imgSrc,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            zip: req.body.zip,
            description: req.body.description,
            price: req.body.price,
            year_built: req.body.yearBuilt,
            roof_type: req.body.roofType,
            foundation_type: req.body.foundationType,
            exterior_material: req.body.exteriorMaterial,
            basement: req.body.basement,
            notes: req.body.notes,
            floor_size: req.body.floorSize,
            lot_size: req.body.lotSize,
            bedrooms: req.body.bedrooms,
            bathrooms: req.body.bathrooms,
            stories: req.body.stories
        })
        .then(property => {
            res.status(201).json(Property.apiRepr(property))
        })
        .catch(err => {
            res.status(500).send({ message: err.message })
        });
});

// PUT a specific property based on properties slug and id
router.put('/:slug/:id', jsonParser, (req, res) => {
    if (!(req.params.slug && req.body.slug && req.params.slug === req.body.slug.toString()) && !((req.params.id && req.body.id && req.params.id === req.body.id.toString()))) {
        const message = (
            `Request path params (${req.params}) and request body id ` +
            `(${req.body}) must match`);
        console.error(message);
        res.status(400).json({ message: message });
    }
    const toUpdate = {};

    const updateableFields = ["imgSrc", "address", "city", "state", "zip", "description", "price", "yearBuilt", "roofType", "foundationType", "exteriorMaterial", "basement", "notes", "floorSize", "lotSize", "bedrooms", "bathrooms", "stories"];

    updateableFields.forEach(field => {
        if (field in req.body) {
            toUpdate[field] = req.body[field];
        }
    });
    const underscored = {}
    for (let item in toUpdate) {
        underscored[camelToUnderscore(item)] = toUpdate[item];
    }

    if (underscored.address) {
        underscored.slug = slugify(underscored.address);
    }

    return Property
        .update(underscored, {
            where: {
                slug: req.params.slug
            }
        })
        .then(() => res.status(204).end())
        .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

// DELETE a property by slug
router.delete('/:slug', (req, res) => {
    return Property
        .destroy({
            where: {
                slug: req.params.slug
            }
        })
        .then(property => res.status(204).end())
        .catch(err => res.status(500).json({ message: 'Internal server error' }));
});


// POST a new improvement on a property
router.post('/:slug/add-improvement', jsonParser, (req, res) => {
    const requiredFields = ['name', "cost", "propertyId"];
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        if (!(field in req.body)) {
            const message = `Missing \`${field}\` in request body`
            console.error(message);
            return res.status(400).send(message);
        }
    }
    return Improvement
        .create({
            property_id: req.body.propertyId,
            name: req.body.name,
            cost: req.body.cost
        })
        .then(improvement => res.status(201).json(Improvement.apiRepr(improvement)))
        .catch(err => {
            console.log(err)
            res.status(500).send({ message: err.message })
        });
});

// PUT an improvement within a property to edit its details
router.put('/:slug/improvement/:id', jsonParser, (req, res) => {
    if (!((req.params.id && req.body.id && req.params.id === req.body.id.toString()))) {
        const message = (
            `Request path id (${req.params.id}) and request body id ` +
            `(${req.body.id}) must match`);
        console.error(message);
        res.status(400).json({ message: message });
    }
    const toUpdate = {};
    const updateableFields = ["name", "cost"];

    updateableFields.forEach(field => {
        if (field in req.body) {
            toUpdate[field] = req.body[field];
        }
    });

    return Improvement
        .update(toUpdate, {
            where: {
                id: req.params.id
            }
        })
        .then(() => res.status(204).end())
        .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

// DELETE an improvement based on improvement id
router.delete('/:slug/improvement/:id', (req, res) => {
    return Improvement
        .destroy({
            where: {
                id: req.params.id
            }
        })
        .then(improvement => res.status(204).end())
        .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .replace(/[\s\W-]+/g, '-');
}

function camelToUnderscore(key) {
    return key.replace(/([A-Z])/g, "_$1").toLowerCase();
}

module.exports = { router };