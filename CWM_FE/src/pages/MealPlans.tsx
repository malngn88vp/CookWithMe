import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { mealPlanAPI } from "@/services/api";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Calendar, PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function MealPlans() {
  const navigate = useNavigate();
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ⭐ Suggest feature
  const [suggestType, setSuggestType] = useState<"eat-clean" | "keto" | "healthy">("eat-clean");
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  useEffect(() => {
    fetchMealPlans();
  }, []);

  const fetchMealPlans = async () => {
    try {
      const res = await mealPlanAPI.getAll();
      // API returns array or object depending on backend; adapt if needed
      setMealPlans(res.data || res.data.mealPlans || []);
    } catch (err) {
      console.error("❌ Lỗi tải kế hoạch:", err);
      toast.error("Không thể tải kế hoạch");
    }
  };

  const handleCreateMealPlan = async () => {
    if (!title || !startDate || !endDate) {
      toast.error("Vui lòng nhập đủ thông tin");
      return;
    }

    try {
      await mealPlanAPI.create({
        title,
        start_date: startDate,
        end_date: endDate,
      });

      toast.success("Đã tạo kế hoạch");
      fetchMealPlans();
      setTitle("");
      setStartDate("");
      setEndDate("");
    } catch (err) {
      console.error("❌ Lỗi tạo kế hoạch:", err);
      toast.error("Không thể tạo kế hoạch");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa kế hoạch này?")) return;
    try {
      await mealPlanAPI.delete(id);
      toast.success("Đã xóa kế hoạch");
      fetchMealPlans();
    } catch (err) {
      console.error("❌ Lỗi xóa kế hoạch:", err);
      toast.error("Không thể xóa kế hoạch");
    }
  };

  // ---------------- Suggest handler ----------------
  const handleSuggestMealPlan = async () => {
    if (!title || !startDate || !endDate) {
      return toast.error("Vui lòng nhập tiêu đề và ngày (bắt đầu & kết thúc)");
    }

    setLoadingSuggest(true);
    try {
      const payload = {
        title,
        start_date: startDate,
        end_date: endDate,
        type: suggestType, // "eat-clean" | "keto" | "healthy"
      };

      const res = await mealPlanAPI.suggest(payload);

      // Backend should return created mealPlan (mealplan_id)
      const mealPlan = res.data?.mealPlan || res.data?.mealplan || res.data;

      toast.success("Đã tạo thực đơn gợi ý thành công!");
      fetchMealPlans();
      setTitle("");
      setStartDate("");
      setEndDate("");

      // navigate to new plan if backend returns id
      const id = mealPlan?.mealplan_id || mealPlan?.id || res.data?.mealPlanId;
      if (id) navigate(`/meal-plans/${id}`);
    } catch (err: any) {
      console.error("❌ Gợi ý thất bại:", err);
      console.error("🔍 Response:", err?.response);
      console.error("🔍 Response data:", err?.response?.data);
      console.error("🔍 Status:", err?.response?.status);
      toast.error(err?.response?.data?.message || "Không thể gợi ý thực đơn");
    }finally {
      setLoadingSuggest(false);
    }
  };

  return (
    <>
      <Navbar />

      {/* HERO SMALL SECTION */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-12 mb-10">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2">Quản lý Kế hoạch Bữa ăn</h1>
          <p className="text-orange-100 text-lg">
            Tạo và quản lý kế hoạch bữa ăn hằng ngày của bạn một cách dễ dàng
          </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-5xl mx-auto p-6 space-y-10">
        {/* Tạo kế hoạch mới */}
        <Card className="p-6 shadow-md rounded-2xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-orange-500" /> Tạo kế hoạch mới
          </h2>

          <div className="space-y-4">
            <Input
              placeholder="Tiêu đề kế hoạch (vd: Thực đơn tuần này)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl"
            />

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium">Ngày bắt đầu</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 rounded-xl"
                />
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium">Ngày kết thúc</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>

            {/* Suggest options */}
            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm font-medium">Loại thực đơn</label>
                <select
                  value={suggestType}
                  onChange={(e) => setSuggestType(e.target.value as any)}
                  className="ml-2 border rounded-xl px-3 py-2"
                >
                  <option value="eat-clean">Eat Clean</option>
                  <option value="keto">Keto</option>
                  <option value="healthy">Healthy</option>
                </select>
              </div>

              <div className="ml-auto flex gap-2">
                <Button
                  onClick={handleCreateMealPlan}
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                >
                  Tạo kế hoạch
                </Button>

                <Button
                  onClick={handleSuggestMealPlan}
                  className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
                  disabled={loadingSuggest}
                >
                  {loadingSuggest ? "Đang tạo..." : "Gợi ý thực đơn tự động"}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Danh sách kế hoạch */}
        <div>
          <h2 className="text-xl font-bold mb-4">📖 Kế hoạch của bạn</h2>

          {mealPlans.length === 0 ? (
            <p className="text-gray-500">Chưa có kế hoạch nào.</p>
          ) : (
            <div className="space-y-4">
              {mealPlans.map((plan) => (
                <Card
                  key={plan.mealplan_id || plan.id || plan.mealPlanId}
                  className="p-5 rounded-2xl shadow-md hover:shadow-lg transition cursor-pointer flex justify-between items-center group"
                  onClick={() => navigate(`/meal-plans/${plan.mealplan_id || plan.id || plan.mealPlanId}`)}
                >
                  <div>
                    <p className="text-lg font-semibold group-hover:text-orange-600 transition">
                      {plan.title}
                    </p>

                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {plan.start_date} → {plan.end_date}
                    </p>
                  </div>

                  <Button
                    variant="destructive"
                    className="rounded-xl"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(plan.mealplan_id || plan.id || plan.mealPlanId);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
