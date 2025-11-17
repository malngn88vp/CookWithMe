// routes/comment.routes.js
const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const { isAuthenticated } = require("../middlewares/roleCheck");

// 💬 Thêm bình luận
router.post("/:recipeId", isAuthenticated, commentController.createComment);

// 📜 Lấy danh sách bình luận
router.get("/:recipeId", commentController.getCommentsByRecipe);

// ✏️ Sửa bình luận
router.put("/:id", isAuthenticated, commentController.updateComment);

// 🗑️ Xóa bình luận
router.delete("/:id", isAuthenticated, commentController.deleteComment);

module.exports = router;
