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
    for (let i = 0; i <= 10; i++) {
        properties.push(generatePropertyData(userId));
    }
    // for (let h = 0; h < properties.length; h++) {
    //     properties[h].user_id = userId;
    //     console.log(properties[h])
    // }

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
        imgSrc: "",
        address: address,
        city: faker.address.city(),
        state: faker.address.state(),
        zip: faker.address.zipCode(),
        description: faker.lorem.words(),
        price: faker.random.number(),
        projectedValue: faker.random.number(),
        yearBuilt: faker.random.number(),
        roofType: faker.lorem.word(),
        foundationType: faker.lorem.word(),
        exteriorMaterial: faker.lorem.word(),
        basement: faker.lorem.word(),
        notes: faker.lorem.words(),
        floorSize: faker.random.number(),
        lotSize: faker.random.number(),
        bedrooms: faker.random.number(),
        bathrooms: faker.random.number(),
        stories: faker.random.number(),
        createdAt: date,
        updatedAt: date,
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
        return User.hashPassword(password).then(password =>
            User.create({
                email,
                username,
                password
            })
        )
            .then((user) => {
                seedPropertyData(user.id)
            })
            .catch(err => console.dir(err))

    });

    afterEach(function () {
        return User.destroy({ where: { username } });
    });
    // to make tests quicker, only drop all rows from each
    // table in between tests, instead of recreating tables
    // beforeEach(function () {
    //     return Property
    //         // .truncate drops all rows in this table
    //         .destroy({ cascade: true })
    //     // then seed db with new test data

    // });


    describe('GET endpoint', function () {

        it('should return all existing properties for user', function () {
            // strategy:
            //    1. get back all restaurants returned by by GET request to `/restaurants`
            //    2. prove res has right status, data type
            //    3. prove the number of restaurants we got back is equal to number
            //       in db.
            //
            // need to have access to mutate and access `res` across
            // `.then()` calls below, so declare it here so can modify in place
            let res;

            return chai.request(app)
                .get(`/dashboard/${user_id}`)
                .set('authorization', `Bearer ${token}`)
                .then(function (_res) {
                    // so subsequent .then blocks can access resp obj.
                    res = _res;
                    res.should.have.status(200);
                    // otherwise our db seeding didn't work
                    res.body.properties.should.have.length.of.at.least(1);
                    return Property.findAndCountAll()
                        .then(function (obj) {
                            res.body.properties.should.have.lengthOf(obj.count);
                        });
                })

        });

        it('should return a single restaurant by id', function () {
            // strategy:
            //    1. Get a restaurant from db
            //    2. Prove you can retrieve it by id at `/restaurants/:id`
            let restaurant;
            return Restaurant
                .findOne()
                .then(_restaurant => {
                    restaurant = _restaurant
                    return chai.request(app)
                        .get(`/restaurants/${restaurant.id}`);
                })
                .then(res => {
                    res.should.have.status(200);
                    res.body.id.should.equal(restaurant.id);
                })
        });

        it('should return restaurants with right fields', function () {
            // Strategy: Get back all restaurants, and ensure they have expected keys

            let resRestaurant;
            return chai.request(app)
                .get('/restaurants')
                .then(function (res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.restaurants.should.be.a('array');
                    res.body.restaurants.should.have.length.of.at.least(1);

                    res.body.restaurants.forEach(function (restaurant) {
                        restaurant.should.be.a('object');
                        restaurant.should.include.keys(
                            'id', 'name', 'cuisine', 'borough', 'mostRecentGrade', 'address');
                    });
                    resRestaurant = res.body.restaurants[0];
                    return Restaurant.findById(resRestaurant.id, { include: [{ model: Grade, as: 'grades' }] });
                })
                .then(function (restaurant) {

                    resRestaurant.id.should.equal(restaurant.id);
                    resRestaurant.name.should.equal(restaurant.name);
                    resRestaurant.cuisine.should.equal(restaurant.cuisine);
                    resRestaurant.borough.should.equal(restaurant.borough);
                    resRestaurant.address.should.have.property('number', restaurant.addressBuildingNumber);
                    resRestaurant.address.should.have.property('street', restaurant.addressStreet);
                    resRestaurant.address.should.have.property('zip', restaurant.addressZipcode);
                    resRestaurant.mostRecentGrade.should.have.property('id', restaurant.mostRecentGrade.id);
                    resRestaurant.mostRecentGrade.should.have.property('grade', restaurant.mostRecentGrade.grade);
                    resRestaurant.mostRecentGrade.should.have.property('inspectionDate');
                    resRestaurant.mostRecentGrade.should.have.property('score', restaurant.mostRecentGrade.score);
                });
        });
    });

    describe('POST endpoint', function () {
        // strategy: make a POST request with data,
        // then prove that the restaurant we get back has
        // right keys, and that `id` is there (which means
        // the data was inserted into db)
        it('should add a new restaurant', function () {

            const newRestaurantData = {
                name: faker.company.companyName(),
                cuisine: generateCuisineType(),
                borough: generateBoroughName(),
                addressBuildingNumber: faker.address.streetAddress(),
                addressStreet: faker.address.streetName(),
                addressZipcode: faker.address.zipCode()
            };
            return chai.request(app).post('/restaurants').send(newRestaurantData)
                .then(function (res) {
                    res.should.have.status(201);
                    res.should.be.json;
                    res.body.should.be.a('object');
                    res.body.should.include.keys(
                        'id', 'name', 'cuisine', 'borough', 'mostRecentGrade', 'address');
                    res.body.name.should.equal(newRestaurantData.name);
                    // cause db should have created id on insertion
                    res.body.id.should.not.be.null;
                    res.body.cuisine.should.equal(newRestaurantData.cuisine);
                    res.body.borough.should.equal(newRestaurantData.borough);

                    should.not.exist(res.body.mostRecentGrade);

                    return Restaurant.findById(res.body.id);
                })
                .then(function (restaurant) {
                    restaurant.name.should.equal(newRestaurantData.name);
                    restaurant.cuisine.should.equal(newRestaurantData.cuisine);
                    restaurant.borough.should.equal(newRestaurantData.borough);
                    restaurant.addressBuildingNumber.should.equal(newRestaurantData.addressBuildingNumber);
                    restaurant.addressStreet.should.equal(newRestaurantData.addressStreet);
                    restaurant.addressZipcode.should.equal(newRestaurantData.addressZipcode);
                });
        });
    });

    describe('PUT endpoint', function () {

        // strategy:
        //  1. Get an existing restaurant from db
        //  2. Make a PUT request to update that restaurant
        //  3. Prove restaurant returned by request contains data we sent
        //  4. Prove restaurant in db is correctly updated
        it('should update fields you send over', function () {
            const updateData = {
                name: 'fofofofofofofof',
                cuisine: 'futuristic fusion'
            };

            return Restaurant
                .findOne()
                .then(function (restaurant) {
                    updateData.id = restaurant.id;
                    console.log()
                    // make request then inspect it to make sure it reflects
                    // data we sent
                    return chai.request(app)
                        .put(`/restaurants/${restaurant.id}`)
                        .send(updateData);
                })
                .then(function (res) {
                    res.should.have.status(204);
                    return Restaurant.findById(updateData.id);
                })
                .then(function (restaurant) {
                    restaurant.name.should.equal(updateData.name);
                    restaurant.cuisine.should.equal(updateData.cuisine);
                });
        });
    });

    describe('DELETE endpoint', function () {
        // strategy:
        //  1. get a restaurant
        //  2. make a DELETE request for that restaurant's id
        //  3. assert that response has right status code
        //  4. prove that restaurant with the id doesn't exist in db anymore
        it('delete a restaurant by id', function () {


            // TODO add assertions about associated grades being deleted
            let restaurant;

            return Restaurant
                .findOne()
                .then(function (_restaurant) {
                    restaurant = _restaurant;
                    return chai.request(app).delete(`/restaurants/${restaurant.id}`);
                })
                .then(function (res) {
                    res.should.have.status(204);
                    return Restaurant.findById(restaurant.id);
                })
                .then(function (_restaurant) {
                    // when a variable's value is null, chaining `should`
                    // doesn't work. so `_restaurant.should.be.null` would raise
                    // an error. `should.be.null(_restaurant)` is how we can
                    // make assertions about a null value.
                    should.not.exist(_restaurant);
                });
        });
    });

    describe('GET grades for a restaurant endpoint', function () {

        it('should return all grades for a restaurant', function () {
            // strategy:
            //    1. get id of a restaurant
            //    2. get back its grades from api
            //    3. prove count and ids correct
            let restaurant;

            return Restaurant
                .findOne({ include: [{ model: Grade, as: 'grades' }] })
                .then(_restaurant => {
                    restaurant = _restaurant;
                    return chai.request(app)
                        .get(`/restaurants/${restaurant.id}/grades`);
                })
                .then(function (res) {
                    // res.should.have.status(200);
                    res.body.grades.length.should.equal(restaurant.grades.length);
                    restaurant.grades.map(grade => grade.id).should.deep.equal(res.body.grades.map(grade => grade.id))
                });
        });
    });
});
