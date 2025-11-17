'use strict';
module.exports = (sequelize, DataTypes) => {
  const Recipe = sequelize.define(
    'Recipe',
    {
      recipe_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      title: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT },
      steps: { type: DataTypes.JSONB, allowNull: true },
      images: { type: DataTypes.JSONB, allowNull: true },
      video_url: { type: DataTypes.STRING(512) },
      cooking_time: { type: DataTypes.INTEGER, allowNull: true },
      status: { 
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'), 
        defaultValue: 'Pending' 
      },
      difficulty_level: {               // ✅ Thêm dòng này
        type: DataTypes.ENUM('Dễ', 'Trung bình', 'Khó'),
        defaultValue: 'Dễ'
      },
      created_at: { type: DataTypes.DATE, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: DataTypes.DATE, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') }
    },
    {
      tableName: 'recipe',
      timestamps: false,
      underscored: true
    }
  );
  return Recipe;
};
