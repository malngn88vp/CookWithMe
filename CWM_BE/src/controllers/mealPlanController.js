const { MealPlan, MealPlanRecipe, Recipe } = require("../models");

module.exports = {
  // 📅 Tạo kế hoạch bữa ăn
  createMealPlan: async (req, res) => {
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

      console.log("✅ MealPlan tạo thành công:", mealPlan.mealplan_id);

      res.status(201).json({
        message: "Tạo kế hoạch bữa ăn thành công",
        mealPlan,
      });
    } catch (error) {
      console.error("❌ Lỗi createMealPlan:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },

  // 🍲 Thêm công thức vào kế hoạch
    addRecipeToMealPlan: async (req, res) => {
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

      // 🔹 Chuẩn hóa ngày
      const dateObj = new Date(scheduled_date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      const dateOnly = `${year}-${month}-${day}`;

      // 🔹 Check món đã tồn tại với date chuẩn
      const mealExists = await MealPlanRecipe.findOne({
        where: { mealplan_id: id, recipe_id, scheduled_date: dateOnly, meal_type },
      });
      if (mealExists) {
        return res.status(400).json({ message: "Công thức đã có trong kế hoạch này" });
      }

      // 🔹 Tạo món mới
      const newMeal = await MealPlanRecipe.create({
        mealplan_id: id,
        recipe_id,
        meal_type,
        scheduled_date: dateOnly,
      });

      console.log("✅ Đã thêm món vào kế hoạch:", newMeal.toJSON());

      return res.status(201).json({
        message: "Đã thêm công thức vào kế hoạch",
        data: newMeal,
      });
    } catch (error) {
      console.error("❌ Lỗi addRecipeToMealPlan:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },

  // 📜 Lấy tất cả kế hoạch của user (✅ ĐÃ SỬA — include Recipe)
  getAllMealPlans: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const mealPlans = await MealPlan.findAll({
        where: { user_id: userId },
        order: [["created_at", "DESC"]],
        include: [
          {
            model: Recipe,
            as: "recipes",
            through: { attributes: ["meal_type", "scheduled_date"] },
          },
        ],
      });

      res.status(200).json(mealPlans);
    } catch (error) {
      console.error("❌ Lỗi getAllMealPlans:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },

  // 📊 Lấy chi tiết kế hoạch (kèm công thức)
  getMealPlanById: async (req, res) => {
    try {
      const { id } = req.params;
      const mealPlan = await MealPlan.findByPk(id, {
        include: [
          {
            model: Recipe,
            as: "recipes",
            through: { attributes: ["meal_type", "scheduled_date"] },
          },
        ],
      });

      if (!mealPlan) {
        return res.status(404).json({ message: "Không tìm thấy kế hoạch" });
      }

      res.status(200).json(mealPlan);
    } catch (error) {
      console.error("❌ Lỗi getMealPlanById:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },

  // ❌ Xóa công thức khỏi kế hoạch
  removeRecipeFromMealPlan: async (req, res) => {
    try {
      const { id, recipeId } = req.params;
      const deleted = await MealPlanRecipe.destroy({
        where: { mealplan_id: id, recipe_id: recipeId },
      });

      if (!deleted) {
        return res.status(404).json({ message: "Công thức không tồn tại trong kế hoạch" });
      }

      res.status(200).json({ message: "Đã xóa công thức khỏi kế hoạch" });
    } catch (error) {
      console.error("❌ Lỗi removeRecipeFromMealPlan:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },

  // 🗑️ Xóa kế hoạch
  deleteMealPlan: async (req, res) => {
    try {
      const { id } = req.params;

      await MealPlanRecipe.destroy({ where: { mealplan_id: id } });
      const deleted = await MealPlan.destroy({ where: { mealplan_id: id } });

      if (!deleted) {
        return res.status(404).json({ message: "Không tìm thấy kế hoạch" });
      }

      res.status(200).json({ message: "Đã xóa kế hoạch bữa ăn" });
    } catch (error) {
      console.error("❌ Lỗi deleteMealPlan:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },
};
