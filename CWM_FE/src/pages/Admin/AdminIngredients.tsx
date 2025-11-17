import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Search } from 'lucide-react';
import { ingredientAPI } from '../../services/api';
import toast from 'react-hot-toast';

export const AdminIngredients = () => {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', unit: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchIngredients();
  }, []);

  useEffect(() => {
    const filtered = ingredients.filter(ing =>
      ing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ing.unit?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredIngredients(filtered);
  }, [searchTerm, ingredients]);

  const fetchIngredients = async () => {
    try {
      const response = await ingredientAPI.getAll();

      // ✅ Lấy dữ liệu chuẩn
      setIngredients(response.data.data || []);

      // ✅ Reset lỗi cũ nếu load thành công
      setError('');
    } catch (error) {
      console.error('❌ Failed to fetch ingredients:', error);
      setError('Failed to load ingredients');
      toast.error('Không thể tải nguyên liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      setError('Ingredient name is required');
      return;
    }

    try {
      await ingredientAPI.create(formData);
      setFormData({ name: '', unit: '' });
      setIsAdding(false);
      setError('');
      fetchIngredients();
    } catch (error) {
      console.error('Failed to add ingredient:', error);
      setError('Failed to add ingredient');
    }
  };

  const handleUpdate = async (id: number) => {
    if (!formData.name.trim()) {
      setError('Ingredient name is required');
      return;
    }

    try {
      await ingredientAPI.update(id, formData);
      setEditingId(null);
      setFormData({ name: '', unit: '' });
      setError('');
      fetchIngredients();
    } catch (error) {
      console.error('Failed to update ingredient:', error);
      setError('Failed to update ingredient');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this ingredient? This action cannot be undone.')) return;

    try {
      await ingredientAPI.delete(id);
      setError('');
      fetchIngredients();
    } catch (error) {
      console.error('Failed to delete ingredient:', error);
      setError('Failed to delete ingredient');
    }
  };

  const startEdit = (ingredient: any) => {
    setEditingId(ingredient.ingredient_id);
    setFormData({ name: ingredient.name, unit: ingredient.unit || '' });
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ name: '', unit: '' });
    setError('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ingredients</h1>
          <p className="text-gray-600 mt-1">Manage recipe ingredients ({ingredients.length} total)</p>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-md"
          >
            <Plus className="h-5 w-5" />
            <span>Add Ingredient</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-6 flex items-center space-x-2 bg-gray-100 rounded-lg px-4 py-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-900"
          />
        </div>

        {isAdding && (
          <div className="mb-6 p-5 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New Ingredient</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Tomato, Garlic, Salt"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., cups, grams, tbsp"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleAdd}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg font-medium transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        )}

        {filteredIngredients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIngredients.map(ingredient => (
              <div
                key={ingredient.ingredient_id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {editingId === ingredient.ingredient_id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit
                      </label>
                      <input
                        type="text"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdate(ingredient.ingredient_id)}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm"
                      >
                        <Save className="h-4 w-4" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg font-medium transition-colors text-sm"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <h3 className="text-lg font-semibold text-gray-900">{ingredient.name}</h3>
                    {ingredient.unit && (
                      <p className="text-gray-600 text-sm mt-2 flex-1">
                        <span className="font-medium">Unit:</span> {ingredient.unit}
                      </p>
                    )}
                    <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => startEdit(ingredient)}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-sm"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(ingredient.ingredient_id)}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {searchTerm ? 'No ingredients found matching your search.' : 'No ingredients yet. Add your first ingredient!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
