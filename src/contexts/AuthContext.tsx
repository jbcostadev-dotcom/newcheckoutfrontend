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

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
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
    const res = await api.post<{ token: string; user?: User }>("/login", {
      email,
      password,
    });
    setToken(res.token);
    if (res.user) setUser(res.user);
    router.push("/dashboard");
  };

  const register = async (name: string, email: string, password: string) => {
    await api.post("/register", { name, email, password });
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

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, fetchUser }}
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
