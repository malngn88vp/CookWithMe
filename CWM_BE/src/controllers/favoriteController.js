// controllers/favoriteController.js
const { Favorite, Recipe } = require("../models");

module.exports = {
  // ⭐ Thêm công thức vào yêu thích
  addFavorite: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const { recipeId } = req.params;

      // Kiểm tra đã tồn tại chưa
      const existing = await Favorite.findOne({ where: { user_id: userId, recipe_id: recipeId } });
      if (existing) {
        return res.status(400).json({ message: "Công thức đã có trong danh sách yêu thích" });
      }

      await Favorite.create({ user_id: userId, recipe_id: recipeId });
      res.status(201).json({ message: "Đã thêm vào yêu thích!" });
    } catch (error) {
      console.error("❌ Lỗi addFavorite:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  // ❌ Xóa khỏi yêu thích
  removeFavorite: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const { recipeId } = req.params;

      const deleted = await Favorite.destroy({ where: { user_id: userId, recipe_id: recipeId } });
      if (!deleted) {
        return res.status(404).json({ message: "Công thức không có trong danh sách yêu thích" });
      }

      res.status(200).json({ message: "Đã xóa khỏi danh sách yêu thích" });
    } catch (error) {
      console.error("❌ Lỗi removeFavorite:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  // 📜 Lấy danh sách yêu thích của người dùng
  getUserFavorites: async (req, res) => {
    try {
      const userId = req.user.user_id;

      const favorites = await Favorite.findAll({
        where: { user_id: userId },
        include: [{
          model: Recipe,
          as: "recipe",
          attributes: ["recipe_id", "title", "description", "images", "video_url", "status", "created_at"]
        }]
      });




      res.status(200).json({ total: favorites.length, favorites });
    } catch (error) {
      console.error("❌ Lỗi getUserFavorites:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  // ✅ Kiểm tra 1 công thức đã được yêu thích hay chưa
  checkFavoriteStatus: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const { recipeId } = req.params;

      const favorite = await Favorite.findOne({ where: { user_id: userId, recipe_id: recipeId } });
      res.status(200).json({ isFavorite: !!favorite });
    } catch (error) {
      console.error("❌ Lỗi checkFavoriteStatus:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  }
};
