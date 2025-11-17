// middlewares/roleCheck.js
const jwt = require("jsonwebtoken");
const { User } = require("../models");

/**
 * ✅ Kiểm tra người dùng đã đăng nhập hay chưa
 * Sử dụng ở các route cần xác thực (ví dụ: tạo công thức)
 */
const isAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Vui lòng đăng nhập để tiếp tục" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userDb = await User.findByPk(decoded.user_id);
    if (!userDb) {
      return res.status(401).json({ message: "Tài khoản không tồn tại hoặc đã bị xóa" });
    }

    // ⚡ GIỮ role từ token để không bị mất role admin
    req.user = {
      user_id: userDb.user_id,
      name: userDb.name,
      email: userDb.email,
      role: decoded.role ?? userDb.role, // ưu tiên role trong token
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};

/**
 * ✅ Chỉ Admin mới được truy cập
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Vui lòng đăng nhập" });
  }
  if (req.user.role.toLowerCase() !== "admin") {
    return res.status(403).json({ message: "Bạn không có quyền truy cập chức năng này" });
  }
  next();
};

/**
 * ✅ Chỉ chính chủ (chủ recipe) hoặc Admin mới được chỉnh sửa
 * (dùng cho update/delete công thức)
 */
const isOwnerOrAdmin = (getOwnerId) => {
  return async (req, res, next) => {
    try {
      const ownerId = await getOwnerId(req); // hàm callback để lấy owner_id từ DB
      if (req.user.role.toLowerCase() === "admin" || req.user.user_id === ownerId) {
        return next();
      }
      return res.status(403).json({ message: "Bạn không có quyền thao tác này" });
    } catch (error) {
      return res.status(500).json({ message: "Lỗi kiểm tra quyền", error: error.message });
    }
  };
};

module.exports = {
  isAuthenticated,
  isAdmin,
  isOwnerOrAdmin,
};
