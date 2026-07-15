"use client";

import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import type { CheckoutSettings } from "@/types";
import { Palette, Upload, Eye } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULTS: CheckoutSettings = {
  store_id: 0,
  primary_color: "#6366f1",
  secondary_color: "#ffffff",
  logo_url: null,
  banner_url: null,
  enable_order_bump: false,
  dark_mode: true,
  button_text: "Finalizar Compra",
};

export default function CheckoutCustomizationPage() {
  const { selectedStore } = useStore();
  const [settings, setSettings] = useState<CheckoutSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!selectedStore) return;
    setLoading(true);
    try {
      const data = await api.get<CheckoutSettings>(
        `/stores/${selectedStore.id}/settings`
      );
      setSettings({ ...DEFAULTS, ...data });
    } catch {
      toast.error("Erro ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  }, [selectedStore]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    if (!selectedStore) return;
    setSaving(true);
    try {
      await api.put(`/stores/${selectedStore.id}/settings`, {
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        logo_url: settings.logo_url,
        banner_url: settings.banner_url,
        enable_order_bump: settings.enable_order_bump,
        dark_mode: settings.dark_mode,
        button_text: settings.button_text,
      });
      toast.success("Configurações salvas!");
    } catch {
      toast.error("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (
    field: "logo_url" | "banner_url",
    file: File
  ) => {
    if (!selectedStore) return;
    const formData = new FormData();
    formData.append(field, file);

    try {
      // Reaproveita o endpoint de products upload — qualquer image upload público
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/stores/${selectedStore.id}/settings`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("checkout_token")}`,
          },
          body: formData,
        }
      );

      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({ ...prev, [field]: data[field] }));
        toast.success("Imagem enviada!");
      }
    } catch {
      toast.error("Erro ao enviar imagem.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Personalização do Checkout"
        description="Configure a aparência e o comportamento da página de checkout."
        actions={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Editor */}
        <div className="space-y-6">
          {/* Cores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-4 w-4" /> Cores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cor primária</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          primary_color: e.target.value,
                        }))
                      }
                      className="h-10 w-10 cursor-pointer rounded-md border"
                    />
                    <Input
                      value={settings.primary_color}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          primary_color: e.target.value,
                        }))
                      }
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor secundária</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          secondary_color: e.target.value,
                        }))
                      }
                      className="h-10 w-10 cursor-pointer rounded-md border"
                    />
                    <Input
                      value={settings.secondary_color}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          secondary_color: e.target.value,
                        }))
                      }
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logo & Banner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="h-4 w-4" /> Imagens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Logo (URL ou upload)</Label>
                <Input
                  value={settings.logo_url ?? ""}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, logo_url: e.target.value }))
                  }
                  placeholder="https://exemplo.com/logo.png"
                />
                <input
                  type="file"
                  accept="image/*"
                  className="block text-xs text-muted-foreground"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload("logo_url", file);
                  }}
                />
                {settings.logo_url && (
                  <img
                    src={settings.logo_url}
                    alt="Logo preview"
                    className="h-12 rounded object-contain"
                  />
                )}
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Banner (URL ou upload)</Label>
                <Input
                  value={settings.banner_url ?? ""}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, banner_url: e.target.value }))
                  }
                  placeholder="https://exemplo.com/banner.jpg"
                />
                <input
                  type="file"
                  accept="image/*"
                  className="block text-xs text-muted-foreground"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload("banner_url", file);
                  }}
                />
                {settings.banner_url && (
                  <img
                    src={settings.banner_url}
                    alt="Banner preview"
                    className="h-20 w-full rounded-lg object-cover"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comportamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comportamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Modo escuro</Label>
                  <p className="text-xs text-muted-foreground">
                    Ativa o tema dark no checkout público.
                  </p>
                </div>
                <Switch
                  checked={settings.dark_mode}
                  onCheckedChange={(v) =>
                    setSettings((s) => ({ ...s, dark_mode: v }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Order Bump</Label>
                  <p className="text-xs text-muted-foreground">
                    Exibe upsell de produtos adicionais.
                  </p>
                </div>
                <Switch
                  checked={settings.enable_order_bump}
                  onCheckedChange={(v) =>
                    setSettings((s) => ({ ...s, enable_order_bump: v }))
                  }
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Texto do botão de pagamento</Label>
                <Input
                  value={settings.button_text ?? "Finalizar Compra"}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, button_text: e.target.value }))
                  }
                  placeholder="Finalizar Compra"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview ao vivo */}
        <Card className="sticky top-8 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4" /> Preview ao vivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="overflow-hidden rounded-lg border"
              style={{ background: settings.dark_mode ? "#0a0a1a" : "#f3f4f6" }}
            >
              {/* Mini header */}
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ background: settings.primary_color, color: "#fff" }}
              >
                {settings.logo_url && (
                  <img
                    src={settings.logo_url}
                    alt=""
                    className="h-6 rounded object-contain"
                  />
                )}
                <span className="text-sm font-bold">
                  {selectedStore?.name ?? "Sua Loja"}
                </span>
              </div>

              {/* Mini form */}
              <div className="space-y-3 p-4">
                <div
                  className="rounded-lg border p-3"
                  style={{
                    background: settings.dark_mode
                      ? "rgba(255,255,255,0.05)"
                      : "#fff",
                    borderColor: settings.dark_mode
                      ? "rgba(255,255,255,0.1)"
                      : "#e5e7eb",
                  }}
                >
                  <p
                    className="mb-2 text-xs font-semibold"
                    style={{ color: settings.dark_mode ? "#fff" : "#111" }}
                  >
                    Produto Exemplo
                  </p>
                  <p
                    className="text-lg font-bold"
                    style={{ color: settings.primary_color }}
                  >
                    R$ 99,90
                  </p>
                </div>
                <div
                  className="h-8 rounded-md"
                  style={{
                    background: settings.dark_mode
                      ? "rgba(255,255,255,0.05)"
                      : "#fff",
                    borderColor: settings.dark_mode
                      ? "rgba(255,255,255,0.1)"
                      : "#e5e7eb",
                    border: "1px solid",
                  }}
                />
                <div
                  className="h-8 rounded-md"
                  style={{
                    background: settings.dark_mode
                      ? "rgba(255,255,255,0.05)"
                      : "#fff",
                    borderColor: settings.dark_mode
                      ? "rgba(255,255,255,0.1)"
                      : "#e5e7eb",
                    border: "1px solid",
                  }}
                />
                <div
                  className="flex h-10 items-center justify-center rounded-md text-sm font-bold text-white"
                  style={{ background: settings.primary_color }}
                >
                  {settings.button_text ?? "Finalizar Compra"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
