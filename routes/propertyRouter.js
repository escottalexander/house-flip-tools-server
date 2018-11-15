'use strict';
const express = require('express');
const Sequelize = require('sequelize');
const { User, Property, Improvement } = require('../models');
const router = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const Op = Sequelize.Op

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
});


router.get('/:id/:slug', (req, res) => {
    console.log(req.user, req.params)
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

router.post('/add', jsonParser, (req, res) => {
    const requiredFields = ['address'];
    console.log(req.user)
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
            image_src: req.body.imageSrc,
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
        .then(property => res.status(201).json(Property.apiRepr(property)))
        .catch(err => res.status(500).send({ message: err.message }));
});


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
    if (toUpdate.address) {
        toUpdate.slug = slugify(toUpdate.address);
    }

    return Property
        .update(toUpdate, {
            where: {
                slug: req.params.slug
            }
        })
        .then(() => res.status(204).end())
        .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

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


/// Improvements Routing
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
        .catch(err => res.status(500).send({ message: err.message }));
});


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


module.exports = { router };