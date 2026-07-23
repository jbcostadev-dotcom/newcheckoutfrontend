"use client";

import { useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  Settings as SettingsIcon,
  Save,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { selectedStore, refreshSelectedStore, deleteStore } = useStore();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState(selectedStore?.name ?? "");

  const [active, setActive] = useState(selectedStore?.status ?? true);

  // Sync form when store changes
  if (selectedStore && selectedStore.name !== name) {
    setName(selectedStore.name);

    setActive(selectedStore.status);
  }

  const handleSave = async () => {
    if (!selectedStore) return;
    setSaving(true);
    try {
      await api.put(`/stores/${selectedStore.id}`, {
        name,

        status: active,
      });
      toast.success("Configurações salvas!");
      refreshSelectedStore();
    } catch {
      toast.error("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStore = async () => {
    if (!selectedStore) return;
    const confirmed = window.confirm(
      `Tem certeza que deseja deletar a loja "${selectedStore.name}"?\n\nEsta ação não pode ser desfeita. Todos os produtos, pedidos, domínios e a integração Shopify serão removidos permanentemente.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const ok = await deleteStore(selectedStore.id);
      if (ok) {
        toast.success("Loja deletada com sucesso.");
        router.push("/dashboard");
      }
    } catch {
      toast.error("Erro ao deletar a loja.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Configurações da Loja"
        description="Ajuste as preferências gerais da loja."
        actions={
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        }
      />

      <div className="mt-6 space-y-6">
        {/* Detalhes gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SettingsIcon className="h-4 w-4" /> Detalhes Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-md space-y-2">
              <Label htmlFor="store-name">Nome da Loja</Label>
              <Input
                id="store-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Minha Loja"
              />
            </div>

            <Separator />
            <div className="flex items-center justify-between max-w-md">
              <div>
                <Label>Loja ativa</Label>
                <p className="text-xs text-muted-foreground">
                  Lojas inativas não aceitam pedidos.
                </p>
              </div>
              <Switch
                checked={active}
                onCheckedChange={setActive}
              />
            </div>
          </CardContent>
        </Card>

        {/* Deletar loja */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <Trash2 className="h-4 w-4" /> Zona de perigo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                A exclusão da loja <strong>{selectedStore?.name}</strong> é
                permanente e não pode ser desfeita. Todos os produtos, pedidos,
                domínios e integrações serão removidos.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleDeleteStore}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deletando..." : "Deletar loja"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
