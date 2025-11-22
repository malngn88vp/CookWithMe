import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { recipeAPI, commentAPI, ratingAPI, favoriteAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Star, Heart, ChefHat, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

const RecipeDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(0);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  // ⭐ Nutrition State
  const [nutrition, setNutrition] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchRecipe();
      fetchComments();
      checkFavoriteStatus();
      fetchNutrition(); // ⭐ NEW
    }
  }, [id, user]);

  const fetchRecipe = async () => {
    try {
      const response = await recipeAPI.getById(id!);
      setRecipe(response.data.recipe);

      if (user) fetchUserRating(response.data.recipe.recipe_id);
      fetchAverageRating(response.data.recipe.recipe_id);
    } catch (error) {
      toast.error("Không thể tải công thức");
    } finally {
      setLoading(false);
    }
  };

  const fetchNutrition = async () => {
    try {
      const res = await recipeAPI.getNutrition(id!);

      const nutri = res.data;

      setNutrition({
        calories: nutri?.per_serving?.calories ?? 0,
        protein: nutri?.per_serving?.protein ?? 0,
        carbs: nutri?.per_serving?.carbs ?? 0,
        fat: nutri?.per_serving?.fat ?? 0,
        servings: nutri?.servings ?? 1,
        total: nutri?.total ?? null
      });

    } catch (err) {
      console.error("Lỗi tải dinh dưỡng:", err);
    }
  };

  const fetchUserRating = async (recipeId: number) => {
    if (!user) return;
    try {
      const res = await ratingAPI.getByRecipeAndUser(recipeId, user.user_id);
      setRating(res.data?.stars ?? 0);
    } catch (error: any) {
      if (error.response?.status === 404) setRating(0);
    }
  };

  const fetchAverageRating = async (recipeId: number) => {
    try {
      const res = await ratingAPI.getAverage(recipeId);
      setAvgRating(res.data.avgRating || 0);
      setRatingCount(res.data.total || 0);
    } catch {}
  };

  const fetchComments = async () => {
    try {
      const response = await commentAPI.getByRecipe(id!);
      setComments(response.data);
    } catch {}
  };

  const checkFavoriteStatus = async () => {
    if (!user) return;
    try {
      const response = await favoriteAPI.checkStatus(id!);
      setIsFavorite(response.data.isFavorite);
    } catch {}
  };

  const handleToggleFavorite = async () => {
    if (!user) return navigate("/auth/login");
    try {
      if (isFavorite) {
        await favoriteAPI.remove(id!);
        toast.success("Đã xóa khỏi yêu thích");
      } else {
        await favoriteAPI.add(id!);
        toast.success("Đã thêm vào yêu thích");
      }
      setIsFavorite(!isFavorite);
    } catch {
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleRating = async (value: number) => {
    if (!user || !recipe) {
      toast.error("Vui lòng đăng nhập để đánh giá");
      return;
    }

    try {
      await ratingAPI.createOrUpdate(recipe.recipe_id, {
        user_id: user.user_id,
        recipe_id: recipe.recipe_id,
        stars: value,
      });

      fetchUserRating(recipe.recipe_id);
      fetchAverageRating(recipe.recipe_id);
      toast.success("Đã đánh giá!");
    } catch {
      toast.error("Không thể gửi đánh giá");
    }
  };

  const handleAddComment = async () => {
    if (!user) return navigate("/auth/login");
    if (!newComment.trim()) return;

    try {
      await commentAPI.create(id!, { content: newComment });
      setNewComment("");
      fetchComments();
      toast.success("Đã thêm bình luận");
    } catch {
      toast.error("Không thể thêm bình luận");
    }
  };

  const handleDeleteRecipe = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa công thức này?")) return;

    try {
      await recipeAPI.delete(id!);
      toast.success("Đã xóa công thức");
      navigate("/");
    } catch {
      toast.error("Không thể xóa công thức");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="h-96 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <ChefHat className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-bold">Không tìm thấy công thức</h2>
        </div>
      </div>
    );
  }

  const recipeImage = Array.isArray(recipe.images)
    ? recipe.images[0]
    : recipe.images;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">

          {/* Ảnh */}
          <div className="relative mb-8 overflow-hidden rounded-2xl">
            {recipeImage ? (
              <img src={recipeImage} alt={recipe.title} className="h-96 w-full object-cover" />
            ) : (
              <div className="flex h-96 items-center justify-center bg-muted">
                <ChefHat className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mb-8">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h1 className="mb-2 text-4xl font-bold">{recipe.title}</h1>
                <p className="text-lg text-muted-foreground">{recipe.description}</p>

                {avgRating && avgRating > 0 ? (
                  <div className="mt-3 text-lg font-medium text-yellow-600">
                    Rating: <span className="font-bold">{avgRating.toFixed(1)} / 5</span> ({ratingCount} đánh giá)
                  </div>
                ) : (
                  <div className="text-muted-foreground mt-3">Chưa có đánh giá</div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {recipe.categories?.map((cat: any) => (
                    <Badge key={cat.category_id} variant="secondary">{cat.name}</Badge>
                  ))}
                </div>

                <p className="mt-4 text-sm text-muted-foreground">
                  👨‍🍳 Tác giả: <span className="font-semibold">{recipe.User?.name}</span>
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  variant={isFavorite ? "default" : "outline"}
                  size="icon"
                  className="rounded-full"
                  onClick={handleToggleFavorite}
                >
                  <Heart className={isFavorite ? "fill-current" : ""} />
                </Button>

                {user?.user_id === recipe.user_id && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full"
                      onClick={() => navigate(`/recipes/${recipe.recipe_id}/edit`)}
                    >
                      <Pencil className="h-5 w-5" />
                    </Button>

                    <Button
                      variant="destructive"
                      size="icon"
                      className="rounded-full"
                      onClick={handleDeleteRecipe}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Nguyên liệu */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="mb-4 text-2xl font-bold">Nguyên liệu</h2>
              {recipe.ingredients?.length ? (
                <ul className="list-disc pl-5">
                  {recipe.ingredients.map((ing: any) => (
                    <li key={ing.ingredient_id}>
                      {ing.name} — {parseFloat(ing.RecipeIngredient?.quantity || 0).toString().replace(/\.0+$/, "")}{" "}
                      {ing.RecipeIngredient?.unit ?? ing.default_unit}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground italic">Chưa có nguyên liệu</p>
              )}
            </CardContent>
          </Card>

          {/* ⭐ Nutrition (NEW) */}
          {nutrition && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="mb-4 text-2xl font-bold">Giá trị dinh dưỡng / khẩu phần</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">

                  <div className="p-4 border rounded-xl bg-muted">
                    <p className="text-2xl font-bold text-primary">
                      {Math.round(nutrition.calories)}
                    </p>
                    <p className="text-sm text-muted-foreground">Calories</p>
                  </div>

                  <div className="p-4 border rounded-xl bg-muted">
                    <p className="text-2xl font-bold text-blue-600">
                      {Number(nutrition.protein).toFixed(1)} g
                    </p>
                    <p className="text-sm text-muted-foreground">Protein</p>
                  </div>

                  <div className="p-4 border rounded-xl bg-muted">
                    <p className="text-2xl font-bold text-orange-600">
                      {Number(nutrition.carbs).toFixed(1)} g
                    </p>
                    <p className="text-sm text-muted-foreground">Carbs</p>
                  </div>

                  <div className="p-4 border rounded-xl bg-muted">
                    <p className="text-2xl font-bold text-yellow-600">
                      {Number(nutrition.fat).toFixed(1)} g
                    </p>
                    <p className="text-sm text-muted-foreground">Fat</p>
                  </div>

                </div>
              </CardContent>
            </Card>
          )}

          {/* Cách làm */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="mb-4 text-2xl font-bold">Cách làm</h2>

              {Array.isArray(recipe.steps) && recipe.steps.length > 0 ? (
                <div className="space-y-6">
                  {recipe.steps.map((step: any, index: number) => (
                    <div key={index} className="rounded-xl border p-4 shadow-sm hover:shadow-md transition-all">
                      <h3 className="font-semibold text-lg mb-2">
                        Bước {index + 1}
                      </h3>

                      <p className="leading-relaxed whitespace-pre-line">
                        {typeof step === "string"
                          ? step
                          : step.description || "Không có mô tả"}
                      </p>

                      {step.image_url && (
                        <img
                          src={step.image_url}
                          alt={`Bước ${index + 1}`}
                          className="mt-3 w-full max-w-md rounded-lg object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">Chưa có hướng dẫn</p>
              )}
            </CardContent>
          </Card>

          {/* Rating của user */}
          {user && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h3 className="mb-4 text-xl font-bold">Đánh giá của bạn</h3>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button key={value} onClick={() => handleRating(value)} className="transition-transform hover:scale-110">
                      <Star
                        className={`h-8 w-8 ${
                          value <= rating ? "fill-accent text-accent" : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bình luận */}
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-xl font-bold">Bình luận</h3>

              {user && (
                <div className="mb-6 space-y-2">
                  <Textarea
                    placeholder="Viết bình luận..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <Button onClick={handleAddComment}>Gửi</Button>
                </div>
              )}

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.comment_id}
                    className="flex gap-4 rounded-lg border p-4 items-start"
                  >
                    <img
                      src={
                        comment.user?.avatar_url ||
                        "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                      }
                      alt={comment.user?.name || "avatar"}
                      className="h-10 w-10 rounded-full object-cover"
                    />

                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-semibold">{comment.user?.name ?? "Người dùng"}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;
