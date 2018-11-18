const { User } = require('./user');
const { Property } = require('./property');
const { Improvement } = require('./improvement');
// All models you want to expose to other modules should go here
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
// the outside world should only get access to our models
// via this single `db` object.
module.exports = db;