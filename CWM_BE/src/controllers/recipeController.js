"use strict";
const { Recipe, User, Category, RecipeCategory, Ingredient, RecipeIngredient, MealPlanRecipe, Sequelize } = require("../models");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

// ✅ Tạo công thức mới (luôn ở trạng thái Pending)
exports.createRecipe = async (req, res) => {
  try {
    const { title, description, user_id, difficulty_level, cooking_time } = req.body;

    const steps = JSON.parse(req.body.steps || "[]");
    const category_ids = JSON.parse(req.body.category_ids || "[]");
    const ingredients = JSON.parse(req.body.ingredients || "[]");

    const imageFiles = req.files?.images || [];
    const videoFiles = req.files?.video || [];
    const stepImages = req.files?.stepImages || [];

    const recipeImageUrls = [];
    for (const file of imageFiles) {
      const uploadResult = await cloudinary.uploader.upload(file.path, { folder: "recipes" });
      recipeImageUrls.push(uploadResult.secure_url);
      fs.unlinkSync(file.path);
    }

    const updatedSteps = await Promise.all(
      steps.map(async (step, index) => {
        const imageFile = stepImages[index];
        let imageUrl = step.image_url;
        if (imageFile) {
          const uploadResult = await cloudinary.uploader.upload(imageFile.path, { folder: "recipes/steps" });
          imageUrl = uploadResult.secure_url;
          fs.unlinkSync(imageFile.path);
        }
        return { description: step.description, image_url: imageUrl, order: index + 1 };
      })
    );

    const recipe = await Recipe.create({
      user_id,
      title,
      description,
      difficulty_level,
      cooking_time,
      steps: updatedSteps,
      images: recipeImageUrls,
      status: "Pending",
    });

    if (Array.isArray(category_ids) && category_ids.length > 0) {
      const categoryLinks = category_ids.map((cid) => ({
        recipe_id: recipe.recipe_id,
        category_id: cid,
      }));
      await RecipeCategory.bulkCreate(categoryLinks);
    }

    if (Array.isArray(ingredients) && ingredients.length > 0) {
      const ingredientLinks = ingredients.map((ing) => ({
        recipe_id: recipe.recipe_id,
        ingredient_id: ing.ingredient_id,
        quantity: ing.quantity,
        unit: ing.unit,
      }));
      await RecipeIngredient.bulkCreate(ingredientLinks);
    }

    return res.status(201).json({
      message: "Tạo công thức thành công! Vui lòng chờ admin duyệt.",
      recipe,
    });
  } catch (error) {
    console.error("❌ Lỗi createRecipe:", error);
    if (req.files) {
      Object.values(req.files)
        .flat()
        .forEach((file) => {
          try {
            fs.unlinkSync(file.path);
          } catch (e) {}
        });
    }
    res.status(500).json({ message: "Lỗi tạo công thức", error: error.message });
  }
};

// ✅ Lấy tất cả công thức (lọc theo status)
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


// ✅ Lấy chi tiết công thức (chỉ xem được Approved, trừ admin hoặc chính chủ)
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
              (SELECT COUNT("rating_id") 
               FROM "rating" 
               WHERE "rating"."recipe_id" = "Recipe"."recipe_id")
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

    const user = req.user;
    if (recipe.status !== "Approved" && user?.role !== "admin" && user?.user_id !== recipe.user_id) {
      return res.status(403).json({ message: "Công thức chưa được duyệt hoặc đã bị từ chối." });
    }

    return res.status(200).json({ recipe });
  } catch (error) {
    console.error("❌ Lỗi getRecipeById:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};


// ✅ Cập nhật công thức (chủ sở hữu hoặc admin)
exports.updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    let { title, description, steps, ingredients, difficulty_level, cooking_time, category_ids } = req.body;

    const recipe = await Recipe.findByPk(id);
    if (!recipe) return res.status(404).json({ message: "Không tìm thấy công thức." });

    if (req.user.role !== "admin" && req.user.user_id !== recipe.user_id) {
      return res.status(403).json({ message: "Không có quyền chỉnh sửa công thức này" });
    }

    // Parse JSON
    if (typeof steps === "string") steps = JSON.parse(steps);
    if (typeof ingredients === "string") ingredients = JSON.parse(ingredients);
    if (typeof category_ids === "string") category_ids = JSON.parse(category_ids);

    // Upload ảnh chính
    if (req.files?.images?.length > 0) {
      recipe.images = [];
      for (const file of req.files.images) {
        const uploadedImage = await cloudinary.uploader.upload(file.path, { folder: "recipes/images" });
        recipe.images.push(uploadedImage.secure_url);
        fs.unlinkSync(file.path);
      }
    }

    // Upload video nếu có
    if (req.files?.video?.[0]) {
      const videoPath = req.files.video[0].path;
      const uploadVideo = await cloudinary.uploader.upload(videoPath, {
        folder: "recipes/videos",
        resource_type: "video",
      });
      recipe.video_url = uploadVideo.secure_url;
      fs.unlinkSync(videoPath);
    }

    // Cập nhật cơ bản
    recipe.title = title || recipe.title;
    recipe.description = description || recipe.description;
    recipe.difficulty_level = difficulty_level || recipe.difficulty_level;
    recipe.cooking_time = cooking_time || recipe.cooking_time;

    // Nếu user thường chỉnh sửa → reset status về Pending
    if (req.user.role !== "admin") {
      recipe.status = "Pending";
    }

    // Cập nhật danh mục
    if (Array.isArray(category_ids)) {
      await RecipeCategory.destroy({ where: { recipe_id: id } });
      await RecipeCategory.bulkCreate(category_ids.map((catId) => ({ recipe_id: id, category_id: catId })));
    }

    // Cập nhật nguyên liệu
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
    }

    // Cập nhật steps
    if (Array.isArray(steps)) {
      recipe.steps = steps.map((s, index) => ({
        order: s.order || index + 1,
        description: s.description,
        image_url: s.image_url || null,
      }));
    }

    await recipe.save();

    return res.status(200).json({ message: "Cập nhật công thức thành công!", recipe });
  } catch (error) {
    console.error("❌ Lỗi updateRecipe:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// ✅ Admin duyệt hoặc từ chối công thức
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

    return res.status(200).json({ message: `Cập nhật trạng thái công thức thành công: ${status}` });
  } catch (error) {
    console.error("❌ Lỗi updateRecipeStatus:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// ✅ Xóa công thức
exports.deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;

    const recipe = await Recipe.findByPk(id);
    if (!recipe) return res.status(404).json({ message: "Không tìm thấy công thức." });

    if (req.user.role !== "admin" && req.user.user_id !== recipe.user_id) {
      return res.status(403).json({ message: "Không có quyền xoá công thức này" });
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
