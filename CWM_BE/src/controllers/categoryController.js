const { Category } = require('../models');

module.exports = {
  // Lấy tất cả category
  async getAll(req, res) {
  try {
    const categories = await Category.findAll({
      attributes: ["category_id", "name", "type"],
      order: [["category_id", "ASC"]],
    });
    res.status(200).json(categories); // ✅ trả trực tiếp mảng
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh mục:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
},


  // Tạo mới
  async create(req, res) {
    try {
      const { name, description } = req.body;
      const newCategory = await Category.create({ name, description });
      res.status(201).json({ message: 'Tạo category thành công', data: newCategory });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  // Cập nhật
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description, type } = req.body;
      const category = await Category.findByPk(id);
      if (!category) return res.status(404).json({ message: 'Không tìm thấy category' });

      await category.update({ name, description });
      res.status(200).json({ message: 'Cập nhật thành công', data: category });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  // Xóa
  async remove(req, res) {
    try {
      const { id } = req.params;
      const category = await Category.findByPk(id);
      if (!category) return res.status(404).json({ message: 'Không tìm thấy category' });

      await category.destroy();
      res.status(200).json({ message: 'Xóa category thành công' });
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  }
};
