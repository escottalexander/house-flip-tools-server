const { User } = require('./user');
const { Property } = require('./property');
const { Improvement } = require('./improvement');

const db = {
    User,
    Property,
    Improvement
};

Object.keys(db).forEach(function (modelName) {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

module.exports = db;