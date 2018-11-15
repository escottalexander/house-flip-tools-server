require('dotenv').config();
const chai = require("chai");
const chaiHttp = require("chai-http");

const jwt = require('jsonwebtoken');

const {
    TEST_DATABASE_URL,
    PORT,
    JWT_SECRET
} = require('../config');

const {
    User,
    Property
} = require("../models");

const {
    app,
    runServer,
    closeServer
} = require("../server");

const expect = chai.expect;

const newUser = {
    name: "John Doe",
    username: "JohnDoe91",
    password: "password11"
};
const newUser2 = {
    name: "Jane Doe",
    username: "JaneDoe91",
    password: "password12"
};
// This let's us make HTTP requests
// in our tests.
// see: https://github.com/chaijs/chai-http
chai.use(chaiHttp);

describe("User endpoints", function () {
    // Before our tests run, we activate the server. Our `runServer`
    // function returns a promise, and we return the that promise by
    // doing `return runServer`. If we didn't return a promise here,
    // there's a possibility of a race condition where our tests start
    // running before our server has started.
    before(function () {
        return runServer(TEST_DATABASE_URL);
    });

    // although we only have one test module at the moment, we'll
    // close our server at the end of these tests. Otherwise,
    // if we add another test module that also has a `before` block
    // that starts our server, it will cause an error because the
    // server would still be running from the previous tests.
    after(function () {
        return closeServer();
    });

    beforeEach(function () {
        return User.hashPassword(newUser.password).then(password =>
            User.create({
                name: newUser.name,
                username: newUser.username,
                password: password
            })
        );
    });

    afterEach(function () {
        return User.remove({});
    })
    // test strategy:
    //   1. make request to `/shopping-list`
    //   2. inspect response object and prove has right code and have
    //   right keys in response object.
    it("should return 200 HTTP status code on GET", function () {
        // for Mocha tests, when we're dealing with asynchronous operations,
        // we must either return a Promise object or else call a `done` callback
        // at the end of the test. The `chai.request(server).get...` call is asynchronous
        // and returns a Promise, so we just return it.
        const token = jwt.sign({
            user: {
                name: newUser.name,
                username: newUser.username
            }
        },
            JWT_SECRET, {
                algorithm: 'HS256',
                subject: newUser.username,
                expiresIn: '7d'
            }
        );

        return chai
            .request(app)
            .get("/user")
            .set('authorization', `Bearer ${token}`)
            .then(function (res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
            });
    });

    it("should return 201 HTTP status code on new user register", function () {
        // for Mocha tests, when we're dealing with asynchronous operations,
        // we must either return a Promise object or else call a `done` callback
        // at the end of the test. The `chai.request(server).get...` call is asynchronous
        // and returns a Promise, so we just return it.

        return chai
            .request(app)
            .post("/user/register")
            .send(newUser2)
            .then(function (res) {
                expect(res).to.have.status(201);
            });
    });

    it("should return 204 HTTP status code on PUT and user object should be updated", function () {
        // for Mocha tests, when we're dealing with asynchronous operations,
        // we must either return a Promise object or else call a `done` callback
        // at the end of the test. The `chai.request(server).get...` call is asynchronous
        // and returns a Promise, so we just return it.
        const token = jwt.sign({
            user: {
                name: newUser2.name,
                username: newUser2.username
            }
        },
            JWT_SECRET, {
                algorithm: 'HS256',
                subject: newUser2.username,
                expiresIn: '7d'
            }
        );

        newUser2.name = "Joseph Smith";
        delete newUser2.password;
        return chai
            .request(app)
            .get("/user")
            .set('authorization', `Bearer ${token}`)
            .then(function (res) {
                newUser2.id = res.body.users[0].id;
                return chai.request(app)
                    .put(`/user/${res.body.users[0].id}`)
                    .send(newUser2)
                    .then(function (res) {
                        expect(res).to.have.status(204);
                        return chai
                            .request(app)
                            .get("/user")
                            .then(function (res) {
                                expect(res.body.users[0].name).to.equal("Joseph Smith");
                            });
                    });
            });
    });

    it("should delete users on DELETE", function () {
        const token = jwt.sign({
            user: {
                name: newUser.name,
                username: newUser.username
            }
        },
            JWT_SECRET, {
                algorithm: 'HS256',
                subject: newUser.username,
                expiresIn: '7d'
            }
        );
        return (
            chai
                .request(app)
                // first have to get so we have an `id` of item
                // to delete
                .get("/user")
                .set('authorization', `Bearer ${token}`)
                .then(function (res) {
                    return chai.request(app).delete(`/user/${res.body.users[0].id}`);
                })
                .then(function (res) {
                    expect(res).to.have.status(204);
                })
        );
    });
});