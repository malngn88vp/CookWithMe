'use strict';
module.exports = (sequelize, DataTypes) => {
  const Rating = sequelize.define(
    'Rating',
    {
      rating_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      recipe_id: { type: DataTypes.INTEGER, allowNull: false },
      stars: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
      created_at: { type: DataTypes.DATE, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') }
    },
    {
      tableName: 'rating',
      timestamps: false,
      underscored: true
    }
  );
  return Rating;
};
