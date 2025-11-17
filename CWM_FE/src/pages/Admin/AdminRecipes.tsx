import { useState, useEffect, useMemo } from "react";
import { Search, Clock, ChefHat } from "lucide-react";
import { recipeAPI } from "@/services/api";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type RecipeItem = {
  id: number;
  name: string;
  author: string;
  image: string;
  cookTime: number;
  difficulty: string;
  status: "Pending" | "Approved" | "Rejected";
};

export const AdminRecipes = () => {
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadRecipes();
  }, [statusFilter]);

  // 🔹 Load danh sách công thức (lọc theo status)
  const loadRecipes = async () => {
    setLoading(true);
    try {
      const res = await recipeAPI.getAll({
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      const data = res.data?.recipes ?? [];

      const mapped: RecipeItem[] = data.map((r: any) => ({
        id: r.recipe_id,
        name: r.title,
        author: r.User?.name || "Unknown",
        image: r.images?.[0] || "",
        cookTime: r.cooking_time ?? 0,
        difficulty: r.difficulty_level ?? "Dễ",
        status: r.status,
      }));

      setRecipes(mapped);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách công thức");
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Lọc theo từ khóa tìm kiếm
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return recipes.filter((r) => {
      const name = (r.name ?? "").toLowerCase();
      const author = (r.author ?? "").toLowerCase();
      return name.includes(term) || author.includes(term);
    });
  }, [recipes, search]);

  // 🔹 Cập nhật trạng thái công thức
  const handleStatusChange = async (id: number, newStatus: "Pending" | "Approved" | "Rejected") => {
    try {
      await recipeAPI.updateStatus(id, { status: newStatus });
      toast.success(`✅ Cập nhật trạng thái thành ${newStatus}`);
      setRecipes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error(err);
      toast.error("Cập nhật trạng thái thất bại");
    }
  };

  // 🔹 Hàm render badge trạng thái
  const renderStatusBadge = (status: string) => {
    const color =
      status === "Approved"
        ? "bg-green-100 text-green-700"
        : status === "Rejected"
        ? "bg-red-100 text-red-700"
        : "bg-yellow-100 text-yellow-700";
    const label =
      status === "Approved"
        ? "Đã duyệt"
        : status === "Rejected"
        ? "Từ chối"
        : "Chờ duyệt";

    return <Badge className={`${color} font-medium`}>{label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <h1 className="text-3xl font-bold">Quản lý công thức</h1>

          <div className="flex gap-3">
            {/* Bộ lọc trạng thái */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="Pending">Chờ duyệt</SelectItem>
                <SelectItem value="Approved">Đã duyệt</SelectItem>
                <SelectItem value="Rejected">Từ chối</SelectItem>
              </SelectContent>
            </Select>

            {/* Ô tìm kiếm */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm công thức..."
                className="pl-9 w-[220px]"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 mb-4 rounded">
            {error}
          </div>
        )}

        {/* List */}
        {loading ? (
          <p className="text-center text-gray-500">Đang tải...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Không có công thức nào.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((r) => (
              <Card
                key={r.id}
                className="relative group hover:shadow-lg transition cursor-pointer"
              >
                <Link to={`/admin/recipes/${r.id}`}>
                  <div className="h-48 bg-gray-100 overflow-hidden">
                    {r.image ? (
                      <img
                        src={r.image}
                        alt={r.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ChefHat className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold line-clamp-1">{r.name}</h3>
                      {renderStatusBadge(r.status)}
                    </div>
                    <p className="text-sm text-gray-600">👤 {r.author}</p>
                  </CardContent>
                </Link>

                <CardFooter className="flex justify-between items-center text-sm border-t p-4 text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {r.cookTime || 0} phút
                  </div>

                  <div className="flex items-center gap-1">
                    <ChefHat className="h-4 w-4" />
                    {r.difficulty}
                  </div>
                </CardFooter>

                {/* 🔄 Dropdown thay đổi trạng thái nhanh */}
                <div className="absolute top-2 right-2">
                  <Select
                    value={r.status}
                    onValueChange={(v) =>
                      handleStatusChange(
                        r.id,
                        v as "Pending" | "Approved" | "Rejected"
                      )
                    }
                  >
                    <SelectTrigger className="w-[110px] text-xs">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Chờ duyệt</SelectItem>
                      <SelectItem value="Approved">Đã duyệt</SelectItem>
                      <SelectItem value="Rejected">Từ chối</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRecipes;
