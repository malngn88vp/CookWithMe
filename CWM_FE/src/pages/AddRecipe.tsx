import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { recipeAPI, categoryAPI, ingredientAPI } from "@/services/api";
import Navbar from "@/components/Navbar";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { toast } from "sonner";

const normalizeText = (str: string) =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

const AddRecipe = () => {
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
  const [ingredients, setIngredients] = useState<
    Array<{ ingredient_id: string; quantity: string; unit: string }>
  >([]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // ================= FETCH CATEGORY + INGREDIENT =================
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

  // ================= SUBMIT FORM =================
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
      formDataToSend.append("user_id", user.user_id.toString());
      formDataToSend.append("category_ids", JSON.stringify(selectedCategories));
      formDataToSend.append("ingredients", JSON.stringify(validIngredients));
      const formattedSteps = steps.map((s) => ({ description: s }));
      formDataToSend.append("steps", JSON.stringify(formattedSteps));

      if (imageFile) formDataToSend.append("images", imageFile);

      const response = await recipeAPI.create(formDataToSend);
      toast.success("Đã thêm công thức thành công!");
      navigate(`/recipes/${response.data.recipe.recipe_id}`);
    } catch (error: any) {
      console.error("❌ Lỗi khi thêm công thức:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Không thể thêm công thức");
    } finally {
      setLoading(false);
    }
  };

  // ================= COMPONENT: CATEGORY SELECTOR =================
  const CategorySelector = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const filtered = useMemo(() => {
      const search = normalizeText(query);
      return categories.filter((c) =>
        normalizeText(c.name).includes(search)
      );
    }, [query, categories]);

    const toggleSelect = (id: string) => {
      setSelectedCategories((prev: string[]) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    };

    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map((id) => {
            const cat = categories.find((c) => c.category_id.toString() === id);
            if (!cat) return null;
            return (
              <span
                key={id}
                className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm flex items-center gap-1"
              >
                {cat.name}
                <button
                  type="button"
                  onClick={() => toggleSelect(id)}
                  className="hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between"
            >
              <span>Thêm danh mục</span>
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-72 p-0" align="start">
            <div className="p-2 border-b">
              <Input
                placeholder="Tìm danh mục..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto">
              {filtered.map((cat) => (
                <button
                  key={cat.category_id}
                  type="button"
                  onClick={() => toggleSelect(cat.category_id.toString())}
                  className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent ${
                    selectedCategories.includes(cat.category_id.toString())
                      ? "bg-accent"
                      : ""
                  }`}
                >
                  {cat.name}
                  {selectedCategories.includes(cat.category_id.toString()) && (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="p-2 text-sm text-muted-foreground italic">
                  Không tìm thấy danh mục
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  // ================= COMPONENT: INGREDIENT PICKER =================
  const IngredientPicker = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
      const search = normalizeText(query);
      return availableIngredients.filter((i: any) =>
        normalizeText(i.name).includes(search)
      );
    }, [query, availableIngredients]);

    const handleAdd = (item: any) => {
      setIngredients((prev) => [
        ...prev,
        {
          ingredient_id: item.ingredient_id.toString(),
          quantity: "",
          unit: item.default_unit || "",
        },
      ]);
      setQuery("");
      setOpen(false);
    };

    const handleRemove = (index: number) => {
      setIngredients((prev) => prev.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: string, value: string) => {
      setIngredients((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], [field]: value };
        return copy;
      });
    };

    return (
      <div className="space-y-3">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" type="button">
              <Plus className="mr-2 h-4 w-4" /> Thêm nguyên liệu
            </Button>
          </PopoverTrigger>

          <PopoverContent className="p-0 w-80">
            <Command>
              <CommandInput
                placeholder="Tìm nguyên liệu..."
                value={query}
                onValueChange={setQuery}
                autoFocus
              />
              <CommandList className="max-h-60 overflow-y-auto">
                {filtered.map((i: any) => (
                  <CommandItem key={i.ingredient_id} onSelect={() => handleAdd(i)}>
                    {i.name}{" "}
                    {i.default_unit && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({i.default_unit})
                      </span>
                    )}
                  </CommandItem>
                ))}
                {filtered.length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground italic">
                    Không tìm thấy nguyên liệu
                  </div>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="space-y-2">
          {ingredients.map((ing, index) => {
            const found = availableIngredients.find(
              (i: any) => i.ingredient_id.toString() === ing.ingredient_id
            );
            return (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  readOnly
                  value={found?.name || ""}
                  className="flex-1 bg-muted"
                />
                <Input
                  placeholder="Số lượng"
                  className="w-24"
                  value={ing.quantity}
                  onChange={(e) =>
                    handleChange(index, "quantity", e.target.value)
                  }
                />
                <Input
                  placeholder="Đơn vị"
                  className="w-24"
                  value={ing.unit}
                  onChange={(e) => handleChange(index, "unit", e.target.value)}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ================= RETURN UI =================
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Thêm công thức mới</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ===== Thông tin cơ bản ===== */}
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
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
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

              <div>
                <Label>Danh mục *</Label>
                <CategorySelector />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Độ khó</Label>
                  <select
                    className="border rounded-md w-full px-2 py-2"
                    value={formData.difficulty_level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        difficulty_level: e.target.value,
                      })
                    }
                  >
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                  </select>
                </div>

                <div>
                  <Label>Thời gian (phút) *</Label>
                  <Input
                    type="number"
                    value={formData.cooking_time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cooking_time: e.target.value,
                      })
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
                      setFormData({
                        ...formData,
                        servings: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="image">Ảnh đại diện</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setImageFile(e.target.files?.[0] || null)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* ===== Nguyên liệu ===== */}
          <Card>
            <CardHeader>
              <CardTitle>Nguyên liệu</CardTitle>
            </CardHeader>
            <CardContent>
              <IngredientPicker />
            </CardContent>
          </Card>

          {/* ===== Các bước ===== */}
          <Card>
            <CardHeader>
              <CardTitle>Các bước thực hiện</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-2 border p-3 rounded-md"
                >
                  <Textarea
                    placeholder={`Bước ${index + 1}`}
                    value={step}
                    onChange={(e) => {
                      const updated = [...steps];
                      updated[index] = e.target.value;
                      setSteps(updated);
                    }}
                    rows={2}
                  />
                  {steps.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() =>
                        setSteps(steps.filter((_, i) => i !== index))
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => setSteps([...steps, ""])}
              >
                <Plus className="mr-2 h-4 w-4" /> Thêm bước
              </Button>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Đang thêm..." : "Thêm công thức"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Hủy
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRecipe;
