import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@/services/api';
import { toast } from 'sonner';

// ==========================
// 🧩 Interface định nghĩa user và context
// ==========================
interface User {
  user_id: number;
  name: string;
  email: string;
  role?: string;
  user_avatar_url?: string;
  token?: string; // để TypeScript không báo lỗi khi có token
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void; // ✅ thêm hàm updateUser
}

// ==========================
// 🧩 Tạo context
// ==========================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==========================
// 🧩 Provider chính
// ==========================
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Load lại từ localStorage khi F5
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // ✅ Đăng nhập
  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user: userData } = response.data;

      const normalizedUser = {
        ...userData,
        role: userData.role?.toLowerCase?.() || '',
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));

      setUser(normalizedUser);
      setToken(token);

      toast.success('Đăng nhập thành công!');
      return normalizedUser;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại');
      throw error;
    }
  };

  // ✅ Đăng ký
  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await authAPI.register({ name, email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      setToken(token);

      toast.success('Đăng ký thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại');
      throw error;
    }
  };

  // ✅ Đăng xuất
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    toast.success('Đã đăng xuất');
  };

  // ✅ Cập nhật thông tin user (dùng khi đổi avatar, đổi tên, v.v.)
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // ✅ Xuất context
  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// ==========================
// 🧩 Hook tiện dụng
// ==========================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
