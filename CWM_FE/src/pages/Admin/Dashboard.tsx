import { useState, useEffect } from 'react';
import { Package, List, UtensilsCrossed, TrendingUp, ChefHat } from 'lucide-react';
import { categoryAPI, ingredientAPI, recipeAPI } from '../../services/api';

interface StatCard {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<StatCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [categoriesData, ingredientsData, recipesData] = await Promise.all([
        categoryAPI.getAll(),
        ingredientAPI.getAll(),
        recipeAPI.getAll(),
      ]);

      const categories = Array.isArray(categoriesData?.data)
        ? categoriesData.data
        : Array.isArray(categoriesData)
        ? categoriesData
        : [];

      const ingredients = Array.isArray(ingredientsData?.data?.data)
        ? ingredientsData.data.data
        : [];

      const recipes =Array.isArray(recipesData?.data?.recipes) 
        ? recipesData.data.recipes : [];

      setStats([
        {
          title: 'Total Categories',
          value: categories.length,
          icon: <List className="h-8 w-8" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
        },
        {
          title: 'Total Ingredients',
          value: ingredients.length,
          icon: <Package className="h-8 w-8" />,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
        },
        {
          title: 'Total Recipes',
          value: recipes.length,
          icon: <UtensilsCrossed className="h-8 w-8" />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      {/* --- Thống kê tổng quan --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} ${stat.color} p-4 rounded-lg`}>
                {stat.icon}
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-1 text-green-600 text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>Active</span>
            </div>
          </div>
        ))}
      </div>

      {/* --- Quick Actions & System Status --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a
              href="/admin/recipes"
              className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <ChefHat className="h-6 w-6 text-green-600" />
                <span className="font-medium text-gray-900">Manage Recipes</span>
              </div>
              <span className="text-green-600">→</span>
            </a>
            <a
              href="/admin/categories"
              className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <List className="h-6 w-6 text-blue-600" />
                <span className="font-medium text-gray-900">Manage Categories</span>
              </div>
              <span className="text-blue-600">→</span>
            </a>
            <a
              href="/admin/ingredients"
              className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <Package className="h-6 w-6 text-green-600" />
                <span className="font-medium text-gray-900">Manage Ingredients</span>
              </div>
              <span className="text-green-600">→</span>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">API Connection</span>
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600">Active</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database Status</span>
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600">Connected</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Admin Access</span>
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600">Verified</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Welcome Section --- */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 p-6">
        <h3 className="font-bold text-gray-900 mb-2">Welcome to Admin Dashboard</h3>
        <p className="text-gray-600 text-sm">
          Manage your recipe sharing platform efficiently. Use the menu to navigate
          through categories, ingredients, and other administrative features.
        </p>
      </div>
    </div>
  );
};
