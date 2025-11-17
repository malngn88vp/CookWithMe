import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { recipeAPI, categoryAPI, ingredientAPI } from "@/services/api";
import Navbar from "@/components/Navbar";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface StepType {
  description: string;
  image_url?: string;
}

interface IngredientType {
  ingredient_id: string;
  quantity: string;
  unit: string;
}

const EditRecipe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    cooking_time: "",
    servings: "",
    difficulty_level: "medium",
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<IngredientType[]>([
    { ingredient_id: "", quantity: "", unit: "" },
  ]);

  const [steps, setSteps] = useState<StepType[]>([{ description: "", image_url: "" }]);
  const [stepImages, setStepImages] = useState<(File | null)[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // ======================= FETCH CATEGORY + INGREDIENT ======================
  useEffect(() => {
    if (!user) {
      navigate("/auth/login");
      return;
    }
    fetchCategories();
    fetchIngredients();
  }, [user]);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data || []);
    } catch {
      toast.error("Không thể tải danh mục");
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await ingredientAPI.getAll();
      setAvailableIngredients(response.data.data || []);
    } catch {
      toast.error("Không thể tải nguyên liệu");
    }
  };

  // ======================= FETCH RECIPE ======================
  useEffect(() => {
    if (id) fetchRecipe();
  }, [id]);

  const fetchRecipe = async () => {
    try {
      const res = await recipeAPI.getById(id!);
      const recipe = res.data.recipe;

      setFormData({
        title: recipe.title,
        description: recipe.description,
        cooking_time: recipe.cooking_time || "",
        servings: recipe.servings || "",
        difficulty_level: recipe.difficulty_level || "medium",
      });

      setSelectedCategories(
        recipe.categories?.map((c: any) => c.category_id.toString()) || []
      );

      setIngredients(
        recipe.ingredients?.map((ing: any) => ({
          ingredient_id: ing.ingredient_id.toString(),
          quantity: ing.RecipeIngredient?.quantity || "",
          unit: ing.RecipeIngredient?.unit || ing.default_unit || "",
        })) || [{ ingredient_id: "", quantity: "", unit: "" }]
      );

      setSteps(
        recipe.steps?.map((s: any) => ({
          description: s.description || "",
          image_url: s.image_url || "",
        })) || [{ description: "", image_url: "" }]
      );

      setStepImages(recipe.steps?.map(() => null) || []);
    } catch (error) {
      console.error("❌ Lỗi khi tải công thức:", error);
      toast.error("Không thể tải công thức");
    }
  };

  // ======================= INGREDIENT HANDLER ======================
  const handleIngredientChange = (index: number, field: string, value: string) => {
    const newIngredients = [...ingredients];
    if (field === "ingredient_id") {
      const selected = availableIngredients.find(
        (ing) => ing.ingredient_id.toString() === value
      );
      newIngredients[index] = {
        ...newIngredients[index],
        ingredient_id: value,
        unit: selected?.default_unit || newIngredients[index].unit,
      };
    } else {
      newIngredients[index] = { ...newIngredients[index], [field]: value };
    }
    setIngredients(newIngredients);
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { ingredient_id: "", quantity: "", unit: "" }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // ======================= STEP HANDLER ======================
  const handleStepChange = (index: number, value: string) => {
    const updated = [...steps];
    updated[index].description = value;
    setSteps(updated);
  };

  const handleAddStep = () => {
    setSteps([...steps, { description: "", image_url: "" }]);
    setStepImages([...stepImages, null]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
    setStepImages(stepImages.filter((_, i) => i !== index));
  };

  const handleStepImage = (index: number, file: File | null) => {
    const files = [...stepImages];
    files[index] = file;
    setStepImages(files);
  };

  // ======================= SUBMIT ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validIngredients = ingredients.filter(
        (ing) => ing.ingredient_id && ing.quantity && ing.unit
      );

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("cooking_time", formData.cooking_time);
      formDataToSend.append("servings", formData.servings);
      formDataToSend.append("difficulty_level", formData.difficulty_level);
      formDataToSend.append("category_ids", JSON.stringify(selectedCategories));
      formDataToSend.append("ingredients", JSON.stringify(validIngredients));

      // ================= FORMAT STEPS =================
      const formattedSteps = steps.map((s, index) => ({
        order: index + 1,
        description: s.description,
        image_url: stepImages[index]
          ? null
          : s.image_url
          ? s.image_url
          : null,
      }));

      formDataToSend.append("steps", JSON.stringify(formattedSteps));

      // Append step images mới
      stepImages.forEach((file) => {
        if (file) formDataToSend.append("stepImages", file);
      });

      if (imageFile) formDataToSend.append("images", imageFile);

      await recipeAPI.update(id!, formDataToSend);

      toast.success("Cập nhật công thức thành công!");
      navigate(`/recipes/${id}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Không thể cập nhật công thức");
    } finally {
      setLoading(false);
    }
  };

  // ======================= RENDER ======================
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Chỉnh sửa công thức</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* THÔNG TIN CƠ BẢN */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Tên công thức *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              {/* DANH MỤC */}
              <div>
                <Label>Danh mục *</Label>
                <div className="border rounded-md p-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedCategories.map((id) => {
                      const cat = categories.find((c) => c.category_id.toString() === id);
                      return (
                        <span
                          key={id}
                          className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm flex items-center gap-1"
                        >
                          {cat?.name}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedCategories(selectedCategories.filter((x) => x !== id))
                            }
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                  <Select
                    onValueChange={(value) => {
                      if (!selectedCategories.includes(value)) {
                        setSelectedCategories([...selectedCategories, value]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Thêm danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.category_id} value={cat.category_id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ĐỘ KHÓ, THỜI GIAN, KHẨU PHẦN */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Độ khó</Label>
                  <Select
                    value={formData.difficulty_level}
                    onValueChange={(value) =>
                      setFormData({ ...formData, difficulty_level: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Dễ</SelectItem>
                      <SelectItem value="medium">Trung bình</SelectItem>
                      <SelectItem value="hard">Khó</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Thời gian (phút) *</Label>
                  <Input
                    type="number"
                    value={formData.cooking_time}
                    onChange={(e) =>
                      setFormData({ ...formData, cooking_time: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Khẩu phần *</Label>
                  <Input
                    type="number"
                    value={formData.servings}
                    onChange={(e) =>
                      setFormData({ ...formData, servings: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* ẢNH ĐẠI DIỆN */}
              <div>
                <Label htmlFor="image">Ảnh đại diện</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </div>
            </CardContent>
          </Card>

          {/* NGUYÊN LIỆU */}
          <Card>
            <CardHeader>
              <CardTitle>Nguyên liệu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2">
                  <Select
                    value={ing.ingredient_id}
                    onValueChange={(value) =>
                      handleIngredientChange(index, "ingredient_id", value)
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Chọn nguyên liệu" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableIngredients.map((ingredient) => (
                        <SelectItem
                          key={ingredient.ingredient_id}
                          value={ingredient.ingredient_id.toString()}
                        >
                          {ingredient.name}{" "}
                          {ingredient.default_unit && `(${ingredient.default_unit})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Số lượng"
                    className="w-24"
                    value={ing.quantity}
                    onChange={(e) =>
                      handleIngredientChange(index, "quantity", e.target.value)
                    }
                  />
                  <Input
                    placeholder="Đơn vị"
                    className="w-24"
                    value={ing.unit}
                    onChange={(e) =>
                      handleIngredientChange(index, "unit", e.target.value)
                    }
                  />

                  {ingredients.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveIngredient(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button type="button" variant="outline" onClick={handleAddIngredient}>
                <Plus className="mr-2 h-4 w-4" /> Thêm nguyên liệu
              </Button>
            </CardContent>
          </Card>

          {/* CÁC BƯỚC */}
          <Card>
            <CardHeader>
              <CardTitle>Các bước thực hiện</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col gap-2 border p-3 rounded-md">
                  <Textarea
                    placeholder={`Bước ${index + 1}`}
                    value={step.description}
                    onChange={(e) => handleStepChange(index, e.target.value)}
                    rows={2}
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleStepImage(index, e.target.files?.[0] || null)}
                  />
                  {steps.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveStep(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddStep}>
                <Plus className="mr-2 h-4 w-4" /> Thêm bước
              </Button>
            </CardContent>
          </Card>

          {/* SUBMIT */}
          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Hủy
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRecipe;
