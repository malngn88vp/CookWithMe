import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "@/services/api";
import { toast } from "sonner";

interface User {
  user_id: number;
  name: string;
  email: string;
  role?: string;
  avatar_url?: string;
  is_locked?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (!savedToken) {
        setLoading(false);
        return;
      }

      setToken(savedToken);

      try {
        const res = await authAPI.getProfile();
        const userData = res.data.user;

        if (userData.is_locked) {
          logout();
          return;
        }

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } catch (err) {
        // ❗ Không logout nếu backend lỗi → fallback vào localStorage
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      }

      setLoading(false);
    };

    init();
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    const res = await authAPI.login({ email, password });
    const { token, user: userData } = res.data;

    setToken(token);
    setUser(userData);

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));

    toast.success("Đăng nhập thành công!");
    return userData;
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await authAPI.register({ name, email, password });
    const { token, user: userData } = res.data;

    setToken(token);
    setUser(userData);

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));

    toast.success("Đăng ký thành công!");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setToken(null);

    toast.success("Đã đăng xuất");
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
