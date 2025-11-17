// middleware/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 🧩 Đảm bảo thư mục uploads tồn tại
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 🧩 Cấu hình nơi lưu file tạm trước khi upload lên Cloudinary
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

module.exports = upload;
