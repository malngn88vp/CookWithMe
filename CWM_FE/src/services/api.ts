import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 (token expired or user locked)
api.interceptors.response.use(
  (res) => res,

  (error) => {
    const { response } = error;

    if (response?.status === 401) {
      const msg = response.data?.message;

      if (msg === "Token đã hết hạn. Vui lòng đăng nhập lại." ||
          msg === "Tài khoản đã bị khóa") {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        alert(msg);

        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  }
);

// ====================== AUTH API ======================
export const authAPI = {
  register: (data: any) => api.post("/auth/register", data),
  login: (data: any) => api.post("/auth/login", data),
  getProfile: () => api.get("/auth/profile"),
};

// ===================== User API =====================
export const userAPI = {
  getWarnedUsers: async () => {
    const res = await api.get("/users/warned");
    return res.data;
  },

  lockUser: async (userId: number) => {
    const res = await api.patch(`/users/${userId}/lock`);
    return res.data;
  },

  unlockUser: async (userId: number) => {
    const res = await api.patch(`/users/${userId}/unlock`);
    return res.data;
  },
};

// ===================== Category API =====================
export const categoryAPI = {
  getAll: () => api.get("/categories"),
  getById: (id: number | string) => api.get(`/categories/${id}`),
  create: (data: any) => api.post("/categories", data),
  update: (id: number | string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: number | string) => api.delete(`/categories/${id}`),
};

// ===================== Ingredient API =====================
export const ingredientAPI = {
  getAll: () => api.get("/ingredients"),
  getById: (id: number | string) => api.get(`/ingredients/${id}`),
  create: (data: any) => api.post("/ingredients", data),
  update: (id: number | string, data: any) => api.put(`/ingredients/${id}`, data),
  delete: (id: number | string) => api.delete(`/ingredients/${id}`),
};

// ===================== Recipe API =====================
export const recipeAPI = {
  getAll: (params?: any) => api.get("/recipes", { params }),
  getById: (id: number | string) => api.get(`/recipes/${id}`),
  getNutrition: (id: number | string) => api.get(`/recipes/${id}/nutrition`),
  create: (data: any) =>
    api.post("/recipes", data, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id: number | string, data: any) =>
    api.put(`/recipes/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } }),
  delete: (id: number | string) => api.delete(`/recipes/${id}`),
  updateStatus: (id: number, data: { status: string; reason?: string }) =>
    api.patch(`/recipes/${id}/status`, data),
};

// ===================== Meal Plan API =====================
export const mealPlanAPI = {
  getAll: () => api.get("/meal-plans"),
  getById: (id: number | string) => api.get(`/meal-plans/${id}`),
  create: (data: any) => api.post("/meal-plans", data),
  suggest: (data) => api.post("/meal-plans/suggest", data),
  update: (id: number | string, data: any) => api.put(`/meal-plans/${id}`, data),
  addRecipe: (id: number | string, recipeData: any) => api.post(`/meal-plans/${id}/recipes`, recipeData),
  removeRecipe: (id: number | string, recipeId: number) => api.delete(`/meal-plans/${id}/recipes/${recipeId}`),
  delete: (id: number | string) => api.delete(`/meal-plans/${id}`),
  getRecipes: (id: number | string) => api.get(`/mealplans/${id}/recipes`),
  removeRecipeFull: (id: number | string, body: any) =>
  api.delete(`/meal-plans/${id}/recipes`, { data: body }),
};

// ===================== Rating API =====================
export const ratingAPI = {
  createOrUpdate: (recipeId: number | string, data: any) => api.post(`/ratings/${recipeId}`, data),
  getByRecipe: (recipeId: number | string) => api.get(`/ratings/${recipeId}`),
  getAverage: (recipeId: number | string) => api.get(`/ratings/${recipeId}/average`),
  delete: (id: number | string) => api.delete(`/ratings/delete/${id}`),
  getByRecipeAndUser: (recipeId: number | string, userId: number | string) =>
    api.get(`/ratings/${recipeId}/user/${userId}`),
};

// ===================== Comment API =====================
export const commentAPI = {
  create: (recipeId: number | string, data: any) => api.post(`/comments/${recipeId}`, data),
  getByRecipe: (recipeId: number | string) => api.get(`/comments/${recipeId}`),
  delete: (id: number | string) => api.delete(`/comments/delete/${id}`),
};

// ===================== Favorite API =====================
export const favoriteAPI = {
  checkStatus: (recipeId: number | string) => api.get(`/favorites/check/${recipeId}`),
  add: (recipeId: number | string) => api.post(`/favorites/${recipeId}`),
  remove: (recipeId: number | string) => api.delete(`/favorites/${recipeId}`),
  getAll: () => api.get(`/favorites`),
};

// ===================== Shopping List API =====================
export const shoppingListAPI = {
  get: (mealplan_id: string) => api.get(`/shopping-list/${mealplan_id}`),
  add: (data: any) => api.post(`/shopping-list`, data),
  toggle: (item_id: string) => api.patch(`/shopping-list/toggle/${item_id}`),
  delete: (item_id: string) => api.delete(`/shopping-list/${item_id}`),
  generate: (mealplan_id: string) => api.post(`/shopping-list/generate/${mealplan_id}`),
};

export { api };
