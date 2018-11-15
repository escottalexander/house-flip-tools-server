const Sequelize = require('sequelize');
const { sequelize } = require('../db/sequelize');



const Property = sequelize.define('Property', {
    id: { autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
    slug: { type: Sequelize.STRING, allowNull: false },
    image_src: { type: Sequelize.TEXT },
    address: { type: Sequelize.STRING, allowNull: false },
    city: { type: Sequelize.STRING },
    state: { type: Sequelize.STRING },
    zip: { type: Sequelize.STRING },
    description: { type: Sequelize.TEXT },
    price: { type: Sequelize.INTEGER },
    year_built: { type: Sequelize.STRING },
    roof_type: { type: Sequelize.STRING },
    foundation_type: { type: Sequelize.STRING },
    exterior_material: { type: Sequelize.STRING },
    basement: { type: Sequelize.STRING },
    notes: { type: Sequelize.TEXT },
    floor_size: { type: Sequelize.INTEGER },
    lot_size: { type: Sequelize.DECIMAL },
    bedrooms: { type: Sequelize.INTEGER },
    bathrooms: { type: Sequelize.DECIMAL },
    stories: { type: Sequelize.INTEGER }

}, { tableName: 'properties', underscored: true });

Property.associate = function (models) {
    Property.hasMany(
        models.Improvement,
        {
            as: 'improvements',
            foreignKey: { allowNull: false },
            onDelete: 'CASCADE'
        }
    ),
        Property.belongsTo(
            models.User,
            {
                foreignKey: { allowNull: false },
                onDelete: 'CASCADE'
            }
        )
}

Property.apiRepr = function (property) {
    return {
        userId: property.user_id,
        propertyId: property.id,
        slug: property.slug,
        imgSrc: property.image_src,
        address: property.address,
        city: property.city,
        state: property.state,
        zip: property.zip,
        description: property.description,
        price: property.price,
        yearBuilt: property.year_built,
        roofType: property.roof_type,
        foundationType: property.foundation_type,
        exteriorMaterial: property.exterior_material,
        basement: property.basement,
        notes: property.notes,
        floorSize: property.floor_size,
        lotSize: property.lot_size,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        stories: property.stories,
        improvements: property.improvements
    }
}

module.exports = {
    Property
}