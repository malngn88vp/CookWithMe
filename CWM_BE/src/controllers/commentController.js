const { Comment, Recipe, User } = require("../models");
const badWords = require("../utils/badWords");

module.exports = {
  // 💬 Thêm bình luận
  createComment: async (req, res) => {
    try {
      const { content } = req.body;
      const recipeId = req.params.recipeId;
      const userId = req.user.user_id;

      if (!content?.trim()) {
        return res.status(400).json({ message: "Nội dung bình luận không được để trống" });
      }

      const user = await User.findByPk(userId);
      const containsBadWord = badWords.some(word =>
        content.toLowerCase().includes(word.toLowerCase())
      );

      if (containsBadWord) {
        // tăng warning_count
        user.warning_count += 1;
        await user.save();

        // Cảnh báo user, không tự động khóa
        const messages = [
          "Cảnh báo lần 1: Bình luận chứa từ ngữ không phù hợp và bị từ chối.",
          "Cảnh báo lần 2: Nếu tiếp tục vi phạm, admin sẽ xem xét khóa tài khoản."
        ];

        const warningMessage = messages[user.warning_count - 1] || 
          "Cảnh báo: Vi phạm từ ngữ không phù hợp.";

        return res.status(400).json({
          warning: true,
          message: warningMessage
        });
      }

      const recipe = await Recipe.findByPk(recipeId);
      if (!recipe) {
        return res.status(404).json({ message: "Công thức không tồn tại" });
      }

      const comment = await Comment.create({
        user_id: userId,
        recipe_id: recipeId,
        content,
      });

      res.status(201).json({ message: "Đã thêm bình luận", comment });
    } catch (error) {
      console.error("❌ Error createComment:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  // 📜 Lấy danh sách bình luận
  getCommentsByRecipe: async (req, res) => {
    try {
      const recipeId = req.params.recipeId;
      const comments = await Comment.findAll({
        where: { recipe_id: recipeId },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["user_id", "name", "avatar_url", "warning_count"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      res.status(200).json(comments);
    } catch (error) {
      console.error("❌ Error getCommentsByRecipe:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  // ✏️ Sửa bình luận
  updateComment: async (req, res) => {
    try {
      const commentId = req.params.id;
      const { content } = req.body;
      const userId = req.user.user_id;

      const comment = await Comment.findByPk(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Bình luận không tồn tại" });
      }

      if (comment.user_id !== userId && req.user.role !== "Admin") {
        return res.status(403).json({ message: "Không có quyền sửa" });
      }

      comment.content = content;
      await comment.save();
      res.status(200).json({ message: "Cập nhật bình luận thành công", comment });
    } catch (error) {
      console.error("❌ Error updateComment:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  // 🗑️ Xóa bình luận
  deleteComment: async (req, res) => {
    try {
      const commentId = req.params.id;
      const userId = req.user.user_id;

      const comment = await Comment.findByPk(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Bình luận không tồn tại" });
      }

      if (comment.user_id !== userId && req.user.role !== "Admin") {
        return res.status(403).json({ message: "Không có quyền xóa" });
      }

      await comment.destroy();
      res.status(200).json({ message: "Xóa bình luận thành công" });
    } catch (error) {
      console.error("❌ Error deleteComment:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },
};
