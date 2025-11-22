const { RecipeIngredient, Ingredient } = require("../models");

exports.calculateRecipeNutrition = async (recipeId) => {
  const items = await RecipeIngredient.findAll({
    where: { recipe_id: recipeId },
    include: [{ model: Ingredient }],
  });

  let total = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  items.forEach(item => {
    const qty = Number(item.quantity) || 0;
    const f = qty / 100;

    total.calories += (item.Ingredient.calories || 0) * f;
    total.protein  += (item.Ingredient.protein  || 0) * f;
    total.carbs    += (item.Ingredient.carbs    || 0) * f;
    total.fat      += (item.Ingredient.fat      || 0) * f;
  });

  return {
    calories: Math.round(total.calories),
    protein: Number(total.protein.toFixed(1)),
    carbs: Number(total.carbs.toFixed(1)),
    fat: Number(total.fat.toFixed(1)),
  };
};
