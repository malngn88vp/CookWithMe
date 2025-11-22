const { User } = require("../models");
const { Op } = require("sequelize");

module.exports = {
  getWarnedUsers: async (req, res) => {
    try {
      const users = await User.findAll({
        where: { warning_count: { [Op.gte]: 3 } },
        attributes: ["user_id", "name", "email", "role", "warning_count", "is_locked"]
      });
      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  lockUser: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: "User không tồn tại" });
      user.is_locked = true;
      await user.save();
      res.json({ message: "Đã khóa tài khoản" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  unlockUser: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: "User không tồn tại" });
      user.is_locked = false;
      await user.save();
      res.json({ message: "Đã mở khóa tài khoản" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },
};
