'use strict';
module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    'Category',
    {
      category_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      type: { 
        type: DataTypes.ENUM('LoaiMon', 'CheDoAn', 'NguyenLieu', 'Khac'),
        defaultValue: 'Khac'
      }
    },
    {
      tableName: 'category',
      timestamps: false,
      underscored: true
    }
  );
  return Category;
};
