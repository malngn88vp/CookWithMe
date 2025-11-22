import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";

const ChangePassword = () => {
  const { token, logout } = useAuth();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    // Validate trước khi gửi
    if (!oldPassword || !newPassword || !confirm) {
      toast.error("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (newPassword !== confirm) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      toast.success("Đổi mật khẩu thành công! Hãy đăng nhập lại.");

      setOldPassword("");
      setNewPassword("");
      setConfirm("");

      // Tự động logout để đảm bảo an toàn
      setTimeout(() => {
        logout();
      }, 1500);

    } catch (err: any) {
      toast.error(err.message || "Lỗi đổi mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 max-w-md py-12">
        <h1 className="text-3xl font-bold mb-6">Đổi mật khẩu</h1>

        {/* MẬT KHẨU CŨ */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">Mật khẩu hiện tại</label>
          <Input
            type="password"
            placeholder="Nhập mật khẩu cũ"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
        </div>

        {/* MẬT KHẨU MỚI */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">Mật khẩu mới</label>
          <Input
            type="password"
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        {/* XÁC NHẬN */}
        <div className="mb-6">
          <label className="block mb-1 text-sm font-medium">Xác nhận mật khẩu mới</label>
          <Input
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        <Button 
          className="w-full" 
          onClick={handleChangePassword} 
          disabled={loading}
        >
          {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
        </Button>
      </div>
    </div>
  );
};

export default ChangePassword;
