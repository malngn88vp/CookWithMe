// routes/mealPlanRoutes.js
const express = require("express");
const router = express.Router();
const mealPlanController = require("../controllers/mealPlanController");
const authMiddleware = require("../middlewares/authMiddleware");

// 📅 Tạo kế hoạch
router.post("/", authMiddleware, mealPlanController.createMealPlan);

// 🍲 Thêm công thức vào kế hoạch
router.post("/:id/recipes", authMiddleware, mealPlanController.addRecipeToMealPlan);

// 📜 Danh sách tất cả kế hoạch
router.get("/", authMiddleware, mealPlanController.getAllMealPlans);

// 📊 Chi tiết 1 kế hoạch
router.get("/:id", authMiddleware, mealPlanController.getMealPlanById);

// ❌ Xóa công thức khỏi kế hoạch
router.delete("/:id/recipes/:recipeId", authMiddleware, mealPlanController.removeRecipeFromMealPlan);

// 🗑️ Xóa kế hoạch
router.delete("/:id", authMiddleware, mealPlanController.deleteMealPlan);

module.exports = router;
