import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  // ⏳ Chờ AuthContext load token + user xong
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-medium">
        Đang tải...
      </div>
    );
  }

  // ❌ Không có user → chưa đăng nhập
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // ❌ Tài khoản bị khóa (phòng trường hợp user bị khóa sau khi login)
  if (user.is_locked) {
    return <Navigate to="/auth/login" replace />;
  }

  // 🎯 Kiểm tra role nếu route yêu cầu quyền hạn
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role?.toLowerCase() || "";
    const allowed = allowedRoles.map((r) => r.toLowerCase());

    if (!allowed.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
