"use client";

import { useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import {
  Settings as SettingsIcon,
  Save,
  Unlink,
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
  const { selectedStore, refreshSelectedStore } = useStore();
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const [name, setName] = useState(selectedStore?.name ?? "");
  const [subdomain, setSubdomain] = useState(
    selectedStore?.subdomain ?? ""
  );
  const [customDomain, setCustomDomain] = useState(
    selectedStore?.custom_domain ?? ""
  );
  const [active, setActive] = useState(selectedStore?.status ?? true);

  // Sync form when store changes
  if (selectedStore && selectedStore.name !== name) {
    setName(selectedStore.name);
    setSubdomain(selectedStore.subdomain ?? "");
    setCustomDomain(selectedStore.custom_domain ?? "");
    setActive(selectedStore.status);
  }

  const handleSave = async () => {
    if (!selectedStore) return;
    setSaving(true);
    try {
      await api.put(`/stores/${selectedStore.id}`, {
        name,
        subdomain,
        custom_domain: customDomain || null,
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

  const handleDisconnectShopify = async () => {
    if (!selectedStore) return;
    const confirmed = window.confirm(
      "Tem certeza que deseja desconectar a Shopify?\n\nIsso removerá o vínculo com a loja Shopify, liberará o domínio para outra conta e tentará remover o código injetado no tema."
    );
    if (!confirmed) return;

    setDisconnecting(true);
    try {
      await api.delete(`/stores/${selectedStore.id}/shopify`);
      toast.success("Loja Shopify desconectada com sucesso.");
      refreshSelectedStore();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao desconectar a Shopify.";
      toast.error(message || "Erro ao desconectar a Shopify.");
    } finally {
      setDisconnecting(false);
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
            <div className="max-w-md space-y-2">
              <Label htmlFor="store-subdomain">
                Subdomínio
                <span className="ml-2 text-xs text-muted-foreground">
                  .checkoutpro.com
                </span>
              </Label>
              <Input
                id="store-subdomain"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="minha-loja"
              />
            </div>
            <Separator />
            <div className="max-w-md space-y-2">
              <Label htmlFor="store-custom-domain">Domínio personalizado</Label>
              <Input
                id="store-custom-domain"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="loja.exemplo.com (opcional)"
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

        {/* Shopify — desconectar */}
        {selectedStore?.shopify_domain && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-destructive">
                <Unlink className="h-4 w-4" /> Zona de perigo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Você está conectado à loja Shopify{" "}
                  <strong>{selectedStore.shopify_domain}</strong>. Desconectar
                  liberará esse domínio para ser usado em outra conta e tentará
                  remover o código injetado no tema.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleDisconnectShopify}
                disabled={disconnecting}
              >
                <Unlink className="h-4 w-4" />
                {disconnecting
                  ? "Desconectando..."
                  : "Desconectar loja Shopify"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
