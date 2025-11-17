'use strict';
module.exports = (sequelize, DataTypes) => {
  const RecipeIngredient = sequelize.define(
    'RecipeIngredient',
    {
      recipe_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: 'recipe', key: 'recipe_id' },
        onDelete: 'CASCADE',
      },
      ingredient_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: 'ingredient', key: 'ingredient_id' },
        onDelete: 'CASCADE',
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 3),
      },
      unit: {
        type: DataTypes.STRING(50),
      },
    },
    {
      tableName: 'recipe_ingredient',
      timestamps: false,
      underscored: true,
    }
  );
  return RecipeIngredient;
};
