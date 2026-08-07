"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { api, setToken } from "@/lib/api";
import { AuthProvider } from "@/contexts/AuthContext";
import { GuestOnly } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { AuthPasswordInput } from "@/components/auth-password-input";
import { AuthShell } from "@/components/auth-shell";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handleSubmit = async (event: React.FormEvent) => { event.preventDefault(); setLoading(true); try { const data = await api.post<{ token: string } & Record<string, unknown>>("/login", { email, password }, { auth: false }); const token = (data as Record<string, unknown>).token as string ?? (data as Record<string, unknown>).access_token as string; setToken(token); toast.success("Login realizado com sucesso!"); window.location.href = "/dashboard"; } catch (err) { toast.error(err instanceof Error ? err.message : "Credenciais inválidas."); } finally { setLoading(false); } };
  return <AuthProvider><GuestOnly><AuthShell activePage="login"><header className="auth-heading"><h1>Acesse sua conta</h1><p>Gerencie seus checkouts em um só lugar.</p></header><form onSubmit={handleSubmit} className="auth-form"><div className="auth-field"><Mail className="auth-field__icon" aria-hidden="true" /><input id="email" type="email" required placeholder="Entre com seu e-mail" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></div><AuthPasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" /><Link href="#" className="auth-help-link">Esqueci minha senha</Link><Button type="submit" className="auth-submit" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Button></form><p className="auth-footer">Não tem uma conta? <Link href="/register">Cadastre-se</Link></p></AuthShell></GuestOnly></AuthProvider>;
}
