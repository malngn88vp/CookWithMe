const { Ingredient } = require('../models');

module.exports = {
  async getAll(req, res) {
    try {
      const ingredients = await Ingredient.findAll();
      res.status(200).json({ message: 'Danh sách nguyên liệu', data: ingredients });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  async create(req, res) {
    try {
      const { name, default_unit } = req.body;
      const newIngredient = await Ingredient.create({ name, default_unit });
      res.status(201).json({ message: 'Tạo nguyên liệu thành công', data: newIngredient });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, default_unit } = req.body;
      const ingredient = await Ingredient.findByPk(id);
      if (!ingredient) return res.status(404).json({ message: 'Không tìm thấy nguyên liệu' });

      await ingredient.update({ name, default_unit });
      res.status(200).json({ message: 'Cập nhật thành công', data: ingredient });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;
      const ingredient = await Ingredient.findByPk(id);
      if (!ingredient) return res.status(404).json({ message: 'Không tìm thấy nguyên liệu' });

      await ingredient.destroy();
      res.status(200).json({ message: 'Xóa nguyên liệu thành công' });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  }
};
