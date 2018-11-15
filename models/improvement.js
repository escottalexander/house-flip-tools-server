const Sequelize = require('sequelize');
const { sequelize } = require('../db/sequelize');



const Improvement = sequelize.define('Improvement', {
    id: { autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
    property_id: { type: Sequelize.INTEGER, allowNull: false },
    name: { type: Sequelize.TEXT, allowNull: false },
    cost: { type: Sequelize.INTEGER, allowNull: false }
}, { tableName: 'improvements', underscored: true });

Improvement.associate = function (models) {
    Improvement.belongsTo(
        models.Property,
        {
            foreignKey: { allowNull: false },
            onDelete: 'CASCADE'
        }
    )
}

Improvement.apiRepr = function (improvement) {
    return {
        id: improvement.id,
        propertyId: improvement.property_id,
        name: improvement.name,
        cost: improvement.cost
    }
}

module.exports = {
    Improvement
}