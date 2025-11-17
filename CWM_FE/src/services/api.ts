import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getProfile: () => api.get("/auth/profile"),
};

export const categoryAPI = {
  getAll: () => api.get("/categories"),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const ingredientAPI = {
  getAll: () => api.get("/ingredients"),
  getById: (id) => api.get(`/ingredients/${id}`),
  create: (data) => api.post("/ingredients", data),
  update: (id, data) => api.put(`/ingredients/${id}`, data),
  delete: (id) => api.delete(`/ingredients/${id}`),
};

export const recipeAPI = {
  getAll: (params?: any) => api.get("/recipes", { params }),
  getById: (id) => api.get(`/recipes/${id}`),
  create: (data) =>
    api.post("/recipes", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  update: (id, data) =>
    api.put(`/recipes/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  delete: (id) => api.delete(`/recipes/${id}`),

  // ✅ Thêm hàm mới cho admin duyệt hoặc từ chối công thức
  updateStatus: (
    id: number,
    data: { status: string; reason?: string }
  ) => api.patch(`/recipes/${id}/status`, data),
};


export const mealPlanAPI = {
  getAll: () => api.get("/meal-plans"),
  getById: (id) => api.get(`/meal-plans/${id}`),
  create: (data) => api.post("/meal-plans", data),
  update: (id, data) => api.put(`/meal-plans/${id}`, data),
  addRecipe: (id, recipeData) => api.post(`/meal-plans/${id}/recipes`, recipeData),
  removeRecipe: (id, recipeId) => api.delete(`/meal-plans/${id}/recipes/${recipeId}`),
  delete: (id) => api.delete(`/meal-plans/${id}`),
  getRecipes: (id: any) => axios.get(`/mealplans/${id}/recipes`),
};

export const ratingAPI = {
  createOrUpdate: (recipeId, data) => api.post(`/ratings/${recipeId}`, data),
  getByRecipe: (recipeId) => api.get(`/ratings/${recipeId}`),
  getAverage: (recipeId) => api.get(`/ratings/${recipeId}/average`),
  delete: (id) => api.delete(`/ratings/delete/${id}`),
  getByRecipeAndUser: (recipeId: number | string, userId: number | string) => api.get(`/ratings/${recipeId}/user/${userId}`),
};

export const commentAPI = {
  create: (recipeId, data) => api.post(`/comments/${recipeId}`, data),
  getByRecipe: (recipeId) => api.get(`/comments/${recipeId}`),
  delete: (id) => api.delete(`/comments/delete/${id}`),
};

export const favoriteAPI = {
  checkStatus: (recipeId: string | number) => api.get(`/favorites/check/${recipeId}`),
  add: (recipeId: string | number) => api.post(`/favorites/${recipeId}`),
  remove: (recipeId: string | number) => api.delete(`/favorites/${recipeId}`),
  getAll: () => api.get(`/favorites`),
};

export const shoppingListAPI = {
  get: (mealplan_id: string) => api.get(`/shopping-list/${mealplan_id}`),
  add: (data: any) => api.post(`/shopping-list`, data),
  toggle: (item_id: string) => api.patch(`/shopping-list/toggle/${item_id}`),
  delete: (item_id: string) => api.delete(`/shopping-list/${item_id}`),
  generate: (mealplan_id: string) => api.post(`/shopping-list/generate/${mealplan_id}`),
};

export { api };
