import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { recipeAPI, categoryAPI, ingredientAPI } from "@/services/api";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Clock, Users, ChefHat, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Recipes = () => {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc
  const [searchName, setSearchName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [maxCookingTime, setMaxCookingTime] = useState<number | null>(null);

  const [showFilters, setShowFilters] = useState(false);

  const difficultyLevels = [
    { label: "Dễ", value: "easy" },
    { label: "Trung bình", value: "medium" },
    { label: "Khó", value: "hard" },
  ];

  // Gọi dữ liệu
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recipesRes, categoriesRes, ingredientsRes] = await Promise.all([
        recipeAPI.getAll(),
        categoryAPI.getAll(),
        ingredientAPI.getAll(),
      ]);

      setRecipes(recipesRes.data?.recipes || recipesRes.data || []);
      setCategories(categoriesRes.data?.categories || categoriesRes.data || []);
      setIngredients(ingredientsRes.data?.ingredients || ingredientsRes.data || []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  // Lọc công thức
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const matchesName = r.title?.toLowerCase().includes(searchName.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" ||
        r.categories?.some((c: any) => c.category_id === Number(selectedCategory));
      const matchesDifficulty =
        selectedDifficulty === "all" || r.difficulty_level === selectedDifficulty;
      const totalTime = (r.cooking_time || 0) + (r.prep_time || 0);
      const matchesTime = maxCookingTime ? totalTime <= maxCookingTime : true;
      return matchesName && matchesCategory && matchesDifficulty && matchesTime;
    });
  }, [recipes, searchName, selectedCategory, selectedDifficulty, maxCookingTime]);

  const clearFilters = () => {
    setSearchName("");
    setSelectedCategory("all");
    setSelectedDifficulty("all");
    setMaxCookingTime(null);
  };

  const activeFilters =
    (searchName ? 1 : 0) +
    (selectedCategory !== "all" ? 1 : 0) +
    (selectedDifficulty !== "all" ? 1 : 0) +
    (maxCookingTime ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-3">Tất cả công thức</h1>
          <p className="text-orange-100 text-lg">Tìm kiếm và lọc công thức bạn yêu thích</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* --- Sidebar Filters --- */}
        <div className={`lg:col-span-1 ${showFilters ? "block" : "hidden lg:block"}`}>
          <div className="bg-white p-6 rounded-xl shadow-md sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Bộ lọc</h2>
              {activeFilters > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {activeFilters > 0 && (
              <p className="text-xs text-gray-500 mb-4">
                {activeFilters} bộ lọc đang áp dụng
              </p>
            )}

            {/* Tìm kiếm tên */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Tên công thức</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Nhập tên món..."
                  className="pl-9"
                />
              </div>
            </div>

            {/* Danh mục */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Danh mục</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.category_id} value={cat.category_id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Độ khó */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Độ khó</label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn độ khó" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {difficultyLevels.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Thời gian nấu */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Thời gian nấu tối đa</label>
              <input
                type="range"
                min="0"
                max="240"
                step="15"
                value={maxCookingTime ?? 240}
                onChange={(e) =>
                  setMaxCookingTime(Number(e.target.value) === 240 ? null : Number(e.target.value))
                }
                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between mt-1 text-sm text-gray-600">
                <span>{maxCookingTime ? `Tối đa ${maxCookingTime} phút` : "Không giới hạn"}</span>
                {maxCookingTime && (
                  <button
                    onClick={() => setMaxCookingTime(null)}
                    className="text-xs text-orange-600 hover:text-orange-700"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- Recipes Grid --- */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-6 lg:hidden">
            <h2 className="text-lg font-bold text-gray-900">Kết quả ({filteredRecipes.length})</h2>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Bộ lọc</span>
            </Button>
          </div>

          <div className="hidden lg:block mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Kết quả ({filteredRecipes.length})
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <div className="h-48 bg-gray-200 animate-pulse" />
                  <CardContent className="p-4">
                    <div className="h-5 bg-gray-200 rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe) => (
                <Link key={recipe.recipe_id} to={`/recipes/${recipe.recipe_id}`}>
                  <Card className="group hover:shadow-lg transition-all">
                    <div className="h-48 bg-gray-100 overflow-hidden relative">
                      {recipe.images ? (
                        <img
                          src={
                            Array.isArray(recipe.images)
                              ? recipe.images[0]?.url || recipe.images[0]
                              : recipe.images
                          }
                          alt={recipe.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ChefHat className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                        {recipe.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{recipe.description}</p>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center text-sm text-gray-500 border-t p-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{(recipe.prep_time || 0) + (recipe.cooking_time || 0)} phút</span>
                      </div>
                      <div className="text-xs capitalize">
                        {difficultyLevels.find(d => d.value === recipe.difficulty_level)?.label}
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy công thức</h3>
              <p className="text-gray-600 mb-6">Thử thay đổi từ khóa hoặc bộ lọc</p>
              <Button onClick={clearFilters}>Xóa tất cả bộ lọc</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recipes;
