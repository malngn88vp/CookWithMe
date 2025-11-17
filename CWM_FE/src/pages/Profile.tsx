import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { recipeAPI } from '@/services/api';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChefHat } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const Profile = () => {
  const { user, token, updateUser } = useAuth();
  const [myRecipes, setMyRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user?.user_id) fetchMyRecipes();
  }, [user]);

  const fetchMyRecipes = async () => {
    if (!user?.user_id) return;
    setLoading(true);
    try {
      const response = await recipeAPI.getAll({ user_id: user.user_id });
      setMyRecipes(response.data.recipes);
    } catch {
      toast.error('Không thể tải công thức');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile || !token) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('avatar', avatarFile);

    try {
      const res = await fetch('http://localhost:5000/api/auth/update-avatar', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi upload avatar');

      toast.success('Cập nhật avatar thành công!');
      // ✅ cập nhật avatar trong context và localStorage
      updateUser({
        ...user,
        user_avatar_url: data.avatar_url,
      });
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi upload avatar');
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p>Vui lòng đăng nhập để xem hồ sơ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt={user.name} />
                    ) : user.user_avatar_url ? (
                      <img src={user.user_avatar_url} alt={user.name} />
                    ) : (
                      <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                        {user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  {/* Input file + label overlay */}
                  <input
                    type="file"
                    id="avatarInput"
                    accept="image/*"
                    className="absolute bottom-0 right-0 w-8 h-8 opacity-0 cursor-pointer"
                    onChange={handleAvatarChange}
                  />
                  <label
                    htmlFor="avatarInput"
                    className="absolute bottom-0 right-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    ✏️
                  </label>
                </div>

                <div className="flex-1">
                  <h1 className="mb-2 text-3xl font-bold">{user.name}</h1>
                  <p className="mb-4 text-muted-foreground">{user.email}</p>

                  {/* Nút upload avatar */}
                  {avatarFile && (
                    <Button
                      onClick={handleAvatarUpload}
                      disabled={uploading}
                      className="mb-2"
                    >
                      {uploading ? 'Đang tải...' : 'Cập nhật Avatar'}
                    </Button>
                  )}

                  <div className="flex gap-6 mt-2">
                    <div className="flex items-center gap-2">
                      <ChefHat className="h-5 w-5 text-primary" />
                      <span className="font-semibold">{myRecipes.length}</span>
                      <span className="text-sm text-muted-foreground">Công thức</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* My Recipes */}
          <Card>
            <CardHeader>
              <CardTitle>Công thức của tôi</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : myRecipes.length > 0 ? (
                <>
                  {["Pending", "Approved", "Rejected"].map((status) => {
                    const recipesByStatus = myRecipes.filter(
                      (r) => r.status === status
                    );
                    if (recipesByStatus.length === 0) return null;

                    const statusLabel =
                      status === "Pending"
                        ? "⏳ Đang chờ duyệt"
                        : status === "Approved"
                        ? "✅ Đã duyệt"
                        : "❌ Bị từ chối";

                    const statusColor =
                      status === "Pending"
                        ? "border-yellow-400"
                        : status === "Approved"
                        ? "border-green-500"
                        : "border-red-500";

                    return (
                      <div key={status} className="mb-8">
                        <h3 className="mb-3 text-lg font-semibold">{statusLabel}</h3>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {recipesByStatus.map((recipe) => (
                            <Link
                              key={recipe.recipe_id}
                              to={`/recipes/${recipe.recipe_id}`}
                            >
                              <Card
                                className={`group overflow-hidden transition-all hover:shadow-lg border-l-4 ${statusColor}`}
                              >
                                <div className="relative h-32 overflow-hidden bg-muted">
                                  {recipe.images ? (
                                    <img
                                      src={recipe.images}
                                      alt={recipe.title}
                                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center">
                                      <ChefHat className="h-12 w-12 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <CardContent className="p-4">
                                  <h3 className="line-clamp-2 font-semibold">
                                    {recipe.title}
                                  </h3>
                                </CardContent>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="py-12 text-center">
                  <ChefHat className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="mb-4 text-muted-foreground">
                    Bạn chưa có công thức nào
                  </p>
                  <Button asChild>
                    <Link to="/recipes/new">Thêm công thức đầu tiên</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
