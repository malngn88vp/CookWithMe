'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Đặt tên biến cho chính xác
    const tableName = 'user'; // Giữ nguyên 'user' theo yêu cầu của bạn
    const enumType = 'role_type'; // Tên của kiểu ENUM trong Postgres

    // 🧹 2. Xóa ENUM cũ nếu tồn tại (để tránh xung đột khi chạy lại)
    // Dùng CASCADE để tự động xóa các phụ thuộc (như default value)
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumType}') THEN
          DROP TYPE ${enumType} CASCADE;
        END IF;
      END
      $$;
    `);

    // 🧱 3. Tạo lại ENUM với giá trị chữ thường
    await queryInterface.sequelize.query(`
      CREATE TYPE ${enumType} AS ENUM ('admin', 'user');
    `);

    // 🧩 4. Thêm cột 'role' NẾU NÓ CHƯA TỒN TẠI
    // Đây là bước quan trọng nhất để sửa lỗi "column ... does not exist"
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = '${tableName}' AND column_name = 'role'
        ) THEN
          -- Thêm cột 'role', dùng kiểu ENUM mới, và đặt giá trị mặc định
          ALTER TABLE "${tableName}" ADD COLUMN role ${enumType} NOT NULL DEFAULT 'user';
        END IF;
      END
      $$;
    `);

    // 👑 5. (Tùy chọn) Cập nhật tài khoản admin nếu cần
    await queryInterface.sequelize.query(`
      UPDATE "${tableName}" SET role = 'admin' WHERE email = 'admin@example.com';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Logic để hoàn tác (rollback)
    const tableName = 'user';
    const enumType = 'role_type';

    // 🗑️ 1. Xóa cột 'role'
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = '${tableName}' AND column_name = 'role'
        ) THEN
          ALTER TABLE "${tableName}" DROP COLUMN role;
        END IF;
      END
      $$;
    `);

    // 🗑️ 2. Xóa kiểu ENUM
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumType}') THEN
          DROP TYPE ${enumType};
        END IF;
      END
      $$;
    `);
  }
};