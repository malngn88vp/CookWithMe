
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { User } = require('../models');
const cloudinary = require('../config/cloudinary'); // ✅ thêm dòng này
require('dotenv').config();

// 🔐 Hàm tạo JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role.toLowerCase(),
    },
    process.env.JWT_SECRET || 'secret_key', // 🔑 đặt trong .env
    { expiresIn: '7d' }
  );
};

// 🧑‍💻 Đăng ký tài khoản
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Thiếu name bắt buộc' });
    }
    if (!email) {
      return res.status(400).json({ message: 'Thiếu email bắt buộc' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Thiếu password bắt buộc' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email đã tồn tại' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password_hash: hashedPassword,
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'Đăng ký thành công',
      user: {
        user_id: newUser.user_id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      token,
    });
  } catch (error) {
    console.error('❌ Lỗi đăng ký:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// 🔑 Đăng nhập
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: 'Đăng nhập thành công',
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('❌ Lỗi đăng nhập:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// 📸 Cập nhật avatar người dùng (upload lên Cloudinary)
exports.updateAvatar = async (req, res) => {
  try {
    const userId = req.user.user_id;

    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng tải lên file avatar.' });
    }

    // Upload ảnh lên Cloudinary
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: 'avatars',
      resource_type: 'image',
    });

    // Xóa file tạm sau khi upload thành công
    fs.unlinkSync(req.file.path);

    // Cập nhật URL mới vào DB
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

    user.avatar_url = uploadResult.secure_url;
    await user.save();

    return res.status(200).json({
      message: 'Cập nhật avatar thành công.',
      avatar_url: uploadResult.secure_url,
    });
  } catch (error) {
    console.error('❌ Lỗi cập nhật avatar:', error);
    return res.status(500).json({ message: 'Lỗi server khi cập nhật avatar.' });
  }
};
