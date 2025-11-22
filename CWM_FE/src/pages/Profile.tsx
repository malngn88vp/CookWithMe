import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { recipeAPI } from '@/services/api';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChefHat } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const Profile = () => {
  const { user, token, updateUser } = useAuth();
  const [myRecipes, setMyRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State chỉnh sửa
  const [name, setName] = useState(user?.name || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
      toast.error("Không thể tải công thức");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!token) return;

    setSaving(true);

    try {
      // 1️⃣ Update name bằng JSON
      const nameRes = await fetch("http://localhost:5000/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      const nameData = await nameRes.json();
      if (!nameRes.ok) throw new Error(nameData.message);

      // Cập nhật context
      updateUser({
        ...user,
        name: nameData.user.name,
      });

      // 2️⃣ Nếu có avatar → upload riêng
      if (avatarFile) {
        const form = new FormData();
        form.append("avatar", avatarFile);

        const avatarRes = await fetch("http://localhost:5000/api/auth/update-avatar", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        });

        const avatarData = await avatarRes.json();
        if (!avatarRes.ok) throw new Error(avatarData.message);

        updateUser({
          ...user,
          avatar_url: avatarData.avatar_url,
        });
      }

      toast.success("Cập nhật hồ sơ thành công!");

      setAvatarFile(null);
      setAvatarPreview(null);
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Lỗi cập nhật hồ sơ");
    } finally {
      setSaving(false);
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

      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* ----------------------------------------------------------- */}
        {/*  PROFILE HEADER */}
        {/* ----------------------------------------------------------- */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">

              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-24 w-24">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="preview" />
                  ) : user.avatar_url ? (
                    <img src={user.avatar_url} alt="avatar" />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {user.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>

                {/* Chỉ hiện nút đổi avatar khi đang edit */}
                {isEditing && (
                  <>
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
                  </>
                )}
              </div>

              <div className="flex-1">

                {/* ------------------------------------------------ */}
                {/* 1️⃣ XEM THÔNG TIN (không chỉnh sửa) */}
                {/* ------------------------------------------------ */}
                {!isEditing && (
                  <>
                    <h1 className="mb-2 text-3xl font-bold">{user.name}</h1>
                    <p className="mb-4 text-muted-foreground">{user.email}</p>

                    <Button onClick={() => setIsEditing(true)}>Chỉnh sửa hồ sơ</Button>

                    <div className="flex gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <ChefHat className="h-5 w-5 text-primary" />
                        <span className="font-semibold">{myRecipes.length}</span>
                        <span className="text-sm text-muted-foreground">Công thức</span>
                      </div>
                    </div>
                  </>
                )}

                {/* ------------------------------------------------ */}
                {/* 2️⃣ CHẾ ĐỘ CHỈNH SỬA */}
                {/* ------------------------------------------------ */}
                {isEditing && (
                  <div className="w-full max-w-sm">
                    <label className="block mb-2 mt-2 text-muted-foreground">Tên người dùng</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nhập tên mới"
                      className="mb-4"
                    />

                    <div className="flex gap-3">
                      <Button onClick={handleSaveProfile} disabled={saving}>
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                      </Button>

                      <Button
                        variant="secondary"
                        onClick={() => {
                          setIsEditing(false);
                          setName(user.name);
                          setAvatarPreview(null);
                          setAvatarFile(null);
                        }}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </CardContent>
        </Card>

        {/* ----------------------------------------------------------- */}
        {/*  MY RECIPES (giữ nguyên) */}
        {/* ----------------------------------------------------------- */}
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
                  const recipesByStatus = myRecipes.filter((r) => r.status === status);
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
                          <Link key={recipe.recipe_id} to={`/recipes/${recipe.recipe_id}`}>
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
                <p className="mb-4 text-muted-foreground">Bạn chưa có công thức nào</p>
                <Button asChild>
                  <Link to="/recipes/new">Thêm công thức đầu tiên</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Profile;
