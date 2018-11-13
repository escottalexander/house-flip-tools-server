module.exports = function (sequelize, Sequelize) {

    var Improvement = sequelize.define('Improvement', {
        id: { autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        property_id: { type: Sequelize.INTEGER },
        name: { type: Sequelize.STRING },
        cost: { type: Sequelize.INTEGER }
    });

    Improvement.associate = function (models) {
        Improvement.belongsTo(
            models.Property,
            {
                foreignKey: { allowNull: false },
                onDelete: 'CASCADE'
            }
        )
    }

    Improvement.prototype.apiRepr = function () {
        return {
            id: this.id,
            propertyId: this.property_id,
            name: this.name,
            cost: this.cost
        }
    }

    return Improvement;

}