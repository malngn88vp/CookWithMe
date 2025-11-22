// controllers/mealPlanController.js
const { MealPlan, MealPlanRecipe, Recipe } = require("../models");

/* ============================================================
   📅 TẠO KẾ HOẠCH BỮA ĂN
============================================================ */
exports.createMealPlan = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { title, start_date, end_date } = req.body;

    if (!title || !start_date || !end_date) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const mealPlan = await MealPlan.create({
      user_id: userId,
      title,
      start_date,
      end_date,
    });

    return res.status(201).json({
      message: "Tạo kế hoạch bữa ăn thành công",
      mealPlan,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/* ============================================================
   🍲 THÊM CÔNG THỨC VÀO KẾ HOẠCH
============================================================ */
exports.addRecipeToMealPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { recipe_id, meal_type, scheduled_date } = req.body;
    const userId = req.user.user_id;

    if (!recipe_id || !meal_type || !scheduled_date) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const mealPlan = await MealPlan.findOne({
      where: { mealplan_id: id, user_id: userId },
    });
    if (!mealPlan) {
      return res.status(404).json({ message: "Không tìm thấy kế hoạch của bạn" });
    }

    const recipe = await Recipe.findByPk(recipe_id);
    if (!recipe) {
      return res.status(404).json({ message: "Công thức không tồn tại" });
    }

    const dateOnly = new Date(scheduled_date).toISOString().split("T")[0];

    const exists = await MealPlanRecipe.findOne({
      where: { mealplan_id: id, recipe_id, scheduled_date: dateOnly, meal_type },
    });

    if (exists) {
      return res.status(400).json({ message: "Công thức đã có trong kế hoạch này" });
    }

    const newMeal = await MealPlanRecipe.create({
      mealplan_id: id,
      recipe_id,
      meal_type,
      scheduled_date: dateOnly,
    });

    return res.status(201).json({
      message: "Đã thêm công thức vào kế hoạch",
      data: newMeal,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/* ============================================================
   📜 LẤY TOÀN BỘ KẾ HOẠCH
============================================================ */
exports.getAllMealPlans = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const mealPlans = await MealPlan.findAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
    });

    res.status(200).json(mealPlans);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/* ============================================================
   📊 LẤY CHI TIẾT 1 KẾ HOẠCH
============================================================ */
exports.getMealPlanById = async (req, res) => {
  try {
    const { id } = req.params;

    const mealPlan = await MealPlan.findByPk(id, { raw: true });

    if (!mealPlan) {
      return res.status(404).json({ message: "Không tìm thấy kế hoạch" });
    }

    const items = await MealPlanRecipe.findAll({
      where: { mealplan_id: id },
      raw: true,
    });

    const recipes = [];

    for (const item of items) {
      const recipe = await Recipe.findByPk(item.recipe_id, { raw: true });
      if (recipe) {
        recipes.push({
          ...recipe,
          MealPlanRecipe: {
            meal_type: item.meal_type,
            scheduled_date: item.scheduled_date,
            recipe_id: item.recipe_id,
            mealplan_id: id,
          },
        });
      }
    }

    return res.status(200).json({
      ...mealPlan,
      recipes,
    });
  } catch (error) {
    console.error("getMealPlanById ERR:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/* ============================================================
   ❌ XOÁ 1 MÓN KHỎI KẾ HOẠCH
============================================================ */
exports.removeRecipeFull = async (req, res) => {
  try {
    const { id } = req.params;
    const { recipe_id, meal_type, scheduled_date } = req.body;

    if (!recipe_id || !meal_type || !scheduled_date) {
      return res.status(400).json({ message: "Thiếu thông tin xoá" });
    }

    const deleted = await MealPlanRecipe.destroy({
      where: {
        mealplan_id: id,
        recipe_id,
        meal_type,
        scheduled_date,
      },
    });

    if (!deleted) {
      return res.status(404).json({ message: "Món không tồn tại trong kế hoạch" });
    }

    res.status(200).json({ message: "Đã xoá món thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

/* ============================================================
   🗑 XOÁ TOÀN BỘ KẾ HOẠCH
============================================================ */
exports.deleteMealPlan = async (req, res) => {
  try {
    const { id } = req.params;

    await MealPlanRecipe.destroy({ where: { mealplan_id: id } });
    const deleted = await MealPlan.destroy({ where: { mealplan_id: id } });

    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy kế hoạch" });
    }

    res.status(200).json({ message: "Đã xóa kế hoạch bữa ăn" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
