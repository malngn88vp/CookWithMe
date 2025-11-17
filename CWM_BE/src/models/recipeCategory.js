'use strict';
module.exports = (sequelize, DataTypes) => {
  const RecipeCategory = sequelize.define(
    'RecipeCategory',
    {
      recipe_id: { type: DataTypes.INTEGER, primaryKey: true },
      category_id: { type: DataTypes.INTEGER, primaryKey: true }
    },
    {
      tableName: 'recipe_category',
      timestamps: false,
      underscored: true
    }
  );
  return RecipeCategory;
};
