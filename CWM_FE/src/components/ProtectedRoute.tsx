import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  // ⏳ Đợi load user từ localStorage
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-medium">
        Đang tải...
      </div>
    );
  }

  // 🚫 Nếu chưa đăng nhập
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // 🚷 Nếu không đúng vai trò (chuyển hết về chữ thường)
  const userRole = user.role?.toLowerCase() || "";
  const allowed = allowedRoles?.map(r => r.toLowerCase()) || [];

  if (allowed.length > 0 && !allowed.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  // ✅ Cho phép truy cập
  return <>{children}</>;
};

export default ProtectedRoute;
