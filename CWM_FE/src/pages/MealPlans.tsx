import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { mealPlanAPI } from "@/services/api";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";

export default function MealPlans() {
  const navigate = useNavigate();
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchMealPlans();
  }, []);

  const fetchMealPlans = async () => {
    try {
      const res = await mealPlanAPI.getAll();
      setMealPlans(res.data);
    } catch (err) {
      console.error("❌ Lỗi tải kế hoạch:", err);
    }
  };

  const handleCreateMealPlan = async () => {
    if (!title || !startDate || !endDate) return alert("Vui lòng nhập đủ thông tin");
    try {
      const res = await mealPlanAPI.create({ title, start_date: startDate, end_date: endDate });
      fetchMealPlans();
      setTitle("");
      setStartDate("");
      setEndDate("");
    } catch (err) {
      console.error("❌ Lỗi tạo kế hoạch:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa kế hoạch này?")) return;
    try {
      await mealPlanAPI.delete(id);
      fetchMealPlans();
    } catch (err) {
      console.error("❌ Lỗi xóa kế hoạch:", err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          📅 Quản lý Kế hoạch Bữa ăn
        </h1>

        <Card className="p-4 space-y-3">
          <Input
            placeholder="Tiêu đề kế hoạch"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex gap-3">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button onClick={handleCreateMealPlan}>Tạo kế hoạch</Button>
        </Card>

        <div className="space-y-3">
          <h2 className="font-semibold text-lg">📖 Kế hoạch của bạn</h2>
          {mealPlans.length === 0 ? (
            <p>Chưa có kế hoạch nào.</p>
          ) : (
            mealPlans.map((plan) => (
              <Card
                key={plan.mealplan_id}
                className="flex justify-between items-center p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/meal-plans/${plan.mealplan_id}`)}
              >
                <div>
                  <p className="font-bold">{plan.title}</p>
                  <p className="text-sm text-gray-500">
                    {plan.start_date} → {plan.end_date}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(plan.mealplan_id);
                  }}
                >
                  Xóa
                </Button>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  );
}
