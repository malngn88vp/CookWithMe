// —— CODE ĐÃ ĐƯỢC CHỈNH GIAO DIỆN —— //

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { recipeAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ChefHat, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminRecipeDetail = () => {
  const { id } = useParams();
  const numericId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"Pending" | "Approved" | "Rejected" | "">("");
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (numericId) fetchRecipe();
  }, [numericId]);

  const fetchRecipe = async () => {
    try {
      const res = await recipeAPI.getById(numericId);
      setRecipe(res.data.recipe);
      setStatus(res.data.recipe.status);
    } catch (error) {
      toast.error("Không thể tải công thức");
      navigate("/admin/recipes");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!status || !["Approved", "Rejected", "Pending"].includes(status)) return;

    try {
      await recipeAPI.updateStatus(numericId, { status, reason: rejectReason });

      toast.success(
        status === "Approved"
          ? "🎉 Công thức đã được duyệt!"
          : status === "Rejected"
          ? "❌ Công thức đã bị từ chối!"
          : "🔄 Đã chuyển về trạng thái chờ duyệt."
      );

      navigate("/admin/recipes");
    } catch (error) {
      toast.error("Cập nhật trạng thái thất bại");
    }
  };

  // ————— Loading —————
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-96 w-96 animate-pulse rounded-lg bg-gray-200" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <ChefHat className="mb-4 h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-bold text-gray-700">Không tìm thấy công thức</h2>
      </div>
    );
  }

  const recipeImage = Array.isArray(recipe.images)
    ? recipe.images[0]
    : recipe.images;

  const statusColor =
    status === "Approved"
      ? "bg-green-100 text-green-700"
      : status === "Rejected"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-10">
        <div className="mx-auto max-w-5xl">

          {/* Ảnh chính */}
          <div className="relative mb-8 overflow-hidden rounded-2xl shadow-md">
            {recipeImage ? (
              <img
                src={recipeImage}
                alt={recipe.title}
                className="h-96 w-full object-cover transition-transform hover:scale-105 duration-500"
              />
            ) : (
              <div className="flex h-96 items-center justify-center bg-gray-100">
                <ChefHat className="h-24 w-24 text-gray-400" />
              </div>
            )}
          </div>

          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold mb-3">{recipe.title}</h1>
              <p className="text-gray-600 text-lg leading-relaxed mb-4">
                {recipe.description}
              </p>

              {/* Categories */}
              <div className="flex flex-wrap gap-2 mb-4">
                {recipe.categories?.map((cat: any) => (
                  <Badge key={cat.category_id} variant="secondary" className="px-3 py-1">
                    {cat.name}
                  </Badge>
                ))}
              </div>

              <p className="text-sm text-gray-600">
                👤 <b>Tác giả:</b> {recipe.User?.name}
              </p>

              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <Clock className="h-4 w-4" /> {recipe.cooking_time ?? 0} phút —{" "}
                {recipe.difficulty_level}
              </p>
            </div>

            {/* Panel duyệt */}
            {user?.role === "admin" && (
              <div className="bg-white border rounded-xl shadow-md p-5 w-[280px]">
                <h3 className="text-lg font-bold mb-3">Quản lý trạng thái</h3>

                <Select
                  value={status}
                  onValueChange={(v) =>
                    setStatus(v as "Pending" | "Approved" | "Rejected")
                  }
                >
                  <SelectTrigger className={`w-full mb-3 border ${statusColor}`}>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Chờ duyệt</SelectItem>
                    <SelectItem value="Approved">Đã duyệt</SelectItem>
                    <SelectItem value="Rejected">Từ chối</SelectItem>
                  </SelectContent>
                </Select>

                {status === "Rejected" && (
                  <Textarea
                    className="mb-3"
                    placeholder="Nhập lý do từ chối…"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                )}

                <Button className="w-full" onClick={handleStatusChange}>
                  {status === "Approved" ? (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  ) : status === "Rejected" ? (
                    <XCircle className="h-4 w-4 mr-2" />
                  ) : null}
                  Cập nhật trạng thái
                </Button>
              </div>
            )}
          </div>

          <Separator className="my-10" />

          {/* Nguyên liệu */}
          <Card className="mb-8 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Nguyên liệu</h2>

              {recipe.ingredients?.length ? (
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {recipe.ingredients.map((ing: any) => (
                    <li key={ing.ingredient_id}>
                      {ing.name} —{" "}
                      {(ing.RecipeIngredient?.quantity || 0)
                        .toString()
                        .replace(/\.0+$/, "")}{" "}
                      {ing.RecipeIngredient?.unit ?? ing.default_unit}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">Chưa có nguyên liệu</p>
              )}
            </CardContent>
          </Card>

          {/* Các bước thực hiện */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Cách làm</h2>

              {recipe.steps?.length ? (
                <div className="space-y-6">
                  {recipe.steps.map((step: any, index: number) => (
                    <div
                      key={index}
                      className="rounded-xl border p-5 shadow-sm bg-white hover:shadow-md transition-all"
                    >
                      <h3 className="font-semibold text-lg mb-2">Bước {index + 1}</h3>

                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {step.description || "Không có mô tả"}
                      </p>

                      {step.image_url && (
                        <img
                          src={step.image_url}
                          alt={`Bước ${index + 1}`}
                          className="mt-3 w-full max-w-md rounded-lg shadow-sm object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">Chưa có hướng dẫn</p>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default AdminRecipeDetail;
