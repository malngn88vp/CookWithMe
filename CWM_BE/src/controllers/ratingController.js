// controllers/ratingController.js
const { Rating, Recipe } = require("../models");

module.exports = {
  // 📌 Tạo hoặc cập nhật đánh giá
  createOrUpdateRating: async (req, res) => {
    try {
      const { stars } = req.body;
      const recipeId = req.params.recipeId;
      const userId = req.user.user_id;

      if (!stars || stars < 1 || stars > 5) {
        return res.status(400).json({ message: "Số sao phải từ 1 đến 5" });
      }

      const recipe = await Recipe.findByPk(recipeId);
      if (!recipe) {
        return res.status(404).json({ message: "Công thức không tồn tại" });
      }

      // ✅ Kiểm tra xem user đã đánh giá công thức này chưa
      const existing = await Rating.findOne({
        where: { user_id: userId, recipe_id: recipeId },
      });

      let rating;
      if (existing) {
        existing.stars = stars;
        await existing.save();
        rating = existing;
      } else {
        rating = await Rating.create({
          user_id: userId,
          recipe_id: recipeId,
          stars,
        });
      }

      res.status(200).json({
        message: existing ? "Đã cập nhật đánh giá" : "Đã thêm đánh giá mới",
        rating,
      });
    } catch (error) {
      console.error("❌ Error createOrUpdateRating:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  // 📊 Lấy danh sách đánh giá của một công thức
  getRatingsByRecipe: async (req, res) => {
    try {
      const recipeId = req.params.recipeId;
      const ratings = await Rating.findAll({
        where: { recipe_id: recipeId },
        include: ["User"],
      });

      res.status(200).json(ratings);
    } catch (error) {
      console.error("❌ Error getRatingsByRecipe:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  // 📋 Lấy đánh giá của 1 người dùng cho 1 công thức
  getRatingByRecipeAndUser: async (req, res) => {
    try {
      const { recipeId, userId } = req.params;

      const rating = await Rating.findOne({
        where: { recipe_id: recipeId, user_id: userId },
      });

      if (!rating) return res.status(200).json({ stars: 0 });

      res.status(200).json(rating);
    } catch (error) {
      console.error("❌ Error getRatingByRecipeAndUser:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  // Lấy đánh giá của user cho 1 công thức
  getUserRating: async (req, res) => {
    try {
      const recipeId = req.params.recipeId;
      const userId = req.user.user_id;

      const rating = await Rating.findOne({
        where: { user_id: userId, recipe_id: recipeId },
      });

      if (!rating) {
        return res.status(404).json({ message: "Chưa có đánh giá" });
      }

      res.status(200).json(rating);
    } catch (error) {
      console.error("❌ Error getUserRating:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  // 📈 Tính trung bình sao của một công thức
  getAverageRating: async (req, res) => {
    try {
      const recipeId = req.params.recipeId;
      const ratings = await Rating.findAll({ where: { recipe_id: recipeId } });

      if (ratings.length === 0) {
        return res.status(200).json({ avgRating: 0, total: 0 });
      }

      const avg =
        ratings.reduce((acc, r) => acc + r.stars, 0) / ratings.length;

      res.status(200).json({
        avgRating: parseFloat(avg.toFixed(2)),
        total: ratings.length, // 👈 chính là "số lượt đánh giá"
      });
    } catch (error) {
      console.error("❌ Error getAverageRating:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  // 🗑️ Xóa đánh giá
  deleteRating: async (req, res) => {
    try {
      const ratingId = req.params.id;
      const userId = req.user.user_id;

      const rating = await Rating.findByPk(ratingId);
      if (!rating) {
        return res.status(404).json({ message: "Đánh giá không tồn tại" });
      }

      if (rating.user_id !== userId && req.user.role !== "Admin") {
        return res.status(403).json({ message: "Không có quyền xóa" });
      }

      await rating.destroy();
      res.status(200).json({ message: "Xóa đánh giá thành công" });
    } catch (error) {
      console.error("❌ Error deleteRating:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },
};
