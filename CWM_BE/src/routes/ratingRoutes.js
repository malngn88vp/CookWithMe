const express = require("express");
const router = express.Router();
const ratingController = require("../controllers/ratingController");
const { isAuthenticated } = require("../middlewares/roleCheck");

// ⭐ Tạo hoặc cập nhật đánh giá
router.post("/:recipeId", isAuthenticated, ratingController.createOrUpdateRating);

// 📈 Lấy trung bình đánh giá (đặt TRƯỚC)
router.get("/:recipeId/average", ratingController.getAverageRating);

// 📋 Lấy đánh giá của 1 người dùng cho 1 công thức
router.get("/:recipeId/user/:userId", ratingController.getRatingByRecipeAndUser);

// 📊 Lấy tất cả đánh giá của công thức
router.get("/:recipeId", ratingController.getRatingsByRecipe);

// 🗑️ Xóa đánh giá
router.delete("/delete/:id", isAuthenticated, ratingController.deleteRating);

module.exports = router;
