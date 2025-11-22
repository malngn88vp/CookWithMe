"use strict";
const {
  Recipe,
  User,
  Category,
  RecipeCategory,
  Ingredient,
  RecipeIngredient,
  MealPlanRecipe,
  Sequelize,
} = require("../models");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

// ==================================================
// 🔥 Function tính tổng dinh dưỡng
// ==================================================
async function calculateNutrition(ingredients) {
  let total = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  for (const ing of ingredients) {
    const ingData = await Ingredient.findByPk(ing.ingredient_id);
    if (!ingData) continue;

    const qty = ing.quantity || 1;

    total.calories += (ingData.calories || 0) * qty;
    total.protein += (ingData.protein || 0) * qty;
    total.carbs += (ingData.carbs || 0) * qty;
    total.fat += (ingData.fat || 0) * qty;
  }

  return total;
}

// ==================================================
// ✅ Tạo công thức mới
// ==================================================
exports.createRecipe = async (req, res) => {
  try {
    let {
      title,
      description,
      user_id,
      difficulty_level,
      cooking_time,
      servings,
      meal_type,
    } = req.body;

    // ⭐ FIX QUAN TRỌNG: meal_type JSON → array
    meal_type = typeof meal_type === "string" ? JSON.parse(meal_type) : meal_type;

    const steps = JSON.parse(req.body.steps || "[]");
    const category_ids = JSON.parse(req.body.category_ids || "[]");
    const ingredients = JSON.parse(req.body.ingredients || "[]");

    // Upload images
    const imageFiles = req.files?.images || [];
    const stepImages = req.files?.stepImages || [];

    const recipeImageUrls = [];
    for (const file of imageFiles) {
      const uploadResult = await cloudinary.uploader.upload(file.path, { folder: "recipes" });
      recipeImageUrls.push(uploadResult.secure_url);
      fs.unlinkSync(file.path);
    }

    // Upload step images
    const updatedSteps = await Promise.all(
      steps.map(async (step, index) => {
        const file = stepImages[index];
        let imageUrl = step.image_url;

        if (file) {
          const upload = await cloudinary.uploader.upload(file.path, {
            folder: "recipes/steps",
          });
          imageUrl = upload.secure_url;
          fs.unlinkSync(file.path);
        }

        return {
          description: step.description,
          image_url: imageUrl,
          order: index + 1,
        };
      })
    );

    // 🔥 Tính dinh dưỡng tổng
    const nutrition = await calculateNutrition(ingredients);

    // Tạo recipe
    const recipe = await Recipe.create({
      user_id,
      title,
      description,
      difficulty_level,
      cooking_time,
      servings,

      // ⭐ LƯU meal_type đúng dạng array
      meal_type: meal_type || ["Breakfast", "Lunch", "Dinner"],

      steps: updatedSteps,
      images: recipeImageUrls,
      status: "Pending",

      // 🔥 Lưu nutrition vào DB
      cached_calories: nutrition.calories,
      cached_protein: nutrition.protein,
      cached_carbs: nutrition.carbs,
      cached_fat: nutrition.fat,
    });

    // Insert categories
    if (category_ids.length > 0) {
      await RecipeCategory.bulkCreate(
        category_ids.map((cid) => ({
          recipe_id: recipe.recipe_id,
          category_id: cid,
        }))
      );
    }

    // Insert ingredients
    if (ingredients.length > 0) {
      await RecipeIngredient.bulkCreate(
        ingredients.map((ing) => ({
          recipe_id: recipe.recipe_id,
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit: ing.unit,
        }))
      );
    }

    return res.status(201).json({
      message: "Tạo công thức thành công! Vui lòng chờ admin duyệt.",
      recipe,
    });
  } catch (error) {
    console.error("❌ Lỗi createRecipe:", error);
    res.status(500).json({ message: "Lỗi tạo công thức", error: error.message });
  }
};

// ==================================================
// ✅ Lấy tất cả công thức
// ==================================================
exports.getAllRecipes = async (req, res) => {
  try {
    const { user_id, status } = req.query;
    const role = req.user?.role || "user";
    const whereClause = {};

    if (user_id) whereClause.user_id = user_id;

    if (role !== "admin") {
      if (!(user_id && req.user && parseInt(req.user.user_id) === parseInt(user_id))) {
        whereClause.status = "Approved";
      }
    } else {
      if (status) whereClause.status = status;
    }

    const recipes = await Recipe.findAll({
      where: whereClause,
      attributes: {
        include: [
          [
            Sequelize.literal(`(
              COALESCE(
                (SELECT AVG("stars")
                  FROM "rating"
                  WHERE "rating"."recipe_id" = "Recipe"."recipe_id"),
                0
              )
            )`),
            "average_rating",
          ],
        ],
      },
      include: [
        { model: User, attributes: ["user_id", "name", "email"] },
        {
          model: Category,
          as: "categories",
          attributes: ["category_id", "name"],
          through: { attributes: [] },
        },
        {
          model: Ingredient,
          as: "ingredients",
          attributes: ["ingredient_id", "name", "default_unit"],
          through: { attributes: ["quantity", "unit"] },
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({ recipes });
  } catch (error) {
    console.error("❌ Lỗi getAllRecipes:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// ==================================================
// ✅ Lấy chi tiết công thức
// ==================================================
exports.getRecipeById = async (req, res) => {
  try {
    const { id } = req.params;

    const recipe = await Recipe.findByPk(id, {
      attributes: {
        include: [
          [
            Sequelize.literal(`(
              COALESCE(
                (SELECT AVG("stars")
                 FROM "rating"
                 WHERE "rating"."recipe_id" = "Recipe"."recipe_id"),
                0
              )
            )`),
            "average_rating",
          ],
          [
            Sequelize.literal(`(
              SELECT COUNT("rating_id")
              FROM "rating"
              WHERE "rating"."recipe_id" = "Recipe"."recipe_id"
            )`),
            "rating_count",
          ],
        ],
      },
      include: [
        { model: User, attributes: ["user_id", "name", "email"] },
        { model: Category, as: "categories", attributes: ["category_id", "name"], through: { attributes: [] } },
        {
          model: Ingredient,
          as: "ingredients",
          attributes: ["ingredient_id", "name", "default_unit"],
          through: { attributes: ["quantity", "unit"] },
        },
      ],
    });

    if (!recipe) return res.status(404).json({ message: "Không tìm thấy công thức." });

    if (
      recipe.status !== "Approved" &&
      req.user?.role !== "admin" &&
      req.user?.user_id !== recipe.user_id
    ) {
      return res.status(403).json({ message: "Công thức chưa được duyệt." });
    }

    return res.status(200).json({ recipe });
  } catch (error) {
    console.error("❌ Lỗi getRecipeById:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// ==================================================
// ✅ Admin duyệt / từ chối
// ==================================================
exports.updateRecipeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Approved", "Rejected", "Pending"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ." });
    }

    const recipe = await Recipe.findByPk(id);
    if (!recipe) return res.status(404).json({ message: "Không tìm thấy công thức." });

    recipe.status = status;
    await recipe.save();

    return res.status(200).json({
      message: `Cập nhật trạng thái thành công: ${status}`,
    });
  } catch (error) {
    console.error("❌ Lỗi updateRecipeStatus:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// ==================================================
// ✅ Cập nhật công thức
// ==================================================
exports.updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    let {
      title,
      description,
      steps,
      ingredients,
      difficulty_level,
      cooking_time,
      servings,
      meal_type,
      category_ids,
    } = req.body;

    const recipe = await Recipe.findByPk(id);
    if (!recipe) return res.status(404).json({ message: "Không tìm thấy công thức." });

    if (req.user.role !== "admin" && req.user.user_id !== recipe.user_id) {
      return res.status(403).json({ message: "Không có quyền chỉnh sửa công thức này" });
    }

    // Parse JSON
    if (typeof steps === "string") steps = JSON.parse(steps);
    if (typeof ingredients === "string") ingredients = JSON.parse(ingredients);
    if (typeof category_ids === "string") category_ids = JSON.parse(category_ids);

    // ⭐ FIX meal_type JSON
    if (typeof meal_type === "string") meal_type = JSON.parse(meal_type);

    // Upload ảnh chính
    if (req.files?.images?.length > 0) {
      recipe.images = [];
      for (const file of req.files.images) {
        const uploadedImage = await cloudinary.uploader.upload(
          file.path,
          { folder: "recipes/images" }
        );
        recipe.images.push(uploadedImage.secure_url);
        fs.unlinkSync(file.path);
      }
    }

    // Upload video
    if (req.files?.video?.[0]) {
      const uploadVideo = await cloudinary.uploader.upload(
        req.files.video[0].path,
        {
          folder: "recipes/videos",
          resource_type: "video",
        }
      );
      recipe.video_url = uploadVideo.secure_url;
      fs.unlinkSync(req.files.video[0].path);
    }

    // Update fields
    recipe.title = title || recipe.title;
    recipe.description = description || recipe.description;
    recipe.difficulty_level = difficulty_level || recipe.difficulty_level;
    recipe.cooking_time = cooking_time || recipe.cooking_time;
    recipe.servings = servings || recipe.servings;

    // ⭐ Lưu meal_type dạng array
    recipe.meal_type = meal_type || recipe.meal_type;

    if (req.user.role !== "admin") recipe.status = "Pending";

    // Update categories
    if (Array.isArray(category_ids)) {
      await RecipeCategory.destroy({ where: { recipe_id: id } });
      await RecipeCategory.bulkCreate(
        category_ids.map((catId) => ({
          recipe_id: id,
          category_id: catId,
        }))
      );
    }

    // Update ingredients + tính lại dinh dưỡng
    if (Array.isArray(ingredients)) {
      await RecipeIngredient.destroy({ where: { recipe_id: id } });
      await RecipeIngredient.bulkCreate(
        ingredients.map((ing) => ({
          recipe_id: id,
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit: ing.unit,
        }))
      );

      // 🔥 Tính lại nutrition
      const nutrition = await calculateNutrition(ingredients);
      recipe.cached_calories = nutrition.calories;
      recipe.cached_protein = nutrition.protein;
      recipe.cached_carbs = nutrition.carbs;
      recipe.cached_fat = nutrition.fat;
    }

    // Update steps & images
    if (Array.isArray(steps)) {
      const stepImages = req.files?.stepImages || [];
      let stepImageIndexes = req.body.stepImageIndex || [];

      if (typeof stepImageIndexes === "string")
        stepImageIndexes = [stepImageIndexes];

      const finalSteps = [];

      for (let i = 0; i < steps.length; i++) {
        const s = steps[i];

        let image_url =
          typeof s.image_url !== "undefined"
            ? s.image_url
            : recipe.steps?.[i]?.image_url;

        const replaceIndex = stepImageIndexes.findIndex(
          (idx) => Number(idx) === i
        );

        if (replaceIndex !== -1 && stepImages[replaceIndex]) {
          const upload = await cloudinary.uploader.upload(
            stepImages[replaceIndex].path,
            { folder: "recipes/steps" }
          );
          image_url = upload.secure_url;
          fs.unlinkSync(stepImages[replaceIndex].path);
        }

        finalSteps.push({
          order: s.order || i + 1,
          description: s.description,
          image_url,
        });
      }

      recipe.steps = finalSteps;
    }

    await recipe.save();

    return res.status(200).json({
      message: "Cập nhật công thức thành công!",
      recipe,
    });
  } catch (error) {
    console.error("❌ Lỗi updateRecipe:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// ==================================================
// ❌ Xóa công thức
// ==================================================
exports.deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;

    const recipe = await Recipe.findByPk(id);
    if (!recipe) return res.status(404).json({ message: "Không tìm thấy công thức." });

    if (req.user.role !== "admin" && req.user.user_id !== recipe.user_id) {
      return res.status(403).json({ message: "Không có quyền xoá" });
    }

    await MealPlanRecipe.destroy({ where: { recipe_id: id } });
    await RecipeCategory.destroy({ where: { recipe_id: id } });
    await RecipeIngredient.destroy({ where: { recipe_id: id } });

    await recipe.destroy();

    return res.status(200).json({ message: "Xóa công thức thành công!" });
  } catch (error) {
    console.error("❌ Lỗi deleteRecipe:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
