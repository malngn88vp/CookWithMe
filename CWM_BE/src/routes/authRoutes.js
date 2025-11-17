// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware'); // 👈 PHẢI có dòng này
const upload = require('../middlewares/upload'); // 👈 Thêm nếu chưa có

// 📌 Đăng ký
router.post('/register', authController.register);

// 📌 Đăng nhập
router.post('/login', authController.login);

router.put(
  '/update-avatar',
  authMiddleware,
  upload.single('avatar'),
  authController.updateAvatar
);

module.exports = router;
