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
        : [];

      const ingredients = Array.isArray(ingredientsData?.data?.data)
        ? ingredientsData.data.data
        : [];

      const recipes = Array.isArray(recipesData?.data?.recipes)
        ? recipesData.data.recipes
        : [];

      setStats([
        {
          title: 'Tổng số danh mục',
          value: categories.length,
          icon: <List className="h-8 w-8" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        },
        {
          title: 'Tổng số nguyên liệu',
          value: ingredients.length,
          icon: <Package className="h-8 w-8" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        },
        {
          title: 'Tổng số công thức',
          value: recipes.length,
          icon: <UtensilsCrossed className="h-8 w-8" />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
        },
      ]);
    } catch (error) {
      console.error('Không thể tải dữ liệu thống kê:', error);
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

      {/* Thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} ${stat.color} p-4 rounded-xl`}>
                {stat.icon}
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-1 text-green-600 text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>Đang hoạt động</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Thao tác nhanh */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>

          <div className="space-y-3">
            <a
              href="/admin/recipes"
              className="flex items-center justify-between p-4 rounded-lg bg-green-50 hover:bg-green-100 transition cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <ChefHat className="h-6 w-6 text-green-600" />
                <span className="font-medium text-gray-900">Quản lý công thức</span>
              </div>
              <span className="text-green-600 text-lg">→</span>
            </a>

            <a
              href="/admin/categories"
              className="flex items-center justify-between p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <List className="h-6 w-6 text-blue-600" />
                <span className="font-medium text-gray-900">Quản lý danh mục</span>
              </div>
              <span className="text-blue-600 text-lg">→</span>
            </a>

            <a
              href="/admin/ingredients"
              className="flex items-center justify-between p-4 rounded-lg bg-green-50 hover:bg-green-100 transition cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <Package className="h-6 w-6 text-green-600" />
                <span className="font-medium text-gray-900">Quản lý nguyên liệu</span>
              </div>
              <span className="text-green-600 text-lg">→</span>
            </a>
          </div>
        </div>

        {/* Trạng thái hệ thống */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái hệ thống</h3>

          <div className="space-y-4">
            {[
              { label: 'Kết nối API', status: 'Hoạt động' },
              { label: 'Cơ sở dữ liệu', status: 'Đã kết nối' },
              { label: 'Quyền quản trị', status: 'Xác thực' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-gray-600">{item.label}</span>
                <span className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600 font-medium">{item.status}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Welcome */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Chào mừng đến trang Quản trị</h3>
        <p className="text-gray-600 text-sm">
          Hệ thống hỗ trợ bạn quản lý danh mục, nguyên liệu và công thức nấu ăn một cách hiệu quả.
        </p>
      </div>
    </div>
  );
};
