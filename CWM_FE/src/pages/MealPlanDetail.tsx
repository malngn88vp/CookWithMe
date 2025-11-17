import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mealPlanAPI, recipeAPI, shoppingListAPI } from "@/services/api";
import { toast } from "sonner";
import { Save, ShoppingCart, Plus } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const MealPlanDetail = () => {
  const { id } = useParams(); // mealplan_id từ URL

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [allRecipes, setAllRecipes] = useState<any[]>([]);
  const [tempMeals, setTempMeals] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealTime, setSelectedMealTime] = useState<string>("");
  const [showDialog, setShowDialog] = useState(false);

  const mealTimes = [
    { icon: "☀️", name: "Sáng" },
    { icon: "🌅", name: "Trưa" },
    { icon: "🌙", name: "Tối" },
  ];

  // -------------------------
  // Lấy label tên thứ
  // -------------------------
  const getDayLabel = (date: Date) => {
    const day = date.getDay();
    return ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][day];
  };

  // -------------------------
  // Load dữ liệu
  // -------------------------
  useEffect(() => {
    if (id) {
      fetchPlan(id);
      fetchAllRecipes();
    }
  }, [id]);

  const fetchAllRecipes = async () => {
    try {
      const res = await recipeAPI.getAll();
      const data = res.data?.recipes ?? res.data ?? [];
      setAllRecipes(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Lỗi tải danh sách món ăn");
    }
  };

  const fetchPlan = async (planId: string) => {
    try {
      const res = await mealPlanAPI.getById(planId);
      const plan = res.data;
      console.log("Kế hoạch tải về:", plan);

      setStartDate(new Date(plan.start_date));
      setEndDate(new Date(plan.end_date));

      // Map recipes đúng
      if (plan.recipes && Array.isArray(plan.recipes)) {
        const mapped = plan.recipes.map((item: any) => {
          const meal_time = convertMealTypeReverse(item.MealPlanRecipe.meal_type) || "Sáng";
          const title = item.title || "Không rõ";

          // Chuẩn hóa date YYYY-MM-DD
          const dateObj = new Date(item.MealPlanRecipe.scheduled_date);
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const day = String(dateObj.getDate()).padStart(2, "0");
          const dateISO = `${year}-${month}-${day}`;

          return { date: dateISO, meal_time, title };
        });
        setRecipes(mapped);
      } else {
        setRecipes([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải kế hoạch");
    }
  };

  // -------------------------
  // Chuyển meal type
  // -------------------------
  const convertMealType = (label: string) => {
    switch (label) {
      case "Sáng":
        return "Breakfast";
      case "Trưa":
        return "Lunch";
      case "Tối":
        return "Dinner";
      default:
        return "Snack";
    }
  };

  const convertMealTypeReverse = (type: string) => {
    switch (type) {
      case "Breakfast":
        return "Sáng";
      case "Lunch":
        return "Trưa";
      case "Dinner":
        return "Tối";
      default:
        return "Sáng";
    }
  };

  // -------------------------
  // Tạo danh sách ngày trong plan
  // -------------------------
  const getPlanDates = () => {
    if (!startDate || !endDate) return [];
    const list = [];
    let current = new Date(startDate);
    while (current <= endDate) {
      list.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return list;
  };

  // -------------------------
  // Lấy món theo ngày + bữa
  // -------------------------
  const getRecipesFor = (date: Date, mealTime: string) => {
    const dateISO = date.toISOString().split("T")[0];
    const saved = recipes.filter(
      (r) => r.date === dateISO && r.meal_time === mealTime
    );
    console.log("Món đã lưu:", saved);

    const temp = tempMeals
      .filter((t) => t.date === dateISO && t.meal_time === mealTime)
      .map((t) => t.recipe);

    return [...saved, ...temp];
  };

  // -------------------------
  // Chọn món tạm
  // -------------------------
  const handleAddRecipe = (recipe: any) => {
    if (!selectedDate) return;

    const dateISO = selectedDate.toISOString().split("T")[0];

    setTempMeals((prev) => [
      ...prev,
      { date: dateISO, meal_time: selectedMealTime, recipe },
    ]);

    toast.success("Đã thêm món vào kế hoạch tạm");
    setShowDialog(false);
  };

  // -------------------------
  // Lưu tất cả món trong kế hoạch
  // -------------------------
  const handleSaveMealPlan = async () => {
    if (tempMeals.length === 0) {
      toast.error("Bạn chưa chọn món nào");
      return;
    }

    try {
      for (const item of tempMeals) {
        await mealPlanAPI.addRecipe(id!, {
          recipe_id: item.recipe.recipe_id,
          meal_type: convertMealType(item.meal_time),
          scheduled_date: item.date,
        });
      }

      toast.success("Đã lưu kế hoạch!");

      setRecipes((prev) => [
        ...prev,
        ...tempMeals.map((m) => ({
          date: m.date,
          meal_time: m.meal_time,
          title: m.recipe.title,
        })),
      ]);

      setTempMeals([]);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi lưu kế hoạch");
    }
  };

  // -------------------------
  // Xuất PDF Shopping List
  // -------------------------
  const handleGenerateShoppingListPDF = async () => {
  if (!id) return toast.error("Chưa có kế hoạch");

  try {
    await shoppingListAPI.generate(id);
    const res = await shoppingListAPI.get(id);

    const list = res.data;
    if (!Array.isArray(list) || list.length === 0)
      return toast.error("Không có nguyên liệu");

    // 🔹 Hàm chuẩn hóa unit
    const normalizeUnit = (unit: string) => {
      unit = unit.toLowerCase();
      if (unit === "kg") return "g";
      if (unit === "l") return "ml";
      return unit;
    };

    // 🔹 Gộp nguyên liệu trùng với unit chuẩn hóa
    const mergedIngredients: Record<string, { quantity: number; unit: string }> = {};

    list.forEach((item: any) => {
      const ingredientName = item.Ingredient?.name || "Không rõ";
      let qty = item.quantity != null ? parseFloat(item.quantity) : 0;
      let unit = item.unit || "-";

      const normalizedUnit = normalizeUnit(unit);

      // Chuyển số lượng theo unit chuẩn (kg → g, l → ml)
      if (unit.toLowerCase() === "kg") qty *= 1000; // kg → g
      if (unit.toLowerCase() === "l") qty *= 1000;  // l → ml

      const key = `${ingredientName}||${normalizedUnit}`;

      if (mergedIngredients[key]) {
        mergedIngredients[key].quantity += qty;
      } else {
        mergedIngredients[key] = { quantity: qty, unit: normalizedUnit };
      }
    });

    // 🔹 Chuyển về mảng để in PDF
    const body = Object.entries(mergedIngredients).map(([key, info]) => {
      const [name] = key.split("||");
      let { quantity, unit } = info;

      // Hiển thị hợp lý: >1000 g → kg, >1000 ml → l
      if (unit === "g" && quantity >= 1000) {
        quantity = quantity / 1000;
        unit = "kg";
      }
      if (unit === "ml" && quantity >= 1000) {
        quantity = quantity / 1000;
        unit = "l";
      }

      return [name, quantity.toFixed(2), unit];
    });

    const pdf = new jsPDF();
    pdf.text("DANH SÁCH MUA SẮM", 70, 15);

    autoTable(pdf, {
      startY: 30,
      head: [["Nguyên liệu", "Số lượng", "Đơn vị"]],
      body,
    });

    pdf.save("shopping-list.pdf");
    toast.success("Đã tải PDF");
  } catch (err) {
    console.error(err);
    toast.error("Không thể tạo danh sách");
  }
};


  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Chi tiết kế hoạch bữa ăn</h1>

          <div className="flex gap-2">
            <Button onClick={handleSaveMealPlan} className="gap-2">
              <Save className="w-4 h-4" /> Lưu kế hoạch
            </Button>

            <Button onClick={handleGenerateShoppingListPDF} className="gap-2">
              <ShoppingCart className="w-4 h-4" /> Xuất danh sách
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
          {getPlanDates().map((date, idx) => {
            return (
              <Card key={idx} className="overflow-hidden hover:shadow-md transition">
                <div className="border-b bg-secondary/50 p-3 text-center">
                  <div className="text-xs font-medium text-muted-foreground">
                    {getDayLabel(date)}
                  </div>
                  <div className="text-2xl font-bold">{date.getDate()}</div>
                </div>

                <div className="p-3 space-y-3">
                  {mealTimes.map((meal) => (
                    <div
                      key={meal.name}
                      className="group flex items-start gap-2 border border-dashed rounded-lg p-2 hover:border-primary hover:bg-primary/5 transition"
                    >
                      <span className="text-lg">{meal.icon}</span>

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium">{meal.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {getRecipesFor(date, meal.name).length > 0
                            ? getRecipesFor(date, meal.name).map((r, i) => (
                                <div key={i}>{r.title}</div>
                              ))
                            : "Chưa có món"}
                        </div>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedMealTime(meal.name);
                          setShowDialog(true);
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </main>

      {showDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[400px] shadow-lg">
            <h3 className="text-lg font-semibold mb-3">
              Chọn món cho {selectedDate?.toISOString().split("T")[0]} – {selectedMealTime}
            </h3>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {allRecipes.map((recipe) => (
                <div
                  key={recipe.recipe_id}
                  className="p-2 border rounded hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleAddRecipe(recipe)}
                >
                  {recipe.title}
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="secondary" onClick={() => setShowDialog(false)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlanDetail;
