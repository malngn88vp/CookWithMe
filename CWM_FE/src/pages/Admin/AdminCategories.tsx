import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X, Search } from "lucide-react";
import { categoryAPI } from "../../services/api";

export const AdminCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const filtered = categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCategories(filtered);
  }, [searchTerm, categories]);

  const fetchCategories = async () => {
    try {
      const data = await categoryAPI.getAll();
      const cats = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];
      setCategories(cats);
      setError("");
    } catch (error) {
      setError("Không thể tải danh mục");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      setError("Tên danh mục là bắt buộc");
      return;
    }

    try {
      await categoryAPI.create(formData);
      setFormData({ name: "", description: "" });
      setIsAdding(false);
      fetchCategories();
    } catch {
      setError("Không thể thêm danh mục");
    }
  };

  const handleUpdate = async (id: number) => {
    if (!formData.name.trim()) {
      setError("Tên danh mục là bắt buộc");
      return;
    }

    try {
      await categoryAPI.update(id, formData);
      setEditingId(null);
      setFormData({ name: "", description: "" });
      fetchCategories();
    } catch {
      setError("Không thể cập nhật danh mục");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá danh mục này?")) return;

    try {
      await categoryAPI.delete(id);
      fetchCategories();
    } catch {
      setError("Không thể xoá danh mục");
    }
  };

  const startEdit = (category: any) => {
    setEditingId(category.category_id);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ name: "", description: "" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Danh mục</h1>
          <p className="text-gray-600 mt-1">
            Quản lý danh mục ({categories.length} danh mục)
          </p>
        </div>

        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition"
          >
            <Plus className="h-5 w-5" />
            <span>Thêm danh mục</span>
          </button>
        )}
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* CONTENT WRAPPER */}
      <div className="bg-white rounded-xl shadow-md p-6">
        {/* SEARCH */}
        <div className="mb-6 flex items-center gap-3 bg-gray-100 rounded-lg px-4 py-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm danh mục..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none"
          />
        </div>

        {/* FORM THÊM MỚI */}
        {isAdding && (
          <div className="mb-6 p-5 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Thêm danh mục mới
            </h3>

            <div className="space-y-4">
              <div>
                <label className="font-medium text-sm">Tên danh mục *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ví dụ: Món Việt, Ăn sáng, Đồ chay..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-medium text-sm">Mô tả</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Mô tả thêm về danh mục (không bắt buộc)"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Lưu
                </button>

                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Huỷ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LIST */}
        {filteredCategories.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => (
              <div
                key={category.category_id}
                className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition"
              >
                {editingId === category.category_id ? (
                  // FORM EDIT
                  <div className="space-y-4">
                    <div>
                      <label className="font-medium text-sm">Tên danh mục</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="font-medium text-sm">Mô tả</label>
                      <textarea
                        rows={2}
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(category.category_id)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Lưu
                      </button>

                      <button
                        onClick={cancelEdit}
                        className="flex-1 px-3 py-2 border rounded-lg hover:bg-gray-100 flex items-center justify-center"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  // ITEM VIEW
                  <div className="flex flex-col h-full">
                    <h3 className="font-semibold text-lg">{category.name}</h3>

                    {category.description && (
                      <p className="text-gray-600 mt-2">{category.description}</p>
                    )}

                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <button
                        onClick={() => startEdit(category)}
                        className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Sửa
                      </button>

                      <button
                        onClick={() => handleDelete(category.category_id)}
                        className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Xoá
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-10">
            Không có danh mục nào.
          </p>
        )}
      </div>
    </div>
  );
};
