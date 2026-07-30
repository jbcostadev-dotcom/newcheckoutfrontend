"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { api, setToken } from "@/lib/api";
import { AuthProvider } from "@/contexts/AuthContext";
import { GuestOnly } from "@/components/auth-guard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await api.post<{ token: string } & Record<string, unknown>>(
        "/login",
        { email, password },
        { auth: false }
      );
      // The Laravel AuthController returns `access_token` or `token`
      const token = (data as Record<string, unknown>).token as string
        ?? (data as Record<string, unknown>).access_token as string;
      setToken(token);
      toast.success("Login realizado com sucesso!");
      window.location.href = "/dashboard";
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Credenciais inválidas.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthProvider>
      <GuestOnly>
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Theme toggle fixo no topo */}
          <div className="fixed right-4 top-4">
            <ThemeToggle />
          </div>

          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-col items-center space-y-2 pb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold tracking-tight">
                  Bem-vindo de volta
                </h1>
                <p className="text-sm text-muted-foreground">
                  Acesse seu painel para gerenciar o checkout
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar no Painel"}
                </Button>
              </form>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Não tem uma conta?{" "}
                <Link
                  href="/register"
                  className="font-medium text-primary hover:underline"
                >
                  Criar conta
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </GuestOnly>
    </AuthProvider>
  );
}
