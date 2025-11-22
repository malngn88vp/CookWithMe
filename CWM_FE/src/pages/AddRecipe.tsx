import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { recipeAPI, categoryAPI, ingredientAPI } from "@/services/api";
import Navbar from "@/components/Navbar";
import heroImage from "@/assets/add_recipe.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem } from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { Check, ChevronsUpDown, Plus, X, UploadCloud, Trash2 } from "lucide-react";
import { toast } from "sonner";

/* -------------------- Helpers -------------------- */
const normalizeText = (str: string) =>
  str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

const genId = () =>
  typeof crypto !== "undefined" && (crypto as any).randomUUID
    ? (crypto as any).randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

function useDebounce<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/* -------------------- IngredientItem (memo) -------------------- */
type IngredientItemProps = {
  ing: {
    _id: string;
    ingredient_id: string;
    quantity: string;
    unit: string;
  };
  found?: any;
  onChange: (id: string, field: "quantity" | "unit", value: string) => void;
  onRemove: (id: string) => void;
};

const IngredientItem = React.memo(function IngredientItem({
  ing,
  found,
  onChange,
  onRemove,
}: IngredientItemProps) {
  return (
    <div className="flex gap-3 items-center bg-white p-3 rounded-2xl shadow-sm border">
      <Input
        readOnly
        value={found?.name || "Nguyên liệu không tồn tại"}
        className="flex-1 bg-transparent border-0 px-0 py-0"
      />
      <Input
        placeholder="Lượng"
        className="w-24"
        value={ing.quantity}
        onChange={(e) => onChange(ing._id, "quantity", e.target.value)}
      />
      <Input
        placeholder="Đơn vị"
        className="w-24"
        value={ing.unit}
        onChange={(e) => onChange(ing._id, "unit", e.target.value)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-destructive/80 hover:text-destructive flex-shrink-0"
        onClick={() => onRemove(ing._id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
});

/* -------------------- StepItem (memo, local preview + debounced update) -------------------- */
type StepType = {
  id: string;
  description: string;
  imageFile: File | null;
};

type StepItemProps = {
  step: StepType;
  index: number;
  onUpdate: (id: string, patch: Partial<{ description: string; imageFile: File | null }>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
};

const StepItem = React.memo(function StepItem({ step, index, onUpdate, onRemove, canRemove }: StepItemProps) {
  const [localDesc, setLocalDesc] = useState(step.description || "");
  const debouncedDesc = useDebounce(localDesc, 250);

  useEffect(() => {
    if (debouncedDesc !== step.description) {
      onUpdate(step.id, { description: debouncedDesc });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDesc]);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (step.imageFile) {
      const url = URL.createObjectURL(step.imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [step.imageFile]);

  const handleFileChange = (file: File | null) => {
    onUpdate(step.id, { imageFile: file });
  };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white shadow-sm border">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-lg text-slate-700">Bước {index + 1}</span>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive/80 hover:text-destructive h-8 w-8"
            onClick={() => onRemove(step.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Textarea
        placeholder={`Mô tả chi tiết bước ${index + 1}...`}
        value={localDesc}
        onChange={(e) => setLocalDesc(e.target.value)}
        rows={3}
        className="min-h-[80px]"
      />

      <div className="flex items-center gap-3 mt-1">
        <label htmlFor={`step-image-${step.id}`} className="flex-shrink-0">
          <Button asChild variant="secondary" type="button" className="h-9 rounded-xl">
            <span className="flex items-center cursor-pointer text-sm">
              <UploadCloud className="mr-2 h-4 w-4" />
              {step.imageFile ? "Đổi ảnh" : "Thêm ảnh"}
            </span>
          </Button>
        </label>
        <input
          id={`step-image-${step.id}`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        />

        {step.imageFile && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-1 truncate">
            <img
              src={previewUrl || ""}
              alt={`Preview Bước ${index + 1}`}
              className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border"
            />
            <div className="flex-1 truncate">
              <div className="truncate font-medium">{step.imageFile.name}</div>
              <div className="text-xs text-muted-foreground">{(step.imageFile.size / 1024).toFixed(1)} KB</div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive/80 hover:text-destructive h-8 w-8"
              onClick={() => handleFileChange(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

/* -------------------- IngredientPicker component -------------------- */
type IngredientRecord = {
  _id: string;
  ingredient_id: string;
  quantity: string;
  unit: string;
};

function IngredientPicker({
  availableIngredients,
  ingredients,
  setIngredients,
}: {
  availableIngredients: any[];
  ingredients: IngredientRecord[];
  setIngredients: React.Dispatch<React.SetStateAction<IngredientRecord[]>>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 200);

  const filtered = useMemo(() => {
    const search = normalizeText(debouncedQuery || "");
    const selectedIds = new Set(ingredients.map((i) => i.ingredient_id));
    return availableIngredients.filter(
      (i: any) => normalizeText(i.name).includes(search) && !selectedIds.has(i.ingredient_id.toString())
    );
  }, [debouncedQuery, availableIngredients, ingredients]);

  const handleAdd = useCallback((item: any) => {
    setIngredients((prev) => [
      ...prev,
      {
        _id: genId(),
        ingredient_id: item.ingredient_id.toString(),
        quantity: "",
        unit: item.default_unit || "",
      },
    ]);
    setQuery("");
    setOpen(false);
  }, [setIngredients]);

  const onRemove = useCallback((id: string) => {
    setIngredients((prev) => prev.filter((p) => p._id !== id));
  }, [setIngredients]);

  const onChange = useCallback((id: string, field: "quantity" | "unit", value: string) => {
    setIngredients((prev) =>
      prev.map((p) => (p._id === id ? { ...p, [field]: value } : p))
    );
  }, [setIngredients]);

  return (
    <div className="space-y-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" type="button" className="w-full justify-start rounded-2xl py-3">
            <Plus className="mr-2 h-4 w-4 text-orange-500" /> Thêm nguyên liệu
          </Button>
        </PopoverTrigger>

        <PopoverContent className="p-0 w-full md:w-80 rounded-2xl border">
          <Command>
            <CommandInput
              placeholder="Tìm nguyên liệu..."
              value={query}
              onValueChange={(v: string) => setQuery(v)}
              autoFocus
            />
            <CommandList className="max-h-60 overflow-y-auto">
              {filtered.map((i: any) => (
                <CommandItem key={i.ingredient_id} onSelect={() => handleAdd(i)}>
                  {i.name}{" "}
                  {i.default_unit && (
                    <span className="text-xs text-muted-foreground ml-1">({i.default_unit})</span>
                  )}
                </CommandItem>
              ))}
              {filtered.length === 0 && (
                <div className="p-3 text-sm text-muted-foreground italic">Không tìm thấy nguyên liệu</div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {ingredients.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground border-b pb-2">
            Danh sách nguyên liệu đã thêm ({ingredients.length})
          </p>
          {ingredients.map((ing) => {
            const found = availableIngredients.find(
              (i: any) => i.ingredient_id.toString() === ing.ingredient_id
            );
            return (
              <IngredientItem
                key={ing._id}
                ing={ing}
                found={found}
                onChange={onChange}
                onRemove={onRemove}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------------------- StepsList (manages list) -------------------- */
function StepsList({
  steps,
  setSteps,
}: {
  steps: StepType[];
  setSteps: React.Dispatch<React.SetStateAction<StepType[]>>;
}) {
  const addStep = useCallback(() => {
    setSteps((prev) => [...prev, { id: genId(), description: "", imageFile: null }]);
  }, [setSteps]);

  const updateStep = useCallback((id: string, patch: Partial<{ description: string; imageFile: File | null }>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, [setSteps]);

  const removeStep = useCallback((id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }, [setSteps]);

  return (
    <div className="space-y-6">
      {steps.map((step, index) => (
        <StepItem
          key={step.id}
          step={step}
          index={index}
          onUpdate={updateStep}
          onRemove={removeStep}
          canRemove={steps.length > 1}
        />
      ))}

      <Button type="button" variant="ghost" onClick={addStep} className="w-full rounded-2xl py-3">
        <Plus className="mr-2 h-4 w-4 text-orange-500" /> Thêm bước mới
      </Button>
    </div>
  );
}

const MealSelect = ({ value, onChange }: any) => {
  const [open, setOpen] = useState(false);

  const meals = [
    { id: "Breakfast", label: "Bữa sáng" },
    { id: "Lunch", label: "Bữa trưa" },
    { id: "Dinner", label: "Bữa tối" },
  ];

  const toggle = (id: string) => {
    let updated = value.includes(id)
      ? value.filter((v: string) => v !== id)
      : [...value, id];

    onChange(updated);
  };

  const displayText =
    value.length === 0
      ? "Chọn buổi ăn..."
      : value.length === 3
      ? "Cả ngày"
      : meals.filter((m) => value.includes(m.id)).map((m) => m.label).join(", ");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between rounded-xl"
        >
          {displayText}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-56 p-0 rounded-xl">
        <Command>
          <CommandInput placeholder="Tìm buổi ăn..." />

          <CommandList>
            {meals.map((m) => (
              <CommandItem
                key={m.id}
                onSelect={() => toggle(m.id)}
                className="flex items-center gap-2"
              >
                <div
                  className={`h-4 w-4 rounded border flex items-center justify-center ${
                    value.includes(m.id) ? "bg-orange-500 border-orange-500" : ""
                  }`}
                >
                  {value.includes(m.id) && (
                    <Check className="h-3 w-3 text-white" />
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


/* -------------------- Main AddRecipe component -------------------- */
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
    meal_type: ["Breakfast", "Lunch", "Dinner"],
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<IngredientRecord[]>([]);

  const [steps, setSteps] = useState<StepType[]>([{ id: genId(), description: "", imageFile: null }]);

  // main image file only, preview handled inline here
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreviewUrl, setMainImagePreviewUrl] = useState<string | null>(null);

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

  // main image preview handled here (only this piece of state changes when main image changes)
  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setMainImageFile(file);
    if (mainImagePreviewUrl) {
      URL.revokeObjectURL(mainImagePreviewUrl);
    }
    setMainImagePreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  // Category selector logic (left similar but moved out of inline declaration)
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
      <div className="space-y-3">
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((id) => {
              const cat = categories.find((c) => c.category_id.toString() === id);
              if (!cat) return null;
              return (
                <span
                  key={id}
                  className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border"
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
              className="w-full justify-between rounded-2xl py-3"
            >
              <span className="text-muted-foreground">Chọn danh mục...</span>
              <ChevronsUpDown className="h-4 w-4 opacity-50 ml-2 text-slate-500" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-72 p-0 rounded-2xl border" align="start">
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
                      <Check className="h-4 w-4 ml-auto text-orange-500" />
                    )}
                  </CommandItem>
                ))}
                {filtered.length === 0 && (
                  <div className="p-3 text-sm text-muted-foreground italic">Không tìm thấy danh mục</div>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  // submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validIngredients = ingredients.filter(
        (ing) => ing.ingredient_id && ing.quantity && ing.unit
      );

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
      const validSteps = steps.filter((s) => s.description.trim() !== "" || s.imageFile !== null);
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

  // cleanup main preview
  useEffect(() => {
    return () => {
      if (mainImagePreviewUrl) {
        URL.revokeObjectURL(mainImagePreviewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#fbfbfb]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="rounded-2xl overflow-hidden shadow-lg relative mb-10">
          <div
            className="h-44 md:h-56 bg-cover bg-center filter brightness-75"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-6 md:px-12">
              <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg">
                Thêm công thức mới
              </h1>
              <p className="text-sm md:text-base text-orange-100 mt-2">
                Chia sẻ món ngon của bạn với cộng đồng CookWithMe
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Thông tin cơ bản & Ảnh Chính */}
          <Card className="rounded-2xl shadow-lg overflow-visible border">
            <CardHeader>
              <CardTitle className="text-xl">Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="title">
                      Tên công thức <span className="text-red-500">*</span>
                    </Label>
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
                    <Label>
                      Danh mục <span className="text-red-500">*</span>
                    </Label>
                    <div className="mt-2">
                      <CategorySelector />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  < div className="grid grid-cols-4 gap-4">
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
                        className="rounded-xl mt-2"
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
                        className="rounded-xl mt-2"
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
                        <SelectTrigger className="w-full rounded-xl mt-2">
                          <SelectValue placeholder="Chọn..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dễ">Dễ</SelectItem>
                          <SelectItem value="Trung bình">Trung bình</SelectItem>
                          <SelectItem value="Khó">Khó</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  <div>
                    <Label>Buổi ăn</Label>
                    <div className="mt-2">
                      <MealSelect
                        value={formData.meal_type}
                        onChange={(val: any) =>
                          setFormData({ ...formData, meal_type: val })
                        }
                      />
                    </div>
                  </div>
                  <div className="col-span-4 w-full">
                    <Label htmlFor="mainImage">Ảnh đại diện</Label>

                    <div className="mt-2 w-full">
                      <div className="flex flex-col gap-3 p-6 border border-dashed rounded-2xl items-center bg-white w-full h-56 md:h-60 justify-center">

                        {mainImagePreviewUrl ? (
                          <div className="relative w-full h-full">
                            <img
                              src={mainImagePreviewUrl}
                              alt="Ảnh đại diện"
                              className="w-full h-full object-cover rounded-2xl"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8"
                              onClick={() => {
                                setMainImageFile(null);
                                if (mainImagePreviewUrl) URL.revokeObjectURL(mainImagePreviewUrl);
                                setMainImagePreviewUrl(null);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Label
                            htmlFor="mainImageUpload"
                            className="cursor-pointer text-center space-y-2 py-10 w-full"
                          >
                            <UploadCloud className="h-8 w-8 mx-auto text-orange-500" />
                            <p className="text-base font-medium">Tải ảnh chính lên</p>
                            <p className="text-sm text-muted-foreground">(Nếu không tải ảnh mới, ảnh cũ sẽ giữ nguyên)</p>
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
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Nguyên liệu */}
          <Card className="rounded-2xl shadow-lg border">
            <CardHeader>
              <CardTitle className="text-xl">Nguyên liệu</CardTitle>
            </CardHeader>
            <CardContent>
              <IngredientPicker
                availableIngredients={availableIngredients}
                ingredients={ingredients}
                setIngredients={setIngredients}
              />
            </CardContent>
          </Card>

          <Separator />

          {/* Các bước */}
          <Card className="rounded-2xl shadow-lg border">
            <CardHeader>
              <CardTitle className="text-xl">Các bước thực hiện</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <StepsList steps={steps} setSteps={setSteps} />
            </CardContent>
          </Card>

          <Separator />

          {/* Nút hành động */}
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={loading} className="rounded-2xl py-3 px-6">
              Hủy
            </Button>
            <Button type="submit" disabled={loading || selectedCategories.length === 0 || ingredients.length === 0} className="rounded-2xl py-3 px-6 bg-orange-500 hover:bg-orange-600">
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
