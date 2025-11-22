// src/middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
const { User } = require("../models"); // 🔑 cần import User model
require("dotenv").config();

module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Không có token, từ chối truy cập." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");

    // 🔹 Lấy user từ DB để check trạng thái khóa
    const user = await User.findByPk(decoded.user_id);
    if (!user) return res.status(401).json({ message: "Người dùng không tồn tại" });

    if (user.is_locked) {
      return res.status(401).json({ message: "Tài khoản đã bị khóa" }); // 🔑 trả về lỗi để client logout
    }

    req.user = user; // gán user đầy đủ
    next();
  } catch (err) {
    console.error("❌ Lỗi xác thực JWT:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token đã hết hạn. Vui lòng đăng nhập lại." });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token không hợp lệ." });
    }

    return res.status(401).json({ message: "Không xác thực được người dùng." });
  }
};
