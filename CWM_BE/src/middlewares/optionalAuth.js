// src/middlewares/optionalAuth.js
const jwt = require("jsonwebtoken");
const { User } = require("../models");

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = { role: "guest" }; // khách chưa đăng nhập
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.user_id);
    if (!user) {
      req.user = { role: "guest" };
      return next();
    }

    req.user = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role || "user",
    };
  } catch (error) {
    console.error("⚠️ optionalAuth error:", error.message);
    req.user = { role: "guest" };
  }

  next();
};
