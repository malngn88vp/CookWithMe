import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X, Search } from "lucide-react";
import { ingredientAPI } from "../../services/api";
import toast from "react-hot-toast";

export const AdminIngredients = () => {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ========================= LOAD DATA =========================
  useEffect(() => {
    fetchIngredients();
  }, []);

  useEffect(() => {
    const filtered = ingredients.filter(
      (ing) =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ing.default_unit?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredIngredients(filtered);
  }, [searchTerm, ingredients]);

  const fetchIngredients = async () => {
    try {
      const response = await ingredientAPI.getAll();

      const data = response.data.data || [];

      setIngredients(data);
      setError("");
    } catch (error) {
      console.error("❌ Failed to fetch ingredients:", error);
      toast.error("Không thể tải nguyên liệu!");
    } finally {
      setLoading(false);
    }
  };

  // ========================= ADD =========================
  const handleAdd = async () => {
    if (!formData.name.trim()) {
      setError("Tên nguyên liệu là bắt buộc");
      return;
    }

    try {
      await ingredientAPI.create({
        name: formData.name,
        default_unit: formData.unit,
        calories: Number(formData.calories || 0),
        protein: Number(formData.protein || 0),
        carbs: Number(formData.carbs || 0),
        fat: Number(formData.fat || 0),
      });

      resetForm();
      fetchIngredients();
      toast.success("Đã thêm nguyên liệu");
    } catch (error) {
      setError("Không thể thêm nguyên liệu");
    }
  };

  // ========================= UPDATE =========================
  const handleUpdate = async (id: number) => {
    if (!formData.name.trim()) {
      setError("Tên nguyên liệu là bắt buộc");
      return;
    }

    try {
      await ingredientAPI.update(id, {
        name: formData.name,
        default_unit: formData.unit,
        calories: Number(formData.calories || 0),
        protein: Number(formData.protein || 0),
        carbs: Number(formData.carbs || 0),
        fat: Number(formData.fat || 0),
      });

      resetForm();
      fetchIngredients();
      toast.success("Đã cập nhật nguyên liệu");
    } catch (error) {
      setError("Không thể cập nhật nguyên liệu");
    }
  };

  // ========================= DELETE =========================
  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá nguyên liệu này?"))
      return;

    try {
      await ingredientAPI.delete(id);
      fetchIngredients();
      toast.success("Đã xoá nguyên liệu");
    } catch (error) {
      toast.error("Không thể xoá nguyên liệu");
    }
  };

  // ========================= FORM CONTROL =========================
  const startEdit = (ingredient: any) => {
    setEditingId(ingredient.ingredient_id);

    setFormData({
      name: ingredient.name,
      unit: ingredient.default_unit || "",
      calories: ingredient.calories ?? "",
      protein: ingredient.protein ?? "",
      carbs: ingredient.carbs ?? "",
      fat: ingredient.fat ?? "",
    });

    setError("");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      unit: "",
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
    });
    setEditingId(null);
    setIsAdding(false);
    setError("");
  };

  // ========================= UI =========================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-12 w-12 border-b-2 border-orange-500 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Nguyên liệu</h1>

        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
          >
            <Plus className="h-5 w-5" /> Thêm nguyên liệu
          </button>
        )}
      </div>

      {/* SEARCH */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg mb-6">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm nguyên liệu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent outline-none flex-1"
          />
        </div>

        {/* ADD FORM */}
        {isAdding && (
          <IngredientForm
            formData={formData}
            setFormData={setFormData}
            submit={handleAdd}
            cancel={resetForm}
          />
        )}

        {/* LIST */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredIngredients.map((ing) =>
            editingId === ing.ingredient_id ? (
              <IngredientForm
                key={ing.ingredient_id}
                formData={formData}
                setFormData={setFormData}
                submit={() => handleUpdate(ing.ingredient_id)}
                cancel={resetForm}
              />
            ) : (
              <div
                key={ing.ingredient_id}
                className="border rounded-lg p-4 shadow-sm bg-white"
              >
                <h3 className="font-semibold text-lg">{ing.name}</h3>

                {ing.default_unit && (
                  <p className="text-gray-600 mt-1 text-sm">
                    Đơn vị: {ing.default_unit}
                  </p>
                )}

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <button
                    onClick={() => startEdit(ing)}
                    className="flex-1 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100"
                  >
                    <Edit2 className="h-4 w-4 inline-block mr-1" />
                    Sửa
                  </button>

                  <button
                    onClick={() => handleDelete(ing.ingredient_id)}
                    className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4 inline-block mr-1" />
                    Xoá
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

/* ======================================================
   COMPONENT: FORM dùng chung cho ADD + EDIT
====================================================== */

const IngredientForm = ({ formData, setFormData, submit, cancel }: any) => {
  return (
    <div className="p-5 bg-orange-50 border border-orange-200 rounded-lg mb-6">
      <h3 className="text-lg font-semibold mb-4">Thông tin nguyên liệu</h3>

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Tên *" value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} />
        <Field label="Đơn vị" value={formData.unit} onChange={(v) => setFormData({ ...formData, unit: v })} />

        <Field label="Calories / 100g" type="number" value={formData.calories} onChange={(v) => setFormData({ ...formData, calories: v })} />
        <Field label="Protein (g)" type="number" value={formData.protein} onChange={(v) => setFormData({ ...formData, protein: v })} />

        <Field label="Carbs (g)" type="number" value={formData.carbs} onChange={(v) => setFormData({ ...formData, carbs: v })} />
        <Field label="Fat (g)" type="number" value={formData.fat} onChange={(v) => setFormData({ ...formData, fat: v })} />
      </div>

      <div className="flex gap-2 mt-4">
        <button onClick={submit} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2">
          <Save className="h-4 w-4" /> Lưu
        </button>

        <button onClick={cancel} className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
          <X className="h-4 w-4" /> Huỷ
        </button>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, type = "text" }: any) => (
  <div>
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2 border rounded-lg focus:border-orange-500 mt-1"
    />
  </div>
);
