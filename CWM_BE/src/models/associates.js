'use strict';

module.exports = (db) => {
  const {
    User,
    Category,
    Ingredient,
    Recipe,
    RecipeCategory,
    RecipeIngredient,
    Rating,
    Comment,
    Favorite,
    MealPlan,
    MealPlanRecipe,
    ShoppingListItem
  } = db;

  // 📌 User - Recipe (1:N)
  User.hasMany(Recipe, { foreignKey: 'user_id' });
  Recipe.belongsTo(User, { foreignKey: 'user_id' });

  // 📌 Recipe - Category (N:N)
  Recipe.belongsToMany(Category, {
    through: RecipeCategory,
    foreignKey: 'recipe_id',
    otherKey: 'category_id',
    as: 'categories',
    onDelete: 'CASCADE',
    hooks: true,
  });
  Category.belongsToMany(Recipe, {
    through: RecipeCategory,
    foreignKey: 'category_id',
    otherKey: 'recipe_id',
    as: 'recipes',
    onDelete: 'CASCADE',
    hooks: true,
  });

  // 📌 Recipe - Ingredient (N:N)
  Recipe.belongsToMany(Ingredient, {
    through: RecipeIngredient,
    foreignKey: 'recipe_id',
    otherKey: 'ingredient_id',
    as: 'ingredients',
  });

  Ingredient.belongsToMany(Recipe, {
    through: RecipeIngredient,
    foreignKey: 'ingredient_id',
    otherKey: 'recipe_id',
    as: 'recipes',
  });

  RecipeIngredient.belongsTo(Ingredient, {
    foreignKey: "ingredient_id",
    as: "ingredient",
  });

  Ingredient.hasMany(RecipeIngredient, {
    foreignKey: "ingredient_id",
  });

  // 📌 Rating (1:N)
  User.hasMany(Rating, { foreignKey: 'user_id' });
  Rating.belongsTo(User, { foreignKey: 'user_id' });

  Recipe.hasMany(Rating, { foreignKey: 'recipe_id', onDelete: 'CASCADE', hooks: true });
  Rating.belongsTo(Recipe, { foreignKey: 'recipe_id' });

  // 📌 Comment (1:N)
  User.hasMany(Comment, { foreignKey: 'user_id' });
  Comment.belongsTo(User, { foreignKey: 'user_id', as: "user" });

  Recipe.hasMany(Comment, { foreignKey: 'recipe_id', onDelete: 'CASCADE', hooks: true });
  Comment.belongsTo(Recipe, { foreignKey: 'recipe_id', as: "recipe" });

  // 📌 Favorite (N:N giữa User - Recipe)
  User.belongsToMany(Recipe, {
    through: Favorite,
    foreignKey: 'user_id',
    otherKey: 'recipe_id',
    as: 'favorite_recipes'
  });
  Recipe.belongsToMany(User, {
    through: Favorite,
    foreignKey: 'recipe_id',
    otherKey: 'user_id',
    as: 'favorited_by_users'
  });

  Favorite.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Favorite.belongsTo(Recipe, { foreignKey: 'recipe_id', as: 'recipe' });

  // 📌 MealPlan - User (1:N)
  User.hasMany(MealPlan, { foreignKey: 'user_id' });
  MealPlan.belongsTo(User, { foreignKey: 'user_id' });

  // 📌 MealPlan - Recipe (N:N) — 🔥 FIX CASCADE TẠI ĐÂY
  MealPlan.belongsToMany(Recipe, {
    through: MealPlanRecipe,
    foreignKey: 'mealplan_id',
    otherKey: 'recipe_id',
    as: 'recipes',
    onDelete: 'CASCADE',
    hooks: true,
  });

  Recipe.belongsToMany(MealPlan, {
    through: MealPlanRecipe,
    foreignKey: 'recipe_id',
    otherKey: 'mealplan_id',
    as: 'mealplans',
    onDelete: 'CASCADE',
    hooks: true,
  });

  // 🔥 Quan hệ trực tiếp cho CASCADE
  MealPlanRecipe.belongsTo(MealPlan, {
    foreignKey: 'mealplan_id',
    onDelete: 'CASCADE',
    hooks: true,
  });

  MealPlanRecipe.belongsTo(Recipe, {
    foreignKey: 'recipe_id',
    onDelete: 'CASCADE',
    hooks: true,
  });

  MealPlan.hasMany(MealPlanRecipe, {
    foreignKey: 'mealplan_id',
    onDelete: 'CASCADE',
    hooks: true,
  });

  Recipe.hasMany(MealPlanRecipe, {
    foreignKey: 'recipe_id',
    onDelete: 'CASCADE',
    hooks: true,
  });

  // 📌 ShoppingListItem - MealPlan & Ingredient
  MealPlan.hasMany(ShoppingListItem, { foreignKey: 'mealplan_id' });
  ShoppingListItem.belongsTo(MealPlan, { foreignKey: 'mealplan_id' });

  Ingredient.hasMany(ShoppingListItem, { foreignKey: 'ingredient_id' });
  ShoppingListItem.belongsTo(Ingredient, { foreignKey: 'ingredient_id' });
};
