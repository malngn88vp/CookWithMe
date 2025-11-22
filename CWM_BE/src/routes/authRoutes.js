const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

// Đăng ký
router.post('/register', authController.register);

// Đăng nhập
router.post('/login', authController.login);

// Lấy thông tin user
router.get('/profile', authMiddleware, authController.getProfile);

// Cập nhật thông tin (name, email,…)
router.put('/update-profile', authMiddleware, authController.updateProfile);

// Cập nhật avatar
router.put(
  '/update-avatar',
  authMiddleware,
  upload.single('avatar'),
  authController.updateAvatar
);

// Đổi mật khẩu
router.put('/change-password', authMiddleware, authController.changePassword);


module.exports = router;
