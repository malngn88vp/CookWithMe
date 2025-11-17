'use strict';
module.exports = (sequelize, DataTypes) => {
  const Ingredient = sequelize.define(
    'Ingredient',
    {
      ingredient_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      default_unit: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'ingredient',
      timestamps: false,
      underscored: true,
    }
  );
  return Ingredient;
};
