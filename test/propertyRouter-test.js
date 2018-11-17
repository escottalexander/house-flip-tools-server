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

const token = jwt.sign({
    user: {
        email,
        username
    }
},
    JWT_SECRET, {
        algorithm: 'HS256',
        subject: username,
        expiresIn: '7d'
    }
);

function seedPropertyData(userId) {
    user_id = userId
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
    const date = faker.date.recent();
    return Property.create({
        user_id: UserId,
        slug: faker.helpers.slugify(address),
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


    beforeEach(function () {
        return User.hashPassword(password)
            .then(password =>
                User.create({
                    email,
                    username,
                    password
                })
            )
            .then((user) => {
                seedPropertyData(user.id)
            })
            .catch(err => console.log(err))

    });

    afterEach(function () {
        return User.destroy({ where: { username } })
            .catch(err => console.log(err))
    })


    describe('GET endpoint', function () {

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
                .then(property => {
                    return chai.request(app)
                        .get(`/api/properties/${user_id}/${property.slug}`)
                        .set('authorization', `Bearer ${token}`)
                })
                .then(res => {
                    res.should.have.status(200);
                    res.body.propertyId.should.equal(property.id);
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
                        property.should.include.keys(
                            'id', 'address', 'price', 'roof_type', 'slug', 'description');
                    });
                    resProperty = res.body.properties[0];
                    return Property.findById(resProperty.id, { include: [{ model: Improvement, as: 'improvements' }] });
                })
                .then(function (property) {
                    resProperty.id.should.equal(property.id);
                })
        });
    });

    describe('POST endpoint', function () {
        it('should add a new property', function () {

            const newPropertyData = generatePropertyData(user_id);
            return chai.request(app).post('/api/properties/add')
                .set('authorization', `Bearer ${token}`)
                .send(newPropertyData)
                .then(function (res) {
                    res.should.have.status(201);
                    res.should.be.json;
                    res.body.should.be.a('object');
                    res.body.should.include.keys(
                        'id', 'address', 'price', 'roof_type', 'slug', 'description');
                    res.body.slug.should.equal(newPropertyData.slug);
                    res.body.id.should.not.be.null;
                    res.body.address.should.equal(newPropertyData.address);
                    res.body.price.should.equal(newPropertyData.price);
                    should.not.exist(res.body.mostRecentGrade);
                    return Property.findById(res.body.id);
                })
                .then(function (property) {
                    property.slug.should.equal(newPropertyData.slug);
                    property.address.should.equal(newPropertyData.address);
                    property.price.should.equal(newPropertyData.price);
                });
        });
    });

    describe('PUT endpoint', function () {

        it('should update fields you send over', function () {
            const updateData = {
                price: 500000,
                state: 'Utah'
            };

            return Property
                .findOne()
                .then(function (property) {
                    updateData.id = property.id;
                    return chai.request(app)
                        .put(`/api/properties/${property.slug}/${property.id}`)
                        .set('authorization', `Bearer ${token}`)
                        .send(updateData);
                })
                .then(function (res) {
                    res.should.have.status(204);
                    return Property.findById(updateData.id);
                })
                .then(function (property) {
                    property.price.should.equal(updateData.price);
                    property.state.should.equal(updateData.state);
                });
        });
    });

    describe('DELETE endpoint', function () {
        it('delete a property by slug', function () {
            let property;
            return Restaurant
                .findOne()
                .then(function (_property) {
                    property = _property;
                    return chai.request(app).delete(`/api/properties/${property.slug}`);
                })
                .then(function (res) {
                    res.should.have.status(204);
                    return Property.findById(property.id);
                })
                .then(function (_property) {
                    should.not.exist(_property);
                });
        });
    });
});
