const { MealPlanRecipe, RecipeIngredient, ShoppingListItem, Ingredient, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.generateShoppingList = async (mealplan_id) => {
  return await sequelize.transaction(async (t) => {
    // 🗑️ Xóa danh sách mua sắm cũ (nếu có)
    await ShoppingListItem.destroy({
      where: { mealplan_id },
      transaction: t
    });

    // 📌 1. Lấy danh sách công thức thuộc meal plan
    const mealPlanRecipes = await MealPlanRecipe.findAll({
      where: { mealplan_id },
      attributes: ['recipe_id'],
      raw: true
    });

    if (mealPlanRecipes.length === 0) {
      throw new Error('Không có công thức nào trong meal plan');
    }

    const recipeIds = mealPlanRecipes.map(r => r.recipe_id);

    // 📌 2. Lấy toàn bộ nguyên liệu từ các công thức
    const ingredients = await RecipeIngredient.findAll({
      where: { recipe_id: { [Op.in]: recipeIds } },
      attributes: ['ingredient_id', 'quantity', 'unit'],
      raw: true
    });

    // 📌 3. Gộp nguyên liệu trùng nhau
    const mergedIngredients = {};
    for (const ing of ingredients) {
      const key = `${ing.ingredient_id}-${ing.unit}`;
      if (!mergedIngredients[key]) {
        mergedIngredients[key] = {
          ingredient_id: ing.ingredient_id,
          unit: ing.unit,
          quantity: parseFloat(ing.quantity)
        };
      } else {
        mergedIngredients[key].quantity += parseFloat(ing.quantity);
      }
    }

    const shoppingItems = Object.values(mergedIngredients).map(item => ({
      mealplan_id,
      ingredient_id: item.ingredient_id,
      quantity: item.quantity,
      unit: item.unit,
      is_checked: false
    }));

    // 📌 4. Ghi vào bảng shopping_list_item
    await ShoppingListItem.bulkCreate(shoppingItems, { transaction: t });

    // 📌 5. Lấy danh sách sau khi tạo (kèm tên nguyên liệu)
    const result = await ShoppingListItem.findAll({
      where: { mealplan_id },
      include: [{ model: Ingredient, attributes: ['name'] }],
      order: [['is_checked', 'ASC']],
      transaction: t
    });

    return result;
  });
};
