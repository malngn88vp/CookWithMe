const { RecipeIngredient, Ingredient, Recipe } = require("../models");

exports.getNutrition = async (req, res) => {
  try {
    const recipeId = req.params.id;

    // Lấy thông tin công thức để biết số khẩu phần
    const recipe = await Recipe.findByPk(recipeId);
    const servings = recipe?.servings || 1;

    // Lấy nguyên liệu
    const items = await RecipeIngredient.findAll({
      where: { recipe_id: recipeId },
      include: [{ model: Ingredient, as: "ingredient" }]
    });

    if (!items || items.length === 0) {
      return res.json({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        per_serving: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        }
      });
    }

    let total = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    const convertToGram = (quantity, unit) => {
      if (!quantity) return 0;

      unit = (unit || "").toLowerCase();

      if (unit === "gram" || unit === "g") return quantity;
      if (unit === "kg") return quantity * 1000;
      if (unit === "ml") return quantity;
      if (unit === "l") return quantity * 1000;

      if (unit.includes("muỗng") || unit === "tbsp") return quantity * 15;
      if (unit.includes("thìa") || unit === "tsp") return quantity * 5;

      return quantity;
    };

    items.forEach(item => {
      const qtyGram = convertToGram(item.quantity, item.unit);
      const factor = qtyGram / 100;

      total.calories += (item.ingredient.calories || 0) * factor;
      total.protein += (item.ingredient.protein || 0) * factor;
      total.carbs += (item.ingredient.carbs || 0) * factor;
      total.fat += (item.ingredient.fat || 0) * factor;
    });

    // 🔥 Tính theo khẩu phần
    const perServing = {
      calories: Math.round(total.calories / servings),
      protein: Number((total.protein / servings).toFixed(1)),
      carbs: Number((total.carbs / servings).toFixed(1)),
      fat: Number((total.fat / servings).toFixed(1)),
    };

    res.json({
      total: {
        calories: Math.round(total.calories),
        protein: Number(total.protein.toFixed(1)),
        carbs: Number(total.carbs.toFixed(1)),
        fat: Number(total.fat.toFixed(1)),
      },
      per_serving: perServing,
      servings
    });

  } catch (err) {
    console.error("Error getNutrition:", err);
    res.status(500).json({ message: "Error calculating nutrition" });
  }
};
