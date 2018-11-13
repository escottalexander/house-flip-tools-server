module.exports = function (sequelize, Sequelize) {

    var Property = sequelize.define('Property', {
        id: { autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        slug: { type: Sequelize.STRING },
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
        city: { type: Sequelize.STRING },
        floor_size: { type: Sequelize.INTEGER },
        lot_size: { type: Sequelize.DECIMAL },
        bedrooms: { type: Sequelize.INTEGER },
        bathrooms: { type: Sequelize.DECIMAL },
        stories: 2

    });

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

    Property.prototype.apiRepr = function () {
        return {
            propertyId: this.id,
            slug: this.slug,
            imgSrc: this.image_src,
            address: this.address,
            city: this.city,
            state: this.state,
            zip: this.zip,
            description: this.description,
            price: this.price,
            yearBuilt: this.year_built,
            roofType: this.roof_type,
            foundationType: this.foundation_type,
            exteriorMaterial: this.exterior_material,
            basement: this.basement,
            notes: this.notes,
            floorSize: this.floor_size,
            lotSize: this.lot_size,
            bedrooms: this.bedrooms,
            bathrooms: this.bathrooms,
            stories: this.stories,
            improvements: this.improvements
        }
    }

    return Property;

}