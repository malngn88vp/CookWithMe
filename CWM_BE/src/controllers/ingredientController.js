const { Ingredient } = require('../models');

module.exports = {

  // Lấy danh sách
  async getAll(req, res) {
    try {
      const ingredients = await Ingredient.findAll();
      res.status(200).json({ message: 'Danh sách nguyên liệu', data: ingredients });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  // Tạo nguyên liệu
  async create(req, res) {
    try {
      const {
        name,
        default_unit,
        calories = 0,
        protein = 0,
        carbs = 0,
        fat = 0
      } = req.body;

      const newIngredient = await Ingredient.create({
        name,
        default_unit,
        calories,
        protein,
        carbs,
        fat
      });

      res.status(201).json({ message: 'Tạo nguyên liệu thành công', data: newIngredient });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  // Cập nhật nguyên liệu
  async update(req, res) {
    try {
      const { id } = req.params;

      const {
        name,
        default_unit,
        calories = 0,
        protein = 0,
        carbs = 0,
        fat = 0
      } = req.body;

      const ingredient = await Ingredient.findByPk(id);
      if (!ingredient) {
        return res.status(404).json({ message: 'Không tìm thấy nguyên liệu' });
      }

      await ingredient.update({
        name,
        default_unit,
        calories,
        protein,
        carbs,
        fat
      });

      res.status(200).json({ message: 'Cập nhật thành công', data: ingredient });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  // Xóa nguyên liệu
  async remove(req, res) {
    try {
      const { id } = req.params;
      const ingredient = await Ingredient.findByPk(id);

      if (!ingredient)
        return res.status(404).json({ message: 'Không tìm thấy nguyên liệu' });

      await ingredient.destroy();

      res.status(200).json({ message: 'Xóa nguyên liệu thành công' });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  }
};
