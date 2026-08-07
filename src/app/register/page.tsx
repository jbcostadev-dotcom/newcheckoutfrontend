"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AuthProvider } from "@/contexts/AuthContext";
import { GuestOnly } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { AuthPasswordInput } from "@/components/auth-password-input";
import { AuthShell } from "@/components/auth-shell";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handleSubmit = async (event: React.FormEvent) => { event.preventDefault(); setLoading(true); try { await api.post("/register", { name, email, password }, { auth: false }); toast.success("Conta criada com sucesso! Faça login."); window.location.href = "/"; } catch (err) { toast.error(err instanceof Error ? err.message : "Erro ao criar conta."); } finally { setLoading(false); } };
  return <AuthProvider><GuestOnly><AuthShell activePage="register" className="auth-card--register"><header className="auth-heading"><h1>Cadastre-se grátis</h1><p>Crie sua conta e comece a vender hoje.</p></header><form onSubmit={handleSubmit} className="auth-form"><div className="auth-field"><UserRound className="auth-field__icon" aria-hidden="true" /><input id="name" type="text" required placeholder="Como gostaria de ser chamado?" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></div><div className="auth-field"><Mail className="auth-field__icon" aria-hidden="true" /><input id="email" type="email" required placeholder="E-mail" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></div><AuthPasswordInput id="password" value={password} onChange={setPassword} autoComplete="new-password" /><p className="auth-password-note">Use pelo menos 8 caracteres.</p><label className="auth-terms"><input type="checkbox" required /><span>Confirmo que li e concordo com os <a href="#">Termos de Uso</a></span></label><Button type="submit" className="auth-submit" disabled={loading}>{loading ? "Criando conta..." : "Criar conta"}</Button></form><p className="auth-footer">Já tem uma conta? <Link href="/">Entrar</Link></p></AuthShell></GuestOnly></AuthProvider>;
}
