const Sequelize = require('sequelize');
const { sequelize } = require('../db/sequelize');
const bcrypt = require('bcryptjs');


const User = sequelize.define('User', {
    id: { autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
    username: { type: Sequelize.TEXT },
    email: { type: Sequelize.STRING, validate: { isEmail: true } },
    password: { type: Sequelize.STRING, allowNull: false }

}, { tableName: 'users', underscored: true });

User.associate = function (models) {
    User.hasMany(
        models.Property,
        {
            as: 'properties',
            foreignKey: { allowNull: false },
            onDelete: 'CASCADE'
        }
    )
}

User.serialize = function (user) {
    return {
        username: user.username || '',
        email: user.email || '',
    };
};

User.validatePassword = function (password, user) {
    return bcrypt.compare(password, user.password);
};

User.hashPassword = function (password) {
    return bcrypt.hash(password, 10);
};

User.apiRepr = function (user) {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        properties: user.properties
    }
}


module.exports = {
    User
}
