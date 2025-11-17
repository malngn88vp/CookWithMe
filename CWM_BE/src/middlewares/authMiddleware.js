// src/middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // 🔑 Lấy token từ header Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Không có token, từ chối truy cập." });
  }

  // ✂️ Cắt bỏ 'Bearer ' để lấy token
  const token = authHeader.split(" ")[1];

  try {
    // ✅ Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");

    // 👤 Gán thông tin người dùng vào req để sử dụng ở controller
    req.user = decoded;

    console.log("✅ Xác thực thành công:", req.user); // 👉 Debug khi cần
    next();
  } catch (err) {
    console.error("❌ Lỗi xác thực JWT:", err.message);

    // Gửi lỗi cụ thể hơn để dễ debug
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token đã hết hạn. Vui lòng đăng nhập lại." });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token không hợp lệ." });
    }

    return res.status(401).json({ message: "Không xác thực được người dùng." });
  }
};
