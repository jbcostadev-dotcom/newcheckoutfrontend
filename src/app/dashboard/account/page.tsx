"use client";

import { useEffect, useState } from "react";
import { Save, X, Lock, User } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PhoneInput } from "@/components/phone-input";
import { useAuth } from "@/contexts/AuthContext";

export default function AccountPage() {
  const { user, loading, updateProfile, updatePassword } = useAuth();

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setEmail(user.email ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user]);

  const handleCancel = () => {
    if (user) {
      setName(user.name ?? "");
      setEmail(user.email ?? "");
      setPhone(user.phone ?? "");
    }
    setNickname("");
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, email, phone });
      toast.success("Informações salvas com sucesso!");
    } catch (err: any) {
      const message =
        err?.data?.message ??
        err?.message ??
        "Erro ao salvar informações.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setSavingPassword(true);
    try {
      await updatePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      toast.success("Senha atualizada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const message =
        err?.data?.message ??
        err?.data?.errors?.current_password?.[0] ??
        err?.message ??
        "Erro ao atualizar senha.";
      toast.error(message);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Configurações da Conta"
          description="Gerencie suas informações pessoais e de contato"
        />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configurações da Conta"
        description="Gerencie suas informações pessoais e de contato"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Informações Pessoais
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Atualize seus dados pessoais e de contato
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full-name">Nome completo</Label>
              <Input
                id="full-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname">Apelido</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Como você gostaria de ser chamado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <PhoneInput
                id="phone"
                value={phone}
                onChange={setPhone}
              />
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              onClick={handleSaveProfile}
              disabled={saving || !name || !email}
            >
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" />
            Alterar Senha
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Atualize sua senha de acesso
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha atual</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
              />
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              onClick={handleSavePassword}
              disabled={
                savingPassword ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              <Lock className="h-4 w-4" />
              {savingPassword ? "Atualizando..." : "Atualizar senha"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
