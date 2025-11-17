const { ShoppingListItem, Ingredient, MealPlan } = require('../models');
const shoppingListService = require('../services/shoppingListService');

// 📌 Lấy danh sách mua sắm cho một meal plan
exports.getShoppingList = async (req, res) => {
  try {
    const { mealplan_id } = req.params;

    const list = await ShoppingListItem.findAll({
      where: { mealplan_id },
      include: [
        { model: Ingredient, attributes: ['ingredient_id', 'name'] },
        { model: MealPlan, attributes: ['title'] }
      ],
      order: [['is_checked', 'ASC']]
    });

    res.status(200).json(list);
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách mua sắm:", error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách mua sắm', error: error.message });
  }
};

// 📌 Thêm mục vào danh sách mua sắm
exports.addShoppingItem = async (req, res) => {
  try {
    const { mealplan_id, ingredient_id, quantity, unit } = req.body;

    if (!mealplan_id || !ingredient_id) {
      return res.status(400).json({ message: "Thiếu mealplan_id hoặc ingredient_id" });
    }

    const newItem = await ShoppingListItem.create({
      mealplan_id,
      ingredient_id,
      quantity,
      unit,
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error("❌ Lỗi khi thêm nguyên liệu:", error);
    res.status(500).json({ message: 'Lỗi khi thêm nguyên liệu vào danh sách mua sắm', error: error.message });
  }
};

// 📌 Cập nhật trạng thái đã mua hay chưa
exports.toggleChecked = async (req, res) => {
  try {
    const { item_id } = req.params;

    const item = await ShoppingListItem.findByPk(item_id);
    if (!item) return res.status(404).json({ message: 'Không tìm thấy mục mua sắm' });

    item.is_checked = !item.is_checked;
    await item.save();

    res.status(200).json({
      message: 'Đã cập nhật trạng thái mua sắm',
      item
    });
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật trạng thái:", error);
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái mua sắm', error: error.message });
  }
};

// 📌 Xóa một mục khỏi danh sách
exports.deleteShoppingItem = async (req, res) => {
  try {
    const { item_id } = req.params;

    const item = await ShoppingListItem.findByPk(item_id);
    if (!item) return res.status(404).json({ message: 'Không tìm thấy mục mua sắm' });

    await item.destroy();
    res.status(200).json({ message: '✅ Đã xóa mục mua sắm thành công' });
  } catch (error) {
    console.error("❌ Lỗi khi xóa mục mua sắm:", error);
    res.status(500).json({ message: 'Lỗi khi xóa mục mua sắm', error: error.message });
  }
};

// 📌 Tự động tạo danh sách mua sắm từ MealPlan
exports.generateShoppingListFromMealPlan = async (req, res) => {
  try {
    const { mealplan_id } = req.params;
    if (!mealplan_id) return res.status(400).json({ message: "Thiếu mealplan_id" });

    const shoppingList = await shoppingListService.generateShoppingList(mealplan_id);
    res.status(201).json({
      message: "✅ Danh sách mua sắm đã được tạo tự động từ MealPlan",
      data: shoppingList,
    });
  } catch (error) {
    console.error("❌ Lỗi khi tạo danh sách tự động:", error);
    res.status(500).json({
      message: "Lỗi khi tạo danh sách mua sắm từ MealPlan",
      error: error.message,
    });
  }
};
  
