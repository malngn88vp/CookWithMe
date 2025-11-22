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

      // 🆕 Thêm các cột dinh dưỡng
      calories: { type: DataTypes.FLOAT, defaultValue: 0 }, 
      protein: { type: DataTypes.FLOAT, defaultValue: 0 },
      carbs: { type: DataTypes.FLOAT, defaultValue: 0 },
      fat: { type: DataTypes.FLOAT, defaultValue: 0 },
    },
    {
      tableName: 'ingredient',
      timestamps: false,
      underscored: true,
    }
  );
  return Ingredient;
};
