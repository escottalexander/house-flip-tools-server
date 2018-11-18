'use strict';
require('dotenv').config();
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const jwt = require('jsonwebtoken');
const { app } = require('../server')
const {
    JWT_SECRET
} = require('../config');
const should = chai.should();


const { User, Property, Improvement } = require('../models');

chai.use(chaiHttp);

const email = 'freddy@mercury.com';
const username = 'exampleUser';
const password = 'examplePass';
let user_id;
let token;



function seedPropertyData(userId) {
    user_id = userId
    token = jwt.sign({
        user: {
            email,
            username,
            id: user_id
        }
    },
        JWT_SECRET, {
            algorithm: 'HS256',
            subject: username,
            expiresIn: '7d'
        }
    );
    const properties = [];
    for (let i = 1; i <= 3; i++) {
        properties.push(generatePropertyData(userId));
    }

    return Promise.all(properties)
        .catch(err => console.dir(err))
}

function generateImprovementData(propId) {
    const improvements = ['new floor', 'new roof', 'new plaster', 'kitchen remodel', 'bathroom remodel'];
    const date = faker.date.recent();
    const improvement = improvements[Math.floor(Math.random() * improvements.length)];
    return Improvement.create({
        Property_id: propId,
        name: improvement,
        cost: faker.random.number(),
        createdAt: date,
        updatedAt: date,
    })

}

function generateImprovements(num, propId) {
    const improvements = [];
    for (let i = 0; i < num; i++) {
        improvements.push(generateImprovementData(propId))
    }
    return Promise.all(improvements)
        .catch(err => console.dir(err))
}

function generatePropertyData(UserId) {
    const address = `${faker.address.streetAddress()} ${faker.address.streetName()}`;
    return Property.create({
        user_id: UserId,
        slug: faker.helpers.slugify(address).toLowerCase(),
        image_src: "",
        address: address,
        city: faker.address.city(),
        state: faker.address.state(),
        zip: faker.address.zipCode(),
        description: faker.lorem.words(),
        price: faker.random.number(),
        projectedValue: faker.random.number(),
        year_built: faker.random.number(),
        roof_type: faker.lorem.word(),
        foundation_type: faker.lorem.word(),
        exterior_material: faker.lorem.word(),
        basement: faker.lorem.word(),
        notes: faker.lorem.words(),
        floor_size: faker.random.number(),
        lot_size: faker.random.number(),
        bedrooms: faker.random.number(),
        bathrooms: faker.random.number(),
        stories: faker.random.number(),
        // createdAt: date,
        // updatedAt: date,
        // improvements: [{
        //     // property_id: Property.id,
        //     name: "new roof",
        //     cost: 1200
        // }]
    }, {
            include: [{
                model: Improvement,
                as: 'improvements'
            }]
        })
        // .then((property) => {
        //     return generateImprovements(3, property.id)
        // }
        // )
        .catch(err =>
            console.log(err)
        )
}

describe('Property endpoint tests', function () {

    describe('GET endpoint', function () {
        before(function () {
            return User.hashPassword(password)
                .then(password =>
                    User.create({
                        email,
                        username,
                        password
                    }).catch(err => console.log(err))
                )
                .then(async (user) => {
                    await seedPropertyData(user.id)
                })
                .catch(err => console.log(err))

        });

        after(function () {
            return User.destroy({ where: { username } })
                .catch(err => console.log(err))
        })


        it('should return all existing properties for user', function () {
            return chai.request(app)
                .get(`/api/properties/${user_id}`)
                .set('authorization', `Bearer ${token}`)
                .then(function (res) {

                    res.should.have.status(200);
                    res.body.properties.should.have.length.of.at.least(1);
                    return Property.findAndCountAll()
                        .then(function (obj) {
                            res.body.properties.should.have.lengthOf(obj.count);
                        });
                })

        });

        it('should return a single property by slug', function () {
            let property;
            return Property
                .findOne()
                .then(_property => {
                    property = _property;
                    return chai.request(app)
                        .get(`/api/properties/${user_id}/${property.dataValues.slug}`)
                        .set('authorization', `Bearer ${token}`)
                })
                .then(res => {
                    res.should.have.status(200);
                    res.body.propertyId.should.equal(property.dataValues.id);
                })
        });

        it('should return properties with right fields', function () {

            let resProperty;
            return chai.request(app)
                .get(`/api/properties/${user_id}`)
                .set('authorization', `Bearer ${token}`)
                .then(function (res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.properties.should.be.a('array');
                    res.body.properties.should.have.length.of.at.least(1);

                    res.body.properties.forEach(function (property) {
                        property.should.be.a('object');
                    });
                    resProperty = res.body.properties[0];

                    return Property.findByPk(resProperty.propertyId, { include: [{ model: Improvement, as: 'improvements' }] });
                })
                .then(function (property) {
                    resProperty.propertyId.should.equal(property.dataValues.id);
                })
        });
    });

    describe('POST endpoint', function () {
        beforeEach(function () {
            return User.hashPassword(password)
                .then(password =>
                    User.create({
                        email,
                        username,
                        password
                    }).catch(err => console.log(err))
                )
                .then(async (user) => {
                    await seedPropertyData(user.id)
                })
                .catch(err => console.log(err))

        });

        afterEach(function () {
            return User.destroy({ where: { username } })
                .catch(err => console.log(err))
        })


        it('should add a new property', function () {


            return generatePropertyData(user_id)
                .then(newPropertyData => {
                    const newPropData = newPropertyData.dataValues;
                    return chai.request(app).post('/api/properties/add')
                        .set('authorization', `Bearer ${token}`)
                        .send(newPropData)
                        .then(function (res) {
                            res.should.have.status(201);
                            res.should.be.json;
                            res.body.should.be.a('object');
                            res.body.slug.should.equal(newPropData.slug);
                            res.body.address.should.equal(newPropData.address);
                            res.body.price.should.equal(newPropData.price);
                            return Property.findByPk(res.body.propertyId);
                        })
                        .then(function (property) {
                            property.slug.should.equal(newPropData.slug);
                            property.address.should.equal(newPropData.address);
                            property.price.should.equal(newPropData.price);
                        });

                })


        });
    });

    describe('PUT endpoint', function () {
        before(function () {
            return User.hashPassword(password)
                .then(password =>
                    User.create({
                        email,
                        username,
                        password
                    }).catch(err => console.log(err))
                )
                .then(async (user) => {
                    await seedPropertyData(user.id)
                })
                .catch(err => console.log(err))

        });

        after(function () {
            return User.destroy({ where: { username } })
                .catch(err => console.log(err))
        })

        it('should update fields you send over', function () {
            const updateData = {
                price: 500000,
                state: 'Utah'
            };

            return Property
                .findOne()
                .then(function (property) {
                    updateData.id = property.dataValues.id;
                    return chai.request(app)
                        .put(`/api/properties/${property.slug}/${property.dataValues.id}`)
                        .set('authorization', `Bearer ${token}`)
                        .send(updateData);
                })
                .then(function (res) {
                    res.should.have.status(204);
                    return Property.findByPk(updateData.id);
                })
                .then(function (property) {
                    property.price.should.equal(updateData.price);
                    property.state.should.equal(updateData.state);
                });
        });
    });

    describe('DELETE endpoint', function () {
        before(function () {
            return User.hashPassword(password)
                .then(password =>
                    User.create({
                        email,
                        username,
                        password
                    }).catch(err => console.log(err))
                )
                .then(async (user) => {
                    await seedPropertyData(user.id)
                })
                .catch(err => console.log(err))

        });

        after(function () {
            return User.destroy({ where: { username } })
                .catch(err => console.log(err))
        })
        it('delete a property by slug', function () {
            let property;
            return Property
                .findOne()
                .then(function (_property) {
                    property = _property.dataValues;
                    return chai.request(app)
                        .delete(`/api/properties/${property.slug}`)
                        .set('authorization', `Bearer ${token}`);
                })
                .then(function (res) {
                    res.should.have.status(204);
                    return Property.findByPk(property.id);
                })
                .then(function (_property) {
                    should.not.exist(_property);
                });
        });
    });
});
