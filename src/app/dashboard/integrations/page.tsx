"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { api, apiUrl } from "@/lib/api";
import {
  Plug,
  Store as ShopifyIcon,
  RefreshCw,
  MessageSquare,
  Mail,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function IntegrationsPage() {
  const { selectedStore } = useStore();

  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shopifyDomain, setShopifyDomain] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchShopifyStatus = async () => {
    if (!selectedStore) return;
    try {
      const data = await api.get<{
        connected: boolean;
        shopify_domain: string | null;
      }>(`/stores/${selectedStore.id}/shopify/status`);
      setShopifyConnected(data.connected);
      setShopifyDomain(data.shopify_domain);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopifyStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore]);

  const handleConnectShopify = () => {
    if (!selectedStore) return;
    // Redirect to the backend install route
    const redirectUrl = apiUrl(
      `/api/shopify/install?store_id=${selectedStore.id}`
    );
    // The install endpoint needs a `shop` param; we'll prompt the user.
    // For now, redirect with a shop prompt.
    const shop = prompt("Digite o nome da loja Shopify (ex: sua-loja.myshopify.com):"); // eslint-disable-line no-alert
    if (!shop) return;
    const shopDomain = shop.includes(".")
      ? shop
      : `${shop}.myshopify.com`;
    window.location.href = `${redirectUrl}&shop=${encodeURIComponent(shopDomain)}`;
  };

  const handleSyncProducts = async () => {
    if (!selectedStore) return;
    setSyncing(true);
    try {
      await api.post(`/stores/${selectedStore.id}/shopify/sync`);
      toast.success("Sincronização de produtos iniciada!");
    } catch {
      toast.error("Erro ao iniciar sincronização.");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Integrações"
        description="Conecte plataformas e serviços para automatizar sua loja."
      />

      <div className="mt-6 space-y-4">
        {/* Shopify */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#95bf47]/15">
                <ShopifyIcon className="h-5 w-5 text-[#95bf47]" />
              </div>
              <div>
                <CardTitle className="text-base">Shopify</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Sincronize produtos e receba pedidos automaticamente.
                </p>
              </div>
            </div>
            <Badge variant={shopifyConnected ? "success" : "secondary"}>
              {shopifyConnected ? "Conectado" : "Desconectado"}
            </Badge>
          </CardHeader>
          <CardContent>
            {shopifyConnected ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Loja conectada:{" "}
                  <span className="font-medium text-foreground">
                    {shopifyDomain}
                  </span>
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncProducts}
                    disabled={syncing}
                  >
                    <RefreshCw className="h-4 w-4" />
                    {syncing ? "Sincronizando..." : "Sincronizar Produtos"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnectShopify}
                  >
                    <ExternalLink className="h-4 w-4" /> Reconectar
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={handleConnectShopify}>
                <Plug className="h-4 w-4" /> Conectar Shopify
              </Button>
            )}
          </CardContent>
        </Card>

        {/* WhatsApp — Placeholder */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/15">
                <MessageSquare className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-base">WhatsApp</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Envie notificações de pedido via WhatsApp.
                </p>
              </div>
            </div>
            <Badge variant="outline">Em breve</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              A integração com WhatsApp via Evolution API permitirá envio automático de
              confirmações e atualizações de pedido.
            </p>
          </CardContent>
        </Card>

        {/* SMTP — Placeholder */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15">
                <Mail className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-base">SMTP Personalizado</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Use seu próprio servidor de e-mail para notificações.
                </p>
              </div>
            </div>
            <Badge variant="outline">Em breve</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure credenciais SMTP para enviar e-mails de confirmação de pedido
              usando seu próprio domínio e servidor.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
