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

// Giả định sử dụng các component Select của shadcn/ui hoặc tương đương
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Giả định sử dụng component Separator
import { Separator } from "@/components/ui/separator";

import { Check, ChevronsUpDown, Plus, X, UploadCloud, Trash2 } from "lucide-react";
import { toast } from "sonner";

// Định nghĩa kiểu dữ liệu cho từng bước (Step)
interface RecipeStep {
  description: string;
  imageFile: File | null;
  previewUrl: string | null;
}

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

  const [steps, setSteps] = useState<RecipeStep[]>([
    { description: "", imageFile: null, previewUrl: null },
  ]);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreviewUrl, setMainImagePreviewUrl] = useState<string | null>(null);

  // ================= FETCH CATEGORY + INGREDIENT =================
  useEffect(() => {
    if (!user) {
      navigate("/auth/login");
      return;
    }
    fetchCategories();
    fetchIngredients();
  }, [user]);

  // Handle Main Image Change for Preview
  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setMainImageFile(file);
    if (mainImagePreviewUrl) {
      URL.revokeObjectURL(mainImagePreviewUrl); // Clean up previous preview URL
    }
    setMainImagePreviewUrl(file ? URL.createObjectURL(file) : null);
  };

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

  // ================= HANDLERS CHO CÁC BƯỚC =================
  const handleStepDescriptionChange = (index: number, value: string) => {
    setSteps((prev) => {
      const updated = [...prev];
      updated[index].description = value;
      return updated;
    });
  };

  const handleStepImageChange = (index: number, file: File | null) => {
    setSteps((prev) => {
      const updated = [...prev];
      if (updated[index].previewUrl) {
        URL.revokeObjectURL(updated[index].previewUrl as string);
      }
      updated[index].imageFile = file;
      updated[index].previewUrl = file ? URL.createObjectURL(file) : null;
      return updated;
    });
  };

  const handleAddStep = () => {
    setSteps((prev) => [...prev, { description: "", imageFile: null, previewUrl: null }]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps((prev) => {
      const removedStep = prev[index];
      if (removedStep.previewUrl) {
        URL.revokeObjectURL(removedStep.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // ================= SUBMIT FORM =================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validIngredients = ingredients.filter(
        (ing) => ing.ingredient_id && ing.quantity && ing.unit
      );
      
      if (!formData.title.trim()) {
        toast.error("Tên công thức không được để trống.");
        return;
      }
      if (selectedCategories.length === 0) {
        toast.error("Vui lòng chọn ít nhất một danh mục.");
        return;
      }
      if (validIngredients.length === 0) {
        toast.error("Vui lòng thêm ít nhất một nguyên liệu.");
        return;
      }
      const validSteps = steps.filter(s => s.description.trim() !== "" || s.imageFile !== null);
      if (validSteps.length === 0) {
        toast.error("Vui lòng thêm ít nhất một bước thực hiện.");
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("cooking_time", formData.cooking_time);
      formDataToSend.append("servings", formData.servings);
      formDataToSend.append("difficulty_level", formData.difficulty_level);
      formDataToSend.append("user_id", user.user_id.toString());
      formDataToSend.append("category_ids", JSON.stringify(selectedCategories));
      formDataToSend.append("ingredients", JSON.stringify(validIngredients));

      const stepsData = steps
        .map((s, index) => {
          if (s.description.trim() === "" && !s.imageFile) return null;
          return {
            order: index + 1,
            description: s.description,
            image_url: s.imageFile ? `STEP_IMAGE_PLACEHOLDER_${index}` : null,
          };
        })
        .filter((s) => s !== null);

      formDataToSend.append("steps", JSON.stringify(stepsData));

      steps.forEach((s) => {
        if (s.imageFile) {
          formDataToSend.append("stepImages", s.imageFile as Blob);
        }
      });

      if (mainImageFile) formDataToSend.append("images", mainImageFile);

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
  
  useEffect(() => {
    return () => {
      if (mainImagePreviewUrl) {
        URL.revokeObjectURL(mainImagePreviewUrl);
      }
      steps.forEach(step => {
        if (step.previewUrl) {
          URL.revokeObjectURL(step.previewUrl);
        }
      });
    };
  }, [mainImagePreviewUrl, steps]);

  // ================= CATEGORY SELECTOR =================
  const CategorySelector = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const filtered = useMemo(() => {
      const search = normalizeText(query);
      return categories.filter((c) => normalizeText(c.name).includes(search));
    }, [query, categories]);

    const toggleSelect = (id: string) => {
      setSelectedCategories((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    };

    return (
      <div className="space-y-2">
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((id) => {
              const cat = categories.find((c) => c.category_id.toString() === id);
              if (!cat) return null;
              return (
                <span
                  key={id}
                  className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                >
                  {cat.name}
                  <button
                    type="button"
                    onClick={() => toggleSelect(id)}
                    className="hover:text-destructive/80 transition-colors ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              <span className="text-muted-foreground">Chọn danh mục...</span>
              <ChevronsUpDown className="h-4 w-4 opacity-50 ml-2" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Tìm danh mục..."
                value={query}
                onValueChange={setQuery}
                autoFocus
              />
              <CommandList className="max-h-60 overflow-y-auto">
                {filtered.map((cat) => (
                  <CommandItem key={cat.category_id} onSelect={() => toggleSelect(cat.category_id.toString())}>
                    {cat.name}
                    {selectedCategories.includes(cat.category_id.toString()) && (
                      <Check className="h-4 w-4 ml-auto" />
                    )}
                  </CommandItem>
                ))}
                {filtered.length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground italic">
                    Không tìm thấy danh mục
                  </div>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  // ================= INGREDIENT PICKER =================
  const IngredientPicker = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
      const search = normalizeText(query);
      const selectedIds = new Set(ingredients.map(i => i.ingredient_id));
      return availableIngredients.filter((i: any) =>
        normalizeText(i.name).includes(search) && !selectedIds.has(i.ingredient_id.toString())
      );
    }, [query, availableIngredients, ingredients]);

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
      <div className="space-y-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" type="button" className="w-full justify-start">
              <Plus className="mr-2 h-4 w-4" /> Thêm nguyên liệu
            </Button>
          </PopoverTrigger>

          <PopoverContent className="p-0 w-full md:w-80">
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

        {ingredients.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground border-b pb-1">
              Danh sách nguyên liệu đã thêm ({ingredients.length})
            </p>
            {ingredients.map((ing, index) => {
              const found = availableIngredients.find(
                (i: any) => i.ingredient_id.toString() === ing.ingredient_id
              );
              return (
                <div key={index} className="flex gap-2 items-center bg-gray-50 p-2 rounded-md">
                  <Input readOnly value={found?.name || "Nguyên liệu không tồn tại"} className="flex-1 bg-white border" />
                  <Input
                    placeholder="Lượng"
                    className="w-20"
                    value={ing.quantity}
                    onChange={(e) => handleChange(index, "quantity", e.target.value)}
                  />
                  <Input
                    placeholder="Đơn vị"
                    className="w-20"
                    value={ing.unit}
                    onChange={(e) => handleChange(index, "unit", e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive/80 hover:text-destructive flex-shrink-0"
                    onClick={() => handleRemove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ================= RETURN UI =================
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center text-primary">📝 Thêm công thức mới</h1>
        <Separator className="mb-8" />

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ===== Thông tin cơ bản & Ảnh Chính ===== */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">
                      Tên công thức <span className="text-red-500">*</span>
                    </Label>
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
                      rows={4}
                      placeholder="Mô tả ngắn gọn về công thức này..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>
                      Danh mục <span className="text-red-500">*</span>
                    </Label>
                    <CategorySelector />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>
                        Thời gian (phút) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="30"
                        value={formData.cooking_time}
                        onChange={(e) =>
                          setFormData({ ...formData, cooking_time: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>
                        Khẩu phần <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="4"
                        value={formData.servings}
                        onChange={(e) =>
                          setFormData({ ...formData, servings: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Độ khó</Label>
                      <Select
                        value={formData.difficulty_level}
                        onValueChange={(value) =>
                          setFormData({ ...formData, difficulty_level: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Dễ</SelectItem>
                          <SelectItem value="medium">Trung bình</SelectItem>
                          <SelectItem value="hard">Khó</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="mainImage">Ảnh đại diện</Label>
                    <div className="flex flex-col gap-2 p-4 border border-dashed rounded-lg items-center">
                      {mainImagePreviewUrl ? (
                        <div className="relative w-full h-32">
                          <img
                            src={mainImagePreviewUrl}
                            alt="Ảnh đại diện"
                            className="w-full h-full object-cover rounded-md"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => {
                              setMainImageFile(null);
                              if (mainImagePreviewUrl)
                                URL.revokeObjectURL(mainImagePreviewUrl);
                              setMainImagePreviewUrl(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Label
                          htmlFor="mainImageUpload"
                          className="cursor-pointer text-center space-y-2"
                        >
                          <UploadCloud className="h-6 w-6 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Tải ảnh chính lên</p>
                        </Label>
                      )}
                      <Input
                        id="mainImageUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleMainImageChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Separator />

          {/* ===== Nguyên liệu ===== */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">🍚 Nguyên liệu</CardTitle>
            </CardHeader>
            <CardContent>
              <IngredientPicker />
            </CardContent>
          </Card>
          
          <Separator />

          {/* ===== Các bước thực hiện ===== */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">📋 Các bước thực hiện</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col gap-3 border p-4 rounded-lg bg-gray-50 relative">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg text-primary/80">
                      Bước {index + 1}
                    </span>
                    {steps.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive/80 hover:text-destructive h-7 w-7"
                        onClick={() => handleRemoveStep(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <Textarea
                    placeholder={`Mô tả chi tiết bước ${index + 1}... (Bắt buộc)`}
                    value={step.description}
                    onChange={(e) => handleStepDescriptionChange(index, e.target.value)}
                    rows={2}
                    required={!step.imageFile && index < steps.length - 1}
                  />
                  
                  <div className="flex items-center gap-3 mt-1">
                    <Label htmlFor={`step-image-${index}`} className="flex-shrink-0">
                      <Button asChild variant="secondary" type="button" className="h-8">
                        <span className="flex items-center cursor-pointer text-sm">
                          <UploadCloud className="mr-2 h-4 w-4" /> 
                          {step.imageFile ? "Đổi ảnh" : "Thêm ảnh"}
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id={`step-image-${index}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleStepImageChange(index, e.target.files?.[0] || null)
                      }
                    />

                    {step.imageFile && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-1 truncate">
                        <img
                          src={step.previewUrl || ""}
                          alt={`Preview Bước ${index + 1}`}
                          className="w-10 h-10 object-cover rounded-md flex-shrink-0"
                        />
                        <span className="truncate">{step.imageFile.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive/80 hover:text-destructive ml-auto h-6 w-6"
                          onClick={() => handleStepImageChange(index, null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={handleAddStep} className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Thêm bước mới
              </Button>
            </CardContent>
          </Card>
          
          <Separator />

          {/* ===== Nút hành động ===== */}
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading || selectedCategories.length === 0 || ingredients.length === 0}>
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⚙️</span> Đang thêm...
                </>
              ) : (
                "🚀 Thêm công thức"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRecipe;
