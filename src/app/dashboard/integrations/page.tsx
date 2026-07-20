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
  HelpCircle,
  BookOpen,
  Copy,
  CheckCircle2,
  Code2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ShopifyInjectStatus } from "@/types";

const CALLBACK_URL = "https://api.bersenker.shop/api/shopify/callback";
const APP_URL = "https://api.bersenker.shop";
const SCOPES_LABEL = "read_products,read_orders,write_themes";

function ShopifyTutorialDialog() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Copiado!");
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyButton = ({ value, k }: { value: string; k: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="ml-2 h-7 px-2"
      onClick={() => copy(value, k)}
      type="button"
    >
      {copied === k ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BookOpen className="h-4 w-4" /> Tutorial de Configuração
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-[#95bf47]" />
            Como configurar a integração Shopify
          </DialogTitle>
          <DialogDescription>
            Cadastre seu <strong>próprio app Shopify</strong> e cole as credenciais aqui no painel. Cada loja usa o app do seu dono — você controla seus dados na Shopify.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-4 text-sm">
          {/* Passo 1 */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#95bf47] text-xs font-bold text-white">1</span>
              Acesse o Shopify Partner Dashboard
            </h3>
            <p className="text-muted-foreground pl-8">
              Entre em{" "}
              <a href="https://partners.shopify.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                partners.shopify.com
              </a>{" "}
              e acesse a aba <strong>Apps</strong>. (É grátis e não exige loja ativa.)
            </p>
          </div>

          {/* Passo 2 */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#95bf47] text-xs font-bold text-white">2</span>
              Cadastre o app para sua loja
            </h3>
            <p className="text-muted-foreground pl-8">
              Clique em <strong>Add app</strong> e escolha <strong>Custom app</strong>. Dê um nome (ex: <em>Bersenker Checkout</em>) e selecione a loja onde ele será instalado.
            </p>
          </div>

          {/* Passo 3 */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#95bf47] text-xs font-bold text-white">3</span>
              Configure as URLs do app
            </h3>
            <div className="pl-8 space-y-2">
              <p className="text-muted-foreground">Em <strong>Configuration → URLs</strong>, preencha:</p>
              <div className="rounded-md bg-muted/60 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono">
                    <strong>App URL:</strong> {APP_URL}
                  </span>
                  <CopyButton value={APP_URL} k="app_url" />
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between">
                  <span className="font-mono break-all">
                    <strong>Allowed redirection URI(s):</strong> {CALLBACK_URL}
                  </span>
                  <CopyButton value={CALLBACK_URL} k="callback" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ A URL de redirecionamento precisa estar exatamente igual à acima, senão a Shopify rejeita o OAuth.
              </p>
            </div>
          </div>

          {/* Passo 4 */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#95bf47] text-xs font-bold text-white">4</span>
              Defina os escopos (permissions)
            </h3>
            <div className="pl-8 space-y-1">
              <p className="text-muted-foreground">Em <strong>Configuration → API access → Access scopes</strong>, adicione:</p>
              <div className="rounded-md bg-muted/60 p-3 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span>{SCOPES_LABEL}</span>
                  <CopyButton value={SCOPES_LABEL} k="scopes" />
                </div>
              </div>
              <ul className="pt-2 space-y-1 text-muted-foreground">
                <li>• <code className="font-mono">read_products</code> — sincronizar produtos</li>
                <li>• <code className="font-mono">read_orders</code> — ler pedidos</li>
                <li>• <code className="font-mono">write_themes</code> — injetar o snippet de checkout no tema</li>
              </ul>
            </div>
          </div>

          {/* Passo 5 */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#95bf47] text-xs font-bold text-white">5</span>
              Copie Client ID e Client Secret
            </h3>
            <div className="pl-8 space-y-1">
              <p className="text-muted-foreground">Em <strong>Configuration → API credentials</strong>, copie:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong>Client ID</strong> (API key)</li>
                <li>• <strong>Client Secret</strong> (API secret key) — clique em <em>Reveal</em> para ver.</li>
              </ul>
            </div>
          </div>

          {/* Passo 6 */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#95bf47] text-xs font-bold text-white">6</span>
              Cole as credenciais aqui no painel Bersenker
            </h3>
            <div className="pl-8 space-y-1">
              <p className="text-muted-foreground">
                Abra <strong>Integrações → Shopify → Configurar credenciais</strong> e preencha:
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong>Client ID</strong> copiado no passo anterior</li>
                <li>• <strong>Client Secret</strong> copiado no passo anterior</li>
                <li>• <strong>Domínio da loja Shopify</strong> (ex: <code className="font-mono">sua-loja.myshopify.com</code>)</li>
              </ul>
              <p className="text-muted-foreground pt-1">
                Clique em <strong>Salvar credenciais</strong>.
              </p>
            </div>
          </div>

          {/* Passo 7 */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#95bf47] text-xs font-bold text-white">7</span>
              Conecte a Shopify
            </h3>
            <p className="text-muted-foreground pl-8">
              Clique em <strong>Conectar Shopify</strong>. Você será redirecionado direto para a Shopify, autorize o acesso e voltará automaticamente para o painel com a integração ativa. Os produtos começam a sincronizar em seguida.
            </p>
          </div>

          <Separator />

          <div className="rounded-lg border border-[#95bf47]/30 bg-[#95bf47]/5 p-4 text-xs text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">💡 Importante:</p>
            <ul className="space-y-1">
              <li>• Cada loja pode usar seu <strong>próprio app Shopify</strong> — as credenciais ficam salvas aqui no painel, sem editar arquivos no servidor.</li>
              <li>• A loja recebe um <strong>access token</strong> próprio após autorizar via OAuth.</li>
              <li>• A URL de redirecionamento deve estar na lista de URLs permitidas do app na Shopify.</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function IntegrationsPage() {
  const { selectedStore } = useStore();

  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shopifyDomain, setShopifyDomain] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  // Credenciais do app Shopify particular do lojista
  const [credentialsConfigured, setCredentialsConfigured] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  // Domínio da loja Shopify (ex: sua-loja.myshopify.com) — salvo junto das credenciais.
  const [shopDomain, setShopDomain] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);
  const [showCredsForm, setShowCredsForm] = useState(false);

  // Injeção do snippet de checkout no tema
  const [checkoutInjected, setCheckoutInjected] = useState(false);
  const [injectedThemeId, setInjectedThemeId] = useState<number | null>(null);
  const [injectedAt, setInjectedAt] = useState<string | null>(null);
  const [injecting, setInjecting] = useState(false);
  const [removing, setRemoving] = useState(false);

  const fetchShopifyStatus = async () => {
    if (!selectedStore) return;
    try {
      const data = await api.get<ShopifyInjectStatus>(
        `/stores/${selectedStore.id}/shopify/status`
      );
      setShopifyConnected(data.connected);
      setShopifyDomain(data.shopify_domain);
      setCredentialsConfigured(data.credentials_configured);
      setCheckoutInjected(data.checkout_injected);
      setInjectedThemeId(data.injected_theme_id);
      setInjectedAt(data.injected_at);
      // Pré-preenche o domínio digitado anteriormente (antes do OAuth).
      setShopDomain(data.pending_domain ?? "");
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

  // Feedback do callback Shopify (redirecionado de volta para esta página).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("shopify");
    if (!status) return;
    const message = params.get("message");
    if (status === "connected") {
      toast.success("Shopify conectado! Sincronizando produtos...");
    } else if (status === "error") {
      toast.error(message ? decodeURIComponent(message) : "Falha ao conectar a Shopify.");
    }
    // Limpa a query da URL sem causar navegação.
    const url = window.location.pathname + window.location.hash;
    window.history.replaceState(null, "", url);
    // Recarrega o status para refletir a conexão.
    fetchShopifyStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveCredentials = async () => {
    if (!selectedStore) return;
    if (!clientId.trim() || !clientSecret.trim()) {
      toast.error("Preencha Client ID e Client Secret.");
      return;
    }
    if (!shopDomain.trim()) {
      toast.error("Informe o domínio da loja Shopify (ex: sua-loja.myshopify.com).");
      return;
    }
    setSavingCreds(true);
    try {
      const data = await api.put<{ pending_domain?: string | null }>(
        `/stores/${selectedStore.id}/shopify/credentials`,
        {
          shopify_client_id: clientId.trim(),
          shopify_client_secret: clientSecret.trim(),
          shopify_domain_input: shopDomain.trim(),
        }
      );
      toast.success("Credenciais Shopify salvas!");
      setCredentialsConfigured(true);
      setShowCredsForm(false);
      setClientId("");
      setClientSecret("");
      if (data?.pending_domain) setShopDomain(data.pending_domain);
    } catch {
      toast.error("Erro ao salvar credenciais.");
    } finally {
      setSavingCreds(false);
    }
  };

  const handleConnectShopify = () => {
    if (!selectedStore) return;
    if (!credentialsConfigured) {
      toast.error("Salve as credenciais do seu app Shopify antes de conectar.");
      setShowCredsForm(true);
      return;
    }
    if (!shopDomain.trim()) {
      toast.error("Informe o domínio da loja Shopify antes de conectar.");
      setShowCredsForm(true);
      return;
    }
    const shop = shopDomain.trim().includes(".")
      ? shopDomain.trim()
      : `${shopDomain.trim()}.myshopify.com`;
    // O backend responde com 302 → navegador vai direto para a Shopify.
    window.location.href = apiUrl(
      `/api/shopify/install?store_id=${selectedStore.id}&shop=${encodeURIComponent(shop)}`
    );
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

  const handleInjectCheckout = async () => {
    if (!selectedStore) return;
    setInjecting(true);
    try {
      const data = await api.post<{
        theme_id: number;
        theme_name: string;
      }>(`/stores/${selectedStore.id}/shopify/inject-checkout`);
      setCheckoutInjected(true);
      setInjectedThemeId(data.theme_id);
      setInjectedAt(new Date().toISOString());
      toast.success(
        `Código de checkout injetado no tema #${data.theme_id} (${data.theme_name}).`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao injetar código no tema.";
      toast.error(message || "Erro ao injetar código no tema.");
    } finally {
      setInjecting(false);
    }
  };

  const handleRemoveCheckout = async () => {
    if (!selectedStore) return;
    if (!confirm("Remover o código de checkout do tema Shopify?")) return;
    setRemoving(true);
    try {
      await api.delete(`/stores/${selectedStore.id}/shopify/inject-checkout`);
      setCheckoutInjected(false);
      setInjectedThemeId(null);
      setInjectedAt(null);
      toast.success("Código de checkout removido do tema.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao remover código do tema.";
      toast.error(message || "Erro ao remover código do tema.");
    } finally {
      setRemoving(false);
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
                  <ShopifyTutorialDialog />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Status credenciais + ações */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={handleConnectShopify}>
                    <Plug className="h-4 w-4" /> Conectar Shopify
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCredsForm((v) => !v)}
                  >
                    {credentialsConfigured
                      ? "Atualizar credenciais"
                      : "Configurar credenciais"}
                  </Button>
                  <ShopifyTutorialDialog />
                  {credentialsConfigured && (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Credenciais salvas
                    </Badge>
                  )}
                </div>

                {!credentialsConfigured && !showCredsForm && (
                  <p className="text-sm text-muted-foreground">
                    Antes de conectar, você precisa criar seu app na Shopify e
                    salvar as credenciais aqui. Siga o tutorial acima.
                  </p>
                )}

                {/* Formulário de credenciais */}
                {showCredsForm || !credentialsConfigured ? (
                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Credenciais do seu app Shopify
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Crie seu app no Shopify Partner Dashboard e cole aqui o
                        Client ID, o Client Secret e o domínio da sua loja. Veja
                        o tutorial para saber como.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="shopify-client-id">Client ID</Label>
                        <Input
                          id="shopify-client-id"
                          placeholder="ex: e765ce7c8b4e..."
                          value={clientId}
                          onChange={(e) => setClientId(e.target.value)}
                          autoComplete="off"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="shopify-client-secret">
                          Client Secret
                        </Label>
                        <Input
                          id="shopify-client-secret"
                          type="password"
                          placeholder="shpat_..."
                          value={clientSecret}
                          onChange={(e) => setClientSecret(e.target.value)}
                          autoComplete="off"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="shopify-domain">Domínio da loja Shopify</Label>
                      <Input
                        id="shopify-domain"
                        placeholder="ex: sua-loja.myshopify.com"
                        value={shopDomain}
                        onChange={(e) => setShopDomain(e.target.value)}
                        autoComplete="off"
                      />
                      <p className="text-xs text-muted-foreground">
                        É para onde você será redirecionado ao clicar em{" "}
                        <strong>Conectar Shopify</strong>.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveCredentials}
                        disabled={savingCreds}
                      >
                        {savingCreds ? "Salvando..." : "Salvar credenciais"}
                      </Button>
                      {showCredsForm && credentialsConfigured && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowCredsForm(false);
                            setClientId("");
                            setClientSecret("");
                          }}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Checkout no tema Shopify */}
        {shopifyConnected && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/15">
                  <Code2 className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <CardTitle className="text-base">Checkout no tema</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Redireciona o carrinho e o &ldquo;Comprar agora&rdquo; para o seu checkout.
                  </p>
                </div>
              </div>
              <Badge variant={checkoutInjected ? "success" : "secondary"}>
                {checkoutInjected ? "Injetado" : "Não injetado"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-1 text-sm">
                  {checkoutInjected ? (
                    <p className="text-muted-foreground">
                      Código injetado no tema{" "}
                      <span className="font-medium text-foreground">
                        #{injectedThemeId ?? "—"}
                      </span>
                      {injectedAt && (
                        <>
                          {" "}
                          em{" "}
                          <span className="font-medium text-foreground">
                            {new Date(injectedAt).toLocaleString("pt-BR")}
                          </span>
                        </>
                      )}
                      .
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      O código do checkout ainda não foi injetado no tema
                      publicado. Clique em{" "}
                      <strong>Integrar código no tema</strong> para ativar o
                      redirecionamento.
                    </p>
                  )}
                </div>

                {/* Aviso de reautorização para lojas conectadas antes da atualização */}
                <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <p>
                    A injeção usa o escopo{" "}
                    <code className="font-mono">write_themes</code>. Lojas
                    conectadas antes desta atualização precisam{" "}
                    <strong>Reconectar a Shopify</strong> acima para conceder a
                    nova permissão.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={handleInjectCheckout}
                    disabled={injecting}
                  >
                    <Code2 className="h-4 w-4" />
                    {injecting
                      ? "Injetando..."
                      : checkoutInjected
                        ? "Reintegrar código no tema"
                        : "Integrar código no tema"}
                  </Button>
                  {checkoutInjected && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRemoveCheckout}
                      disabled={removing}
                    >
                      <Trash2 className="h-4 w-4" />
                      {removing ? "Removendo..." : "Remover código do tema"}
                    </Button>
                  )}
                </div>

                {checkoutInjected && (
                  <p className="text-xs text-muted-foreground">
                    Se você <strong>trocou de tema</strong> na Shopify, clique em{" "}
                    <strong>Reintegrar código no tema</strong> para injetar no
                    tema atual.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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
