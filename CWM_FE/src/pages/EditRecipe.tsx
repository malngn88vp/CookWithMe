import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { recipeAPI, categoryAPI, ingredientAPI } from "@/services/api";
import Navbar from "@/components/Navbar";
import heroImage from "@/assets/add_recipe.jpg";
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem } from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";

import { Plus, X, UploadCloud, Trash2, ChevronsUpDown, Check } from "lucide-react";
import { toast } from "sonner";

/* -------------------- Types -------------------- */
interface StepType {
  description: string;
  image_url?: string;
}

interface IngredientType {
  ingredient_id: string;
  quantity: string;
  unit: string;
}

/* -------------------- Helpers -------------------- */
const normalizeText = (str: string) =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

const genId = () =>
  typeof crypto !== "undefined" && (crypto as any).randomUUID
    ? (crypto as any).randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

/* -------------------- Small styled subcomponents -------------------- */
function Tag({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
  return (
    <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border">
      {children}
      {onRemove && (
        <button type="button" onClick={onRemove} className="ml-1">
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

const IngredientRow = ({
  index,
  ing,
  availableIngredients,
  onChange,
  onRemove,
}: {
  index: number;
  ing: IngredientType;
  availableIngredients: any[];
  onChange: (index: number, field: string, value: string) => void;
  onRemove: (index: number) => void;
}) => {
  return (
    <div className="flex gap-3 items-center">
      <Select
        value={ing.ingredient_id}
        onValueChange={(v) => onChange(index, "ingredient_id", v)}
      >
        <SelectTrigger className="flex-1 rounded-xl">
          <SelectValue placeholder="Chọn nguyên liệu" />
        </SelectTrigger>
        <SelectContent>
          {availableIngredients.map((a) => (
            <SelectItem key={a.ingredient_id} value={a.ingredient_id.toString()}>
              {a.name} {a.default_unit ? `(${a.default_unit})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="Số lượng"
        className="w-28 rounded-xl"
        value={ing.quantity}
        onChange={(e) => onChange(index, "quantity", e.target.value)}
      />
      <Input
        placeholder="Đơn vị"
        className="w-28 rounded-xl"
        value={ing.unit}
        onChange={(e) => onChange(index, "unit", e.target.value)}
      />

      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive/80"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

const StepBlock = ({
  index,
  step,
  file,
  onDescriptionChange,
  onFileChange,
  onRemove,
  canRemove,
}: {
  index: number;
  step: StepType;
  file: File | null;
  onDescriptionChange: (index: number, value: string) => void;
  onFileChange: (index: number, f: File | null) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (step.image_url) {
      setPreviewUrl(step.image_url);
    } else {
      setPreviewUrl(null);
    }
  }, [file, step.image_url]);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white shadow-sm border">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-slate-700">Bước {index + 1}</div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive/80 h-8 w-8"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <Textarea
        placeholder={`Mô tả chi tiết bước ${index + 1}...`}
        value={step.description}
        onChange={(e) => onDescriptionChange(index, e.target.value)}
        rows={3}
        className="rounded-xl"
      />

      <div className="flex items-center gap-3">
        <label htmlFor={`step-image-${index}`} className="flex-shrink-0">
          <Button asChild variant="secondary" type="button" className="h-9 rounded-xl">
            <span className="flex items-center text-sm">
              <UploadCloud className="mr-2 h-4 w-4" />
              {file || step.image_url ? "Đổi ảnh" : "Thêm ảnh"}
            </span>
          </Button>
        </label>
        <input
          id={`step-image-${index}`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFileChange(index, e.target.files?.[0] || null)}
        />

        {previewUrl && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-1">
            <img src={previewUrl} alt={`Preview bước ${index + 1}`} className="w-20 h-20 object-cover rounded-lg border" />
            <div className="flex-1 truncate">
              <div className="truncate font-medium">{file?.name || (step.image_url ? "Ảnh hiện có" : "")}</div>
              {file && <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>}
            </div>
            {file ? (
              <Button variant="ghost" size="icon" onClick={() => onFileChange(index, null)} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

const MealSelect = ({
  value,
  onChange,
}: {
  value: string[];
  onChange: (val: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);

  const mealOptions = [
    { id: "Breakfast", label: "Bữa sáng" },
    { id: "Lunch", label: "Bữa trưa" },
    { id: "Dinner", label: "Bữa tối" },
  ];

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else onChange([...value, id]);
  };

  const displayText =
    value.length === 3
      ? "Không phân loại"
      : value.length === 0
      ? "Chọn buổi ăn"
      : mealOptions
          .filter((m) => value.includes(m.id))
          .map((m) => m.label)
          .join(", ");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between rounded-xl mt-2"
        >
          {displayText}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-56 p-0 rounded-xl" align="start">
        <Command>
          <CommandList>
            {mealOptions.map((m) => (
              <CommandItem
                key={m.id}
                onSelect={() => toggle(m.id)}
                className="flex items-center gap-2"
              >
                <div
                  className={`h-4 w-4 border rounded flex items-center justify-center ${
                    value.includes(m.id)
                      ? "border-orange-500 bg-orange-500"
                      : "border-slate-300"
                  }`}
                >
                  {value.includes(m.id) && (
                    <Check className="text-white h-3 w-3" />
                  )}
                </div>
                {m.label}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

/* -------------------- Main EditRecipe Component -------------------- */
const EditRecipe: React.FC = () => {
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
    difficulty_level: "Trung bình",
    meal_type: ["Breakfast", "Lunch", "Dinner"],
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<IngredientType[]>([{ ingredient_id: "", quantity: "", unit: "" }]);

  const [steps, setSteps] = useState<StepType[]>([{ description: "", image_url: "" }]);
  const [stepImages, setStepImages] = useState<(File | null)[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);


  /* -------------------- Fetch categories + ingredients -------------------- */
  useEffect(() => {
    if (!user) {
      navigate("/auth/login");
      return;
    }
    fetchCategories();
    fetchIngredients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  /* -------------------- Fetch recipe -------------------- */
  useEffect(() => {
    if (id) fetchRecipe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRecipe = async () => {
    try {
      const res = await recipeAPI.getById(id!);
      const recipe = res.data.recipe;

      setFormData({
        title: recipe.title || "",
        description: recipe.description || "",
        cooking_time: recipe.cooking_time || "",
        servings: recipe.servings || "",
        difficulty_level: recipe.difficulty_level || "medium",
        meal_type: Array.isArray(recipe.meal_type)
          ? recipe.meal_type
          : typeof recipe.meal_type === "string"
          ? (() => {
              try {
                const parsed = JSON.parse(recipe.meal_type);
                return Array.isArray(parsed) ? parsed : [parsed];
              } catch {
                return [recipe.meal_type];
              }
            })()
          : [],
      });

      setSelectedCategories(recipe.categories?.map((c: any) => c.category_id.toString()) || []);

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
          image_url: s.image_url ?? null,
        })) || [{ description: "", image_url: null }]
      );

      setStepImages(recipe.steps?.map(() => null) || []);
    } catch (error) {
      console.error("❌ Lỗi khi tải công thức:", error);
      toast.error("Không thể tải công thức");
    }
  };

  /* -------------------- Ingredient handlers -------------------- */
  const handleIngredientChange = (index: number, field: string, value: string) => {
    setIngredients((prev) => {
      const next = [...prev];
      if (field === "ingredient_id") {
        const selected = availableIngredients.find((ing) => ing.ingredient_id.toString() === value);
        next[index] = {
          ...next[index],
          ingredient_id: value,
          unit: selected?.default_unit || next[index].unit,
        };
      } else {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  const handleAddIngredient = () => {
    setIngredients((prev) => [...prev, { ingredient_id: "", quantity: "", unit: "" }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  /* -------------------- Steps handlers -------------------- */
  const handleStepChange = (index: number, value: string) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], description: value };
      return next;
    });
  };

  const handleAddStep = () => {
    setSteps((prev) => [...prev, { description: "", image_url: null }]);
    setStepImages((prev) => [...prev, null]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
    setStepImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStepImage = (index: number, file: File | null) => {
    setStepImages((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
  };

  /* -------------------- Category selector (styled like AddRecipe) -------------------- */
  const CategorySelector = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const filtered = useMemo(() => {
      const s = normalizeText(query || "");
      return categories.filter((c) => normalizeText(c.name).includes(s));
    }, [query, categories]);

    const toggleSelect = (id: string) => {
      setSelectedCategories((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    return (
      <div className="space-y-3">
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((id) => {
              const cat = categories.find((c) => c.category_id.toString() === id);
              if (!cat) return null;
              return <Tag key={id}>{cat.name}<button onClick={() => toggleSelect(id)} className="ml-1"><X className="w-3 h-3"/></button></Tag>;
            })}
          </div>
        )}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="w-full justify-between rounded-2xl py-3">
              <span className="text-muted-foreground">Chọn danh mục...</span>
              <ChevronsUpDown className="h-4 w-4 opacity-50 ml-2 text-slate-500" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-72 p-0 rounded-2xl border" align="start">
            <Command>
              <CommandInput placeholder="Tìm danh mục..." value={query} onValueChange={setQuery} autoFocus />
              <CommandList className="max-h-60 overflow-y-auto">
                {filtered.map((cat) => (
                  <CommandItem key={cat.category_id} onSelect={() => toggleSelect(cat.category_id.toString())}>
                    {cat.name}
                    {selectedCategories.includes(cat.category_id.toString()) && <Check className="h-4 w-4 ml-auto text-orange-500" />}
                  </CommandItem>
                ))}
                {filtered.length === 0 && <div className="p-3 text-sm text-muted-foreground italic">Không tìm thấy danh mục</div>}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  /* -------------------- Submit -------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const validIngredients = ingredients.filter((ing) => ing.ingredient_id && ing.quantity && ing.unit);
      if (!formData.title.trim()) {
        toast.error("Tên công thức không được để trống.");
        setLoading(false);
        return;
      }
      if (selectedCategories.length === 0) {
        toast.error("Vui lòng chọn ít nhất một danh mục.");
        setLoading(false);
        return;
      }
      if (validIngredients.length === 0) {
        toast.error("Vui lòng thêm ít nhất một nguyên liệu.");
        setLoading(false);
        return;
      }
      const validSteps = steps.filter((s, idx) => s.description.trim() !== "" || stepImages[idx] !== null || s.image_url);
      if (validSteps.length === 0) {
        toast.error("Vui lòng thêm ít nhất một bước thực hiện.");
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("cooking_time", formData.cooking_time);
      formDataToSend.append("servings", formData.servings);
      formDataToSend.append("difficulty_level", formData.difficulty_level);
      formDataToSend.append("meal_type", JSON.stringify(formData.meal_type));
      formDataToSend.append("category_ids", JSON.stringify(selectedCategories));
      formDataToSend.append("ingredients", JSON.stringify(validIngredients));

      const formattedSteps = steps.map((s, index) => ({
        order: index + 1,
        description: s.description,
        image_url: s.image_url ?? null   // giữ nguyên null, không đổi thành ""
      }));
      formDataToSend.append("steps", JSON.stringify(formattedSteps));

      stepImages.forEach((file, index) => {
        if (file) {
          formDataToSend.append("stepImages", file);
          formDataToSend.append("stepImageIndex", index.toString());
        }
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

  useEffect(() => {
    return () => {
      // Revoke any preview URLs created elsewhere if needed
    };
  }, []);

  /* -------------------- Render -------------------- */
  return (
    <div className="min-h-screen bg-[#fbfbfb]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="rounded-2xl overflow-hidden shadow-lg relative mb-10">
          <div
            className="h-44 md:h-56 bg-cover bg-center filter brightness-90"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-6 md:px-12">
              <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg">Chỉnh sửa công thức</h1>
              <p className="text-sm md:text-base text-orange-100 mt-2">Cập nhật nội dung & hình ảnh cho công thức của bạn</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Thông tin cơ bản */}
          <Card className="rounded-2xl shadow-lg border">
            <CardHeader>
              <CardTitle className="text-xl">Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="title">Tên công thức <span className="text-red-500">*</span></Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="rounded-xl mt-2"
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
                      className="rounded-xl mt-2"
                    />
                  </div>

                  <div>
                    <Label>Danh mục <span className="text-red-500">*</span></Label>
                    <div className="mt-2">
                      <CategorySelector />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Thời gian (phút) <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="30"
                        value={formData.cooking_time}
                        onChange={(e) => setFormData({ ...formData, cooking_time: e.target.value })}
                        required
                        className="rounded-xl mt-2"
                      />
                    </div>
                    <div>
                      <Label>Khẩu phần <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="4"
                        value={formData.servings}
                        onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                        required
                        className="rounded-xl mt-2"
                      />
                    </div>
                    <div>
                      <Label>Độ khó</Label>
                      <Select
                        value={formData.difficulty_level}
                        onValueChange={(v) => setFormData({ ...formData, difficulty_level: v })}
                      >
                        <SelectTrigger className="w-full rounded-xl mt-2">
                          <SelectValue placeholder="Chọn..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Dễ</SelectItem>
                          <SelectItem value="medium">Trung bình</SelectItem>
                          <SelectItem value="hard">Khó</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Buổi ăn</Label>
                      <MealSelect
                        value={formData.meal_type}
                        onChange={(val) => setFormData({ ...formData, meal_type: val })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="mainImage">Ảnh đại diện</Label>
                    <div className="flex flex-col gap-3 p-4 border-dashed rounded-2xl items-center bg-white mt-2 border">
                      <label htmlFor="mainImageUpload" className="cursor-pointer text-center space-y-2 py-6 w-full">
                        <UploadCloud className="h-6 w-6 mx-auto text-orange-500" />
                        <p className="text-sm text-muted-foreground">Tải ảnh chính lên</p>
                        <p className="text-xs text-muted-foreground">(Nếu không thay ảnh, ảnh cũ sẽ giữ nguyên)</p>
                      </label>
                      <Input id="mainImageUpload" type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Nguyên liệu */}
          <Card className="rounded-2xl shadow-lg border">
            <CardHeader>
              <CardTitle className="text-xl">🍚 Nguyên liệu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ingredients.map((ing, idx) => (
                  <IngredientRow
                    key={idx}
                    index={idx}
                    ing={ing}
                    availableIngredients={availableIngredients}
                    onChange={handleIngredientChange}
                    onRemove={ingredients.length > 1 ? handleRemoveIngredient : () => {}}
                  />
                ))}

                <Button type="button" variant="outline" onClick={handleAddIngredient} className="rounded-2xl py-3">
                  <Plus className="mr-2 h-4 w-4 text-orange-500" /> Thêm nguyên liệu
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Các bước */}
          <Card className="rounded-2xl shadow-lg border">
            <CardHeader>
              <CardTitle className="text-xl">📋 Các bước thực hiện</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {steps.map((step, idx) => (
                <StepBlock
                  key={idx}
                  index={idx}
                  step={step}
                  file={stepImages[idx] || null}
                  onDescriptionChange={handleStepChange}
                  onFileChange={handleStepImage}
                  onRemove={handleRemoveStep}
                  canRemove={steps.length > 1}
                />
              ))}

              <Button type="button" variant="ghost" onClick={handleAddStep} className="w-full rounded-2xl py-3">
                <Plus className="mr-2 h-4 w-4 text-orange-500" /> Thêm bước mới
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="rounded-2xl py-3 px-6">
              Hủy
            </Button>
            <Button type="submit" className="rounded-2xl py-3 px-6 bg-orange-500 hover:bg-orange-600" disabled={loading}>
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⚙️</span> Đang lưu...
                </>
              ) : (
                "💾 Lưu thay đổi"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRecipe;
