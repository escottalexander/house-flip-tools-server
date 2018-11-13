module.exports = function (sequelize, Sequelize) {

    var User = sequelize.define('user', {
        id: { autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        username: { type: Sequelize.TEXT },
        email: { type: Sequelize.STRING, validate: { isEmail: true } },
        password: { type: Sequelize.STRING, allowNull: false },
        last_login: { type: Sequelize.DATE },
        // properties: {
        //     type: sequelize.INTEGER,
        //     refrences: {
        //         model: Property,
        //         key: 'id',
        //         deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
        //     }
        // },
        status: { type: Sequelize.ENUM('active', 'inactive'), defaultValue: 'active' }

    });

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

    User.prototype.apiRepr = function () {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            lastLogin: this.last_login,
            status: this.status,
            properties: this.properties
        }
    }

    return User;

}