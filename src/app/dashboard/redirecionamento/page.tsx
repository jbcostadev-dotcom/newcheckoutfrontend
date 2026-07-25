"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { Save, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CheckoutSettings } from "@/types";

export default function RedirectPage() {
  const { selectedStore } = useStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [cardEnabled, setCardEnabled] = useState<string>("false");
  const [cardUrl, setCardUrl] = useState<string>("");
  const [pixEnabled, setPixEnabled] = useState<string>("false");
  const [pixUrl, setPixUrl] = useState<string>("");

  useEffect(() => {
    if (!selectedStore) return;
    setLoading(true);
    api
      .get<CheckoutSettings>(`/stores/${selectedStore.id}/settings`)
      .then((settings) => {
        setCardEnabled(settings.card_redirect_enabled ? "true" : "false");
        setCardUrl(settings.card_redirect_url ?? "");
        setPixEnabled(settings.pix_redirect_enabled ? "true" : "false");
        setPixUrl(settings.pix_redirect_url ?? "");
      })
      .catch(() => {
        toast.error("Erro ao carregar configurações de redirecionamento.");
      })
      .finally(() => setLoading(false));
  }, [selectedStore]);

  const handleSave = async () => {
    if (!selectedStore) return;
    setSaving(true);
    try {
      await api.put(`/stores/${selectedStore.id}/settings`, {
        card_redirect_enabled: cardEnabled === "true",
        card_redirect_url: cardUrl.trim() || null,
        pix_redirect_enabled: pixEnabled === "true",
        pix_redirect_url: pixUrl.trim() || null,
      });
      toast.success("Configurações de redirecionamento salvas!");
    } catch {
      toast.error("Erro ao salvar configurações de redirecionamento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Redirecionamento"
        description="Configure para onde o cliente será redirecionado após o pagamento aprovado."
        actions={
          <Button onClick={handleSave} disabled={saving || loading}>
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        }
      />

      <div className="mt-6 space-y-6">
        {/* Cartão de Crédito */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ExternalLink className="h-4 w-4" /> Redirecionamento pagamento
              Cartão de Crédito
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-redirect-enabled">Ativar redirecionamento</Label>
              <Select
                value={cardEnabled}
                onValueChange={setCardEnabled}
                disabled={loading}
              >
                <SelectTrigger id="card-redirect-enabled" className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Desativado</SelectItem>
                  <SelectItem value="true">Ativado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="card-redirect-url">Link de redirecionamento</Label>
              <Input
                id="card-redirect-url"
                value={cardUrl}
                onChange={(e) => setCardUrl(e.target.value)}
                placeholder="https://exemplo.com.br/pagina-obrigado"
                disabled={loading || cardEnabled !== "true"}
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                Ao ativar, o cliente será redirecionado para esse link após o
                pagamento aprovado, pulando a tela de resumo do pedido.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pix */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ExternalLink className="h-4 w-4" /> Redirecionamento pagamento Pix
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pix-redirect-enabled">Ativar redirecionamento</Label>
              <Select
                value={pixEnabled}
                onValueChange={setPixEnabled}
                disabled={loading}
              >
                <SelectTrigger id="pix-redirect-enabled" className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Desativado</SelectItem>
                  <SelectItem value="true">Ativado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pix-redirect-url">Link de redirecionamento</Label>
              <Input
                id="pix-redirect-url"
                value={pixUrl}
                onChange={(e) => setPixUrl(e.target.value)}
                placeholder="https://exemplo.com.br/pagina-obrigado"
                disabled={loading || pixEnabled !== "true"}
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                Ao ativar, o cliente será redirecionado para esse link após o
                pagamento Pix confirmado, pulando a tela de resumo do pedido.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
