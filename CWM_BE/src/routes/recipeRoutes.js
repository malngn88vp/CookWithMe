const express = require("express");
const router = express.Router();
const recipeController = require("../controllers/recipeController");
const nutritionController = require("../controllers/nutritionController");
const upload = require("../middlewares/upload");
const { isAuthenticated, isOwnerOrAdmin } = require("../middlewares/roleCheck");
const optionalAuth = require("../middlewares/optionalAuth");
const { Recipe } = require("../models");

// 🔍 Lấy chủ sở hữu recipe
const getRecipeOwner = async (req) => {
  const recipe = await Recipe.findByPk(req.params.id);
  return recipe ? recipe.user_id : null;
};

// 🟢 Public + optional auth
router.get("/", optionalAuth, recipeController.getAllRecipes);

// 🔥 Route nutrition — phải đặt TRƯỚC /:id
router.get("/:id/nutrition", optionalAuth, nutritionController.getNutrition);

router.get("/:id", optionalAuth, recipeController.getRecipeById);

// 🟡 Cần đăng nhập
router.post(
  "/",
  isAuthenticated,
  upload.fields([
    { name: "images", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "stepImages", maxCount: 50 },
  ]),
  recipeController.createRecipe
);

router.put(
  "/:id",
  isAuthenticated,
  upload.fields([
    { name: "images", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "stepImages", maxCount: 50 },
  ]),
  recipeController.updateRecipe
);

router.patch(
  "/:id/status",
  isAuthenticated,
  async (req, res, next) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Chỉ admin mới có thể duyệt công thức." });
    }
    next();
  },
  recipeController.updateRecipeStatus
);

router.delete(
  "/:id",
  isAuthenticated,
  isOwnerOrAdmin(getRecipeOwner),
  recipeController.deleteRecipe
);

module.exports = router;
