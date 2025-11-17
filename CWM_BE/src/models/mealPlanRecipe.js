'use strict';
module.exports = (sequelize, DataTypes) => {
  const MealPlanRecipe = sequelize.define(
    'MealPlanRecipe',
    {
      mealplan_id: { type: DataTypes.INTEGER, primaryKey: true },
      recipe_id: { type: DataTypes.INTEGER, primaryKey: true },
      meal_type: { 
        type: DataTypes.ENUM('Breakfast', 'Lunch', 'Dinner'), 
        allowNull: false 
      },
      scheduled_date: { type: DataTypes.DATEONLY, primaryKey: true }
    },
    {
      tableName: 'meal_plan_recipe',
      timestamps: false,
      underscored: true
    }
  );
  return MealPlanRecipe;
};
