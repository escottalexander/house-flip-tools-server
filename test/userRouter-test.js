require('dotenv').config();
const chai = require("chai");
const chaiHttp = require("chai-http");

const jwt = require('jsonwebtoken');

const {
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
    email: "jerry@mercury.com",
    username: "JohnDoe91",
    password: "password11"
};
const newUser2 = {
    email: "freddy@mercury.com",
    username: "JaneDoe91",
    password: "password12"
};
chai.use(chaiHttp);

describe("User endpoints", function () {
    after(function () {
        return User.destroy({ where: { username: newUser2.username } });
    });

    it("should return 201 HTTP status code on new user register", function () {
        return chai
            .request(app)
            .post("/api/users")
            .send(newUser2)
            .then(function (res) {
                expect(res).to.have.status(201);
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
                .get(`/api/users`)
                .set('authorization', `Bearer ${token}`)
                .then(function (res) {
                    console.log(res.body)
                    return chai.request(app).delete(`/api/users/${res.body[0].id}`);
                })
                .then(function (res) {
                    expect(res).to.have.status(204);
                })
        );
    });
});