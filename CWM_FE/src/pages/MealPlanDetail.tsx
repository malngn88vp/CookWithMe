import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mealPlanAPI, recipeAPI, shoppingListAPI } from "@/services/api";
import { toast } from "sonner";
import { Save, ShoppingCart, Plus, X, CalendarDays } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const MealPlanDetail = () => {
  const { id } = useParams();

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [allRecipes, setAllRecipes] = useState<any[]>([]);
  const [tempMeals, setTempMeals] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealTime, setSelectedMealTime] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const mealTimes = [
    { icon: "☀️", name: "Sáng" },
    { icon: "🌅", name: "Trưa" },
    { icon: "🌙", name: "Tối" },
  ];

  const toDateLocal = (date: Date) => date.toISOString().split("T")[0];

  const convertMealTypeReverse = (type: any) => {
    const t = String(type || "").toLowerCase();
    if (t.includes("breakfast")) return "Sáng";
    if (t.includes("lunch")) return "Trưa";
    if (t.includes("dinner")) return "Tối";
    return "Sáng";
  };

  const convertMealType = (label: string) => {
    if (label === "Sáng") return "Breakfast";
    if (label === "Trưa") return "Lunch";
    if (label === "Tối") return "Dinner";
    return "Snack";
  };

  const getDayLabel = (d: Date) =>
    ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][d.getDay()];

  // ================= FETCH =================
  useEffect(() => {
    if (id) {
      fetchPlan(id);
      fetchAllRecipes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchAllRecipes = async () => {
    try {
      const res = await recipeAPI.getAll();
      const data = res.data?.recipes ?? res.data ?? [];

      setAllRecipes(
        data.map((r: any) => ({
          ...r,
          recipe_id: r.recipe_id ?? r.id,
          title: r.title ?? r.name ?? "Không rõ",
        }))
      );
    } catch {
      toast.error("Không thể tải danh sách món ăn");
    }
  };

  const fetchPlan = async (planId: string) => {
    try {
      const res = await mealPlanAPI.getById(planId);
      const plan = res.data;

      if (plan.start_date) setStartDate(new Date(plan.start_date));
      if (plan.end_date) setEndDate(new Date(plan.end_date));

      const mapped =
        plan.recipes?.map((item: any) => {
          const mp = item.MealPlanRecipe;
          const dateISO = mp.scheduled_date.includes("T")
            ? mp.scheduled_date.split("T")[0]
            : mp.scheduled_date;

          return {
            unique_id: `${mp.mealplan_id}-${mp.recipe_id}-${mp.meal_type}-${dateISO}`,
            recipe_id: mp.recipe_id,
            title: item.title,
            date: dateISO,
            meal_time: convertMealTypeReverse(mp.meal_type),
            isTemp: false,
          };
        }) ?? [];

      setRecipes(mapped);
    } catch {
      toast.error("Không thể tải kế hoạch");
    }
  };

  // ================= RENDER =================
  const getPlanDates = () => {
    if (!startDate || !endDate) return [];
    const arr: Date[] = [];
    const cur = new Date(startDate);
    const end = new Date(endDate);

    while (cur <= end) {
      arr.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return arr;
  };

  const getRecipesFor = (date: Date, meal: string) => {
    const d = toDateLocal(date);

    const saved = recipes.filter((r) => r.date === d && r.meal_time === meal);

    const temp = tempMeals
      .filter((t) => t.date === d && t.meal_time === meal)
      .map((t) => ({
        unique_id: `temp-${t.recipe.recipe_id}-${t.date}-${t.meal_time}`,
        recipe_id: t.recipe.recipe_id,
        title: t.recipe.title,
        date: t.date,
        meal_time: t.meal_time,
        isTemp: true,
      }));

    return [...saved, ...temp];
  };

  // ================= ACTION =================
  const handleAddRecipe = (recipe: any) => {
    const dateISO = toDateLocal(selectedDate!);

    // Prevent duplicate within same date+meal (optional)
    const exists = tempMeals.some(
      (t) => t.recipe.recipe_id === recipe.recipe_id && t.date === dateISO && t.meal_time === selectedMealTime
    );
    if (exists) {
      toast.warning("Món này đã tồn tại ở bữa đó (tạm thời).");
      return;
    }

    setTempMeals((prev) => [
      ...prev,
      { recipe, date: dateISO, meal_time: selectedMealTime },
    ]);

    toast.success("Đã thêm món");
    setShowDialog(false);
  };

  const handleDeleteRecipe = async (item: any) => {
    if (item.isTemp) {
      setTempMeals((prev) =>
        prev.filter(
          (t) =>
            !(
              t.recipe.recipe_id === item.recipe_id &&
              t.date === item.date &&
              t.meal_time === item.meal_time
            )
        )
      );
      return;
    }

    try {
      await mealPlanAPI.removeRecipe(id!, item.recipe_id);
      toast.success("Đã xoá món");
      fetchPlan(id!);
    } catch {
      toast.error("Không thể xoá");
    }
  };

  const handleSave = async () => {
    try {
      for (const t of tempMeals) {
        await mealPlanAPI.addRecipe(id!, {
          recipe_id: t.recipe.recipe_id,
          meal_type: convertMealType(t.meal_time),
          scheduled_date: t.date,
        });
      }
      toast.success("Đã lưu");
      setTempMeals([]);
      fetchPlan(id!);
    } catch (err) {
      console.error("Lưu lỗi:", err);
      toast.error("Lưu thất bại");
    }
  };

  // PDF xuất danh sách mua sắm
  const handlePDF = async () => {
    try {
      await shoppingListAPI.generate(id!);
      const res = await shoppingListAPI.get(id!);

      const list = res.data;
      if (!list.length) return toast.error("Không có nguyên liệu");

      const merged: any = {};
      list.forEach((i: any) => {
        const name = i.Ingredient?.name || "Không rõ";
        const unit = i.unit || "";
        const key = `${name}-${unit}`;

        merged[key] = merged[key] || { name, quantity: 0, unit };
        merged[key].quantity += Number(i.quantity);
      });

      const pdf = new jsPDF();
      pdf.text("Danh sách mua sắm", 70, 10);

      autoTable(pdf, {
        head: [["Nguyên liệu", "Số lượng", "Đơn vị"]],
        body: Object.values(merged).map((i: any) => [i.name, i.quantity, i.unit]),
      });

      pdf.save("shopping-list.pdf");
      toast.success("Đã xuất PDF");
    } catch {
      toast.error("Không thể tạo PDF");
    }
  };

  // ================= UI =================
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* HERO */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-10 mb-10">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <CalendarDays className="h-8 w-8" /> Chi tiết kế hoạch bữa ăn
          </h1>
          <p className="text-orange-100 text-lg">Quản lý chi tiết từng bữa ăn trong kế hoạch của bạn</p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 pb-10">
        {/* ACTION BAR */}
        <div className="flex justify-end mb-6 gap-3">
          <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white gap-2 rounded-xl">
            <Save className="w-4 h-4" /> Lưu thay đổi
          </Button>

          <Button onClick={handlePDF} className="bg-white text-orange-600 border border-orange-300 hover:bg-orange-50 gap-2 rounded-xl">
            <ShoppingCart className="w-4 h-4" /> Xuất danh sách
          </Button>
        </div>

        {/* GRID NGÀY */}
        <div className="grid gap-6 justify-center md:grid-cols-4 lg:grid-cols-7">
          {getPlanDates().map((date, idx) => (
            <Card key={idx} className="overflow-hidden rounded-2xl bg-white shadow-lg border border-orange-100 hover:shadow-xl transition">
              {/* Header ngày */}
              <div className="p-4 bg-gradient-to-b from-orange-400 to-orange-300 text-center text-white">
                <div className="text-xs opacity-80">{getDayLabel(date)}</div>
                <div className="text-3xl font-bold">{date.getDate()}</div>
              </div>

              {/* Meal container */}
              <div className="p-3 space-y-5">
                {mealTimes.map((meal) => (
                  <div key={meal.name} className="space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-sm text-orange-700">
                      <span>{meal.icon}</span>
                      {meal.name}
                    </div>

                    {/* List */}
                    {getRecipesFor(date, meal.name).length === 0 ? (
                      <div className="text-xs text-gray-400 italic">Chưa có món</div>
                    ) : (
                      getRecipesFor(date, meal.name).map((r) => (
                        <div key={r.unique_id} className="flex items-center justify-between bg-white border border-orange-100 shadow-sm px-3 py-2 rounded-xl hover:bg-orange-50 transition group">
                          <span className="text-sm text-gray-700">{r.title}</span>

                          <button onClick={() => handleDeleteRecipe(r)} className="p-1 text-red-500 hover:bg-red-100 rounded-md hidden group-hover:block">
                            <X size={14} />
                          </button>
                        </div>
                      ))
                    )}

                    {/* Add button */}
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-orange-600 hover:bg-orange-100 rounded-full border border-orange-200" onClick={() => {
                      setSelectedDate(date);
                      setSelectedMealTime(meal.name);
                      setShowDialog(true);
                    }}>
                      <Plus size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </main>

      {/* Dialog chọn món */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white w-[400px] p-6 rounded-2xl shadow-xl border border-orange-100">
            <h2 className="font-bold text-lg mb-3">Chọn món – {selectedMealTime}</h2>

            <div className="max-h-64 overflow-y-auto space-y-1">
              {allRecipes.map((r) => (
                <div key={r.recipe_id} onClick={() => handleAddRecipe(r)} className="p-2 border rounded-xl hover:bg-gray-50 cursor-pointer transition">
                  {r.title}
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="secondary" className="rounded-xl" onClick={() => setShowDialog(false)}>Đóng</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlanDetail;
