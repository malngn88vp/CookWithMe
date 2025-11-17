'use strict';
module.exports = (sequelize, DataTypes) => {
  const Favorite = sequelize.define(
    'Favorite',
    {
      user_id: { type: DataTypes.INTEGER, primaryKey: true },
      recipe_id: { type: DataTypes.INTEGER, primaryKey: true },
      created_at: { type: DataTypes.DATE, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') }
    },
    {
      tableName: 'favorite',
      timestamps: false,
      underscored: true
    }
  );
  return Favorite;
};
