const express = require("express");
const router = express.Router();
const favoriteController = require("../controllers/favoriteController");
const authMiddleware = require("../middlewares/authMiddleware");

// ✅ Thêm công thức vào yêu thích
router.post("/:recipeId", authMiddleware, favoriteController.addFavorite);

// ❌ Xóa khỏi yêu thích
router.delete("/:recipeId", authMiddleware, favoriteController.removeFavorite);

// 📜 Lấy danh sách yêu thích của user
router.get("/", authMiddleware, favoriteController.getUserFavorites);

// 🔍 Kiểm tra 1 công thức đã yêu thích chưa
router.get("/check/:recipeId", authMiddleware, favoriteController.checkFavoriteStatus);

module.exports = router;
