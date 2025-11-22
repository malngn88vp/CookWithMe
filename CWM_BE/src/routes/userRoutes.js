const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { isAuthenticated, isAdmin } = require("../middlewares/roleCheck");

// 🔹 Lấy danh sách user có warning_count >= 3
router.get("/warned", isAuthenticated, isAdmin, userController.getWarnedUsers);

// 🔹 Khóa tài khoản
router.patch("/:id/lock", isAuthenticated, isAdmin, userController.lockUser);

// 🔹 Mở khóa tài khoản
router.patch("/:id/unlock", isAuthenticated, isAdmin, userController.unlockUser);

module.exports = router;
