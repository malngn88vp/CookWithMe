import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import Index from "./pages/Index";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import RecipeDetail from "./pages/RecipeDetail";
import Recipes from "./pages/Recipes";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import AddRecipe from "./pages/AddRecipe";
import MealPlans from "./pages/MealPlans";
import MealPlanDetail from "./pages/MealPlanDetail";
import { AdminDashboard } from "./pages/Admin/Dashboard";
import { AdminCategories } from "./pages/Admin/AdminCategories";
import { AdminIngredients } from "./pages/Admin/AdminIngredients";
import { AdminRecipes } from "./pages/Admin/AdminRecipes";
import { AdminLayout } from "./pages/Admin/AdminLayout";
import NotFound from "./pages/NotFound";
import EditRecipe from "@/pages/EditRecipe";

import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRecipeDetail from "./pages/Admin/AdminRecipeDetail";
import { AdminUser } from "./pages/Admin/AdminUser";
import ChangePassword from "./pages/Auth/ChangePassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* 🌐 Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/recipes/:id" element={<RecipeDetail />} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
            {/* 🔒 User routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <ProtectedRoute>
                  <Favorites />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meal-plans"
              element={
                <ProtectedRoute>
                  <MealPlans />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meal-plans/:id"
              element={
                <ProtectedRoute>
                  <MealPlanDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recipes/new"
              element={
                <ProtectedRoute>
                  <AddRecipe />
                </ProtectedRoute>
              }
            />
            <Route path="/recipes/:id/edit" element={
              <ProtectedRoute>
                <EditRecipe />
              </ProtectedRoute>
            } />

            {/* 🛡️ Admin routes (bọc bởi AdminLayout) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminLayout /> {/* 👈 Sidebar + Topbar */}
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="ingredients" element={<AdminIngredients />} />
              <Route path="recipes" element={<AdminRecipes />} />
              <Route path="recipes/:id" element={<AdminRecipeDetail />} />
              <Route path="users" element={<AdminUser />} />
            </Route>

            {/* ❌ Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
