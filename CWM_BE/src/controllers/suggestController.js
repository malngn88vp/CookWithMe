const { MealPlan, MealPlanRecipe, Recipe } = require("../models");

// Helper safe number
const toNum = (v) => {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

// =======================
// GIỚI HẠN TÙY CHỈNH
// =======================
// Chỉ sửa giá trị ở đây là thay đổi toàn bộ logic chế độ ăn
const DIET_LIMITS = {
  keto: {
    maxCarbsPerServing: 30000,        // carbs / servings < 30,000
    maxCaloriesPerServing: 250000,    // tùy chọn
  },
  eatclean: {
    maxFatPerServing: 20000,          // fat / servings < 20,000
    maxCaloriesPerServing: 250000,    // tùy chọn
  },
  healthy: {
    maxCaloriesPerServing: 250000,    // calories < 250,000
    maxFatPerServing: 20000,          // tùy chọn
  }
};

module.exports.suggestMealPlan = async (req, res) => {
  try {
    const { start_date, end_date, type } = req.body;
    const userId = req.user.user_id;

    if (!start_date || !end_date || !type) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    const validTypes = ["eat-clean", "keto", "healthy"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Loại thực đơn không hợp lệ" });
    }

    // ===== CREATE MEAL PLAN =====
    const mealPlan = await MealPlan.create({
      user_id: userId,
      title: `Thực đơn ${type}`,
      start_date,
      end_date,
    });

    // ===== GET ALL APPROVED RECIPES =====
    let recipes = await Recipe.findAll({
      where: { status: "Approved" },
    });

    console.log("Total Approved recipes:", recipes.length);

    // ===== APPLY DIET FILTER WITH CUSTOM LIMITS =====
    recipes = recipes.filter((r) => {
      const servings = toNum(r.servings) || 1;

      const carbs = toNum(r.cached_carbs) / servings;
      const fat = toNum(r.cached_fat) / servings;
      const cal = toNum(r.cached_calories) / servings;

      if (type === "keto") {
        return (
          carbs < DIET_LIMITS.keto.maxCarbsPerServing &&
          cal < DIET_LIMITS.keto.maxCaloriesPerServing
        );
      }

      if (type === "eat-clean") {
        return (
          fat < DIET_LIMITS.eatclean.maxFatPerServing &&
          cal < DIET_LIMITS.eatclean.maxCaloriesPerServing
        );
      }

      if (type === "healthy") {
        return (
          cal < DIET_LIMITS.healthy.maxCaloriesPerServing &&
          fat < DIET_LIMITS.healthy.maxFatPerServing
        );
      }

      return true;
    });

    console.log("After diet filter:", recipes.length);

    if (recipes.length < 1) {
      return res.status(400).json({ message: "Không đủ món để gợi ý" });
    }

    // ===== MEAL TYPE JSONB PARSE =====
    const mealTypes = ["Breakfast", "Lunch", "Dinner"];

    const getByMealType = (mt) =>
      recipes.filter((r) => {
        try {
          const arr = Array.isArray(r.meal_type)
            ? r.meal_type
            : JSON.parse(r.meal_type || "[]");
          return arr.includes(mt);
        } catch {
          return false;
        }
      });

    // ===== DAILY MEAL GENERATOR =====
    const generateDailyMeals = () => {
      const used = new Set();
      const result = [];

      for (const mt of mealTypes) {
        let candidates = getByMealType(mt).filter(
          (r) => !used.has(r.recipe_id)
        );

        // fallback nếu thiếu món đúng loại
        if (candidates.length === 0) {
          candidates = recipes.filter((r) => !used.has(r.recipe_id));
        }

        if (candidates.length === 0) continue;

        const pick =
          candidates[Math.floor(Math.random() * candidates.length)];

        used.add(pick.recipe_id);

        result.push({
          meal_type: mt,
          recipe_id: pick.recipe_id,
        });
      }

      return result;
    };

    // ===== LOOP DAYS =====
    const start = new Date(start_date);
    const end = new Date(end_date);

    while (start <= end) {
      const dateStr = start.toISOString().split("T")[0];

      const meals = generateDailyMeals();

      for (const m of meals) {
        await MealPlanRecipe.create({
          mealplan_id: mealPlan.mealplan_id,
          recipe_id: m.recipe_id,
          meal_type: m.meal_type,
          scheduled_date: dateStr,
        });
      }

      start.setDate(start.getDate() + 1);
    }

    return res.status(201).json({
      message: "Gợi ý thực đơn thành công!",
      mealPlan,
    });
  } catch (err) {
    console.error("suggestMealPlan ERR:", err);
    res
      .status(500)
      .json({ message: "Lỗi gợi ý thực đơn", error: err.message });
  }
};
