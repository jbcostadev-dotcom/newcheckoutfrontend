"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">{label}</p>
      </div>
    </div>
  );
}

/**
 * Garante que o conteúdo só seja renderizado para usuários autenticados.
 * Enquanto a sessão é verificada, exibe um loader (impede flash do dashboard
 * antes do redirect). Se não houver sessão válida, redireciona para a tela de login.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <FullScreenLoader label="Verificando sua sessão..." />;
  }

  return <>{children}</>;
}

/**
 * Usado em rotas de convidado (login/registro). Se o usuário já estiver
 * autenticado, redireciona para o dashboard em vez de mostrar o formulário.
 */
export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (loading || user) {
    return <FullScreenLoader label="Carregando..." />;
  }

  return <>{children}</>;
}