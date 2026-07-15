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

const CALLBACK_URL = "https://api.bersenker.shop/api/shopify/callback";
const APP_URL = "https://api.bersenker.shop";
const SCOPES_LABEL = "read_products,read_orders";

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
            Você cria o <strong>seu próprio app</strong> na Shopify Partner e cola as credenciais aqui. Cada loja usa o app do seu dono — você controla seus dados na Shopify.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-4 text-sm">
          {/* Passo 1 */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#95bf47] text-xs font-bold text-white">1</span>
              Crie uma conta Shopify Partner (gratuita)
            </h3>
            <p className="text-muted-foreground pl-8">
              Acesse{" "}
              <a href="https://partners.shopify.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                partners.shopify.com
              </a>{" "}
              e crie sua conta de Partner (é grátis e não exige loja ativa).
            </p>
          </div>

          {/* Passo 2 */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#95bf47] text-xs font-bold text-white">2</span>
              Crie um novo app
            </h3>
            <p className="text-muted-foreground pl-8">
              No painel Partner, vá em <strong>Apps → Create app</strong>. Escolha{" "}
              <strong>Custom app</strong> (para uso próprio / multi-loja) ou{" "}
              <strong>Public app</strong> (para distribuir na Shopify App Store).
            </p>
          </div>

          {/* Passo 3 */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#95bf47] text-xs font-bold text-white">3</span>
              Configure URLs e redirecionamento
            </h3>
            <div className="pl-8 space-y-2">
              <p className="text-muted-foreground">Em <strong>App setup → URLs</strong>, preencha:</p>
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
                ⚠️ A URL de callback precisa estar exatamente igual à acima, senão a Shopify rejeita o OAuth.
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
              <p className="text-muted-foreground">Em <strong>App setup → Access scopes</strong>, adicione:</p>
              <div className="rounded-md bg-muted/60 p-3 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span>{SCOPES_LABEL}</span>
                  <CopyButton value={SCOPES_LABEL} k="scopes" />
                </div>
              </div>
              <ul className="pt-2 space-y-1 text-muted-foreground">
                <li>• <code className="font-mono">read_products</code> — sincronizar produtos</li>
                <li>• <code className="font-mono">read_orders</code> — ler pedidos (futuro)</li>
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
              <p className="text-muted-foreground">Em <strong>App setup → API credentials</strong>, copie:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong>Client ID</strong> (API key) → vira <code className="font-mono">SHOPIFY_CLIENT_ID</code></li>
                <li>• <strong>Client Secret</strong> (API secret key) → vira <code className="font-mono">SHOPIFY_CLIENT_SECRET</code></li>
              </ul>
            </div>
          </div>

          {/* Passo 6 */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#95bf47] text-xs font-bold text-white">6</span>
              Configure o .env no servidor e limpe o cache
            </h3>
            <div className="pl-8 space-y-2">
              <p className="text-muted-foreground">Edite <code className="font-mono">/www/wwwroot/api.bersenker.shop/.env</code>:</p>
              <div className="rounded-md bg-muted/60 p-3 text-xs font-mono">
                <div>SHOPIFY_CLIENT_ID=seu_client_id</div>
                <div>SHOPIFY_CLIENT_SECRET=seu_client_secret</div>
                <div>APP_URL=https://api.bersenker.shop</div>
              </div>
              <p className="text-muted-foreground">Depois limpe o cache de config:</p>
              <div className="rounded-md bg-muted/60 p-3 text-xs font-mono">
                php artisan config:clear
                <br />
                php artisan config:cache
              </div>
            </div>
          </div>

          {/* Passo 7 */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#95bf47] text-xs font-bold text-white">7</span>
              Conecte cada loja aqui no painel
            </h3>
            <p className="text-muted-foreground pl-8">
              Com o app configurado, cada loja só precisa clicar em <strong>"Conectar Shopify"</strong> e digitar o domínio <code className="font-mono">sua-loja.myshopify.com</code>. A loja é redirecionada para a Shopify, autoriza e volta com o token salvo automaticamente.
            </p>
          </div>

          <Separator />

          <div className="rounded-lg border border-[#95bf47]/30 bg-[#95bf47]/5 p-4 text-xs text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">💡 Importante:</p>
            <ul className="space-y-1">
              <li>• Você cria o app só <strong>uma vez</strong> — o mesmo Client ID/Secret serve para todas as lojas.</li>
              <li>• Cada loja recebe seu próprio <strong>access token</strong> após autorizar via OAuth.</li>
              <li>• A URL de callback deve estar na lista de URLs permitidas do app na Shopify.</li>
              <li>• Para rodar localmente, crie uma <strong>Development store</strong> no Partner Dashboard.</li>
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
  const [savingCreds, setSavingCreds] = useState(false);
  const [showCredsForm, setShowCredsForm] = useState(false);

  const fetchShopifyStatus = async () => {
    if (!selectedStore) return;
    try {
      const data = await api.get<{
        connected: boolean;
        shopify_domain: string | null;
        credentials_configured: boolean;
      }>(`/stores/${selectedStore.id}/shopify/status`);
      setShopifyConnected(data.connected);
      setShopifyDomain(data.shopify_domain);
      setCredentialsConfigured(data.credentials_configured);
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

  const handleSaveCredentials = async () => {
    if (!selectedStore) return;
    if (!clientId.trim() || !clientSecret.trim()) {
      toast.error("Preencha Client ID e Client Secret.");
      return;
    }
    setSavingCreds(true);
    try {
      await api.put(`/stores/${selectedStore.id}/shopify/credentials`, {
        shopify_client_id: clientId.trim(),
        shopify_client_secret: clientSecret.trim(),
      });
      toast.success("Credenciais Shopify salvas!");
      setCredentialsConfigured(true);
      setShowCredsForm(false);
      setClientId("");
      setClientSecret("");
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
    // Redirect to the backend install route
    const redirectUrl = apiUrl(
      `/api/shopify/install?store_id=${selectedStore.id}`
    );
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
                        Client ID e Client Secret. Veja o tutorial para saber
                        como.
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
