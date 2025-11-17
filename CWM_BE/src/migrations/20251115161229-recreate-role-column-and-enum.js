'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = 'user';
    const enumType = 'role_type';

    // 🧹 1️⃣ Xóa ENUM cũ nếu tồn tại (tránh xung đột)
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumType}') THEN
          DROP TYPE ${enumType} CASCADE;
        END IF;
      END
      $$;
    `);

    // 🧱 2️⃣ Tạo lại ENUM role_type ('admin', 'user')
    await queryInterface.sequelize.query(`
      CREATE TYPE ${enumType} AS ENUM ('admin', 'user');
    `);

    // 🧩 3️⃣ Thêm lại cột role nếu chưa có
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = '${tableName}' AND column_name = 'role'
        ) THEN
          ALTER TABLE "${tableName}" ADD COLUMN role ${enumType} NOT NULL DEFAULT 'user';
        END IF;
      END
      $$;
    `);

    // 👑 4️⃣ Cập nhật tài khoản admin nếu có
    await queryInterface.sequelize.query(`
      UPDATE "${tableName}" SET role = 'admin' WHERE email = 'admin@example.com';
    `);
  },

  async down(queryInterface, Sequelize) {
    const tableName = 'user';
    const enumType = 'role_type';

    // 🗑️ Rollback: Xóa cột role và ENUM
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
