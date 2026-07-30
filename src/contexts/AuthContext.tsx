"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api, setToken, getToken } from "@/lib/api";
import type { User } from "@/types";

export interface UpdateProfileData {
  name?: string;
  email?: string;
  phone?: string | null;
}

export interface UpdatePasswordData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<User>;
  updatePassword: (data: UpdatePasswordData) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.get<User>("/user");
      setUser(data);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    // auth: false evita enviar um token antigo e bater no 403 do backend
    // (que proíbe login de quem já está autenticado).
    const res = await api.post<{ token: string; access_token?: string; user?: User }>(
      "/login",
      { email, password },
      { auth: false }
    );
    const token = res.token ?? res.access_token;
    setToken(token);
    if (res.user) setUser(res.user);
    router.push("/dashboard");
  };

  const register = async (name: string, email: string, password: string) => {
    await api.post("/register", { name, email, password }, { auth: false });
    router.push("/");
  };

  const logout = async () => {
    try {
      await api.post("/logout");
    } catch {
      /* token may already be invalid */
    } finally {
      setToken(null);
      setUser(null);
      router.push("/");
    }
  };

  const updateProfile = async (data: UpdateProfileData) => {
    const updated = await api.put<User>("/user", data);
    setUser(updated);
    return updated;
  };

  const updatePassword = async (data: UpdatePasswordData) => {
    await api.put("/user/password", data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        fetchUser,
        updateProfile,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
