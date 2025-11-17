const app = require("./app");
const sequelize = require("./config/db");

const PORT = process.env.PORT || 5000;

sequelize.sync().then(() => {
  console.log("✅ Database connected");
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
