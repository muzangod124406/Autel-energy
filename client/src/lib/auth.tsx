import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiRequest } from "./queryClient";

interface User {
  id: string;
  phone: string;
  country: string;
  referralCode: string;
  referredBy: string | null;
  balance: number;
  depositBalance: number;
  withdrawBalance: number;
  productRevenue: number;
  commissionBalance: number;
  spinTickets: number;
  vipLevel: number;
  isAdmin: boolean;
  isBanned: boolean;
  isPromoter: boolean;
  withdrawBlocked: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string, country: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (phone: string, password: string, country: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { phone, password, country });
    const data = await res.json();
    setUser(data.user);
  };

  const register = async (data: any) => {
    const res = await apiRequest("POST", "/api/auth/register", data);
    const result = await res.json();
    setUser(result.user);
  };

  const logout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
