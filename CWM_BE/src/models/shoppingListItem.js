'use strict';
module.exports = (sequelize, DataTypes) => {
  const ShoppingListItem = sequelize.define(
    'ShoppingListItem',
    {
      item_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      mealplan_id: { type: DataTypes.INTEGER, allowNull: false },
      ingredient_id: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.DECIMAL(12, 3) },
      unit: { type: DataTypes.STRING(50) },
      is_checked: { type: DataTypes.BOOLEAN, defaultValue: false }
    },
    {
      tableName: 'shopping_list_item',
      timestamps: false,
      underscored: true
    }
  );
  return ShoppingListItem;
};
