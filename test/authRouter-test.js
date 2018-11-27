require('dotenv').config();
const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');

const {
    app
} = require('../server');
const {
    User
} = require('../models');
const {
    JWT_SECRET
} = require('../config');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Auth endpoints', function () {
    const email = 'freddy@mercury.com';
    const username = 'exampleUser';
    const password = 'examplePass';

    beforeEach(function () {
        return User.hashPassword(password).then(password =>
            User.create({
                email,
                username,
                password
            })
        );
    });

    afterEach(function () {
        return User.destroy({ where: { username } });
    });

    describe('/api/auth/login', function () {
        it('Should return a valid auth token', function () {
            return chai
                .request(app)
                .post('/api/auth/login')
                .send({
                    username,
                    password
                })
                .then(res => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('object');
                    const token = res.body.authToken;
                    expect(token).to.be.a('string');
                    const payload = jwt.verify(token, JWT_SECRET, {
                        algorithm: ['HS256']
                    });
                    expect(payload.user.username).to.equal(username);
                });
        });
    });


});
