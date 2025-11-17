# CookWithMe - Chia sẻ công thức nấu ăn

Website chia sẻ công thức nấu ăn với React + Vite + Tailwind CSS

## Tính năng

### Người dùng
- 🔐 Đăng ký / Đăng nhập
- 🏠 Trang chủ với danh sách công thức
- 🔍 Tìm kiếm công thức
- 📖 Chi tiết công thức với đánh giá & bình luận
- ➕ Thêm công thức mới
- ❤️ Yêu thích công thức
- 👤 Trang hồ sơ cá nhân
- 📅 Lập kế hoạch bữa ăn
- 🛒 Tự động tạo danh sách mua sắm

### Quản trị viên
- 📂 Quản lý danh mục
- 🥕 Quản lý nguyên liệu
- 👥 Quản lý người dùng

## Cài đặt

```sh
# Clone repository
git clone <YOUR_GIT_URL>

# Di chuyển vào thư mục
cd <YOUR_PROJECT_NAME>

# Cài đặt dependencies
npm i

# Chạy development server
npm run dev
```

## Backend API

Ứng dụng sử dụng các API endpoints sau (cần chạy backend riêng):

- **Auth**: `/api/auth/register`, `/api/auth/login`
- **Recipes**: `/api/recipes`
- **Categories**: `/api/categories`
- **Ingredients**: `/api/ingredients`
- **Ratings**: `/api/ratings`
- **Comments**: `/api/comments`
- **Favorites**: `/api/favorites`
- **Meal Plans**: `/api/meal-plans`
- **Shopping List**: `/api/shopping-list`

Backend mặc định chạy tại: `http://localhost:3000`

## Công nghệ

- React 18
- Vite
- TypeScript
- Tailwind CSS
- shadcn-ui components
- Axios
- React Router
- React Query

## Project info

**URL**: https://lovable.dev/projects/99c5c76e-78d3-41a5-b472-8f1f0c777610

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/99c5c76e-78d3-41a5-b472-8f1f0c777610) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/99c5c76e-78d3-41a5-b472-8f1f0c777610) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
