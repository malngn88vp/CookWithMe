'use strict';
module.exports = (sequelize, DataTypes) => {
  const MealPlan = sequelize.define(
    'MealPlan',
    {
      mealplan_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      title: { type: DataTypes.STRING(255) },
      start_date: { type: DataTypes.DATEONLY },
      end_date: { type: DataTypes.DATEONLY },
      created_at: { type: DataTypes.DATE, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: DataTypes.DATE, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') }
    },
    {
      tableName: 'meal_plan',
      timestamps: false,
      underscored: true
    }
  );
  return MealPlan;
};
