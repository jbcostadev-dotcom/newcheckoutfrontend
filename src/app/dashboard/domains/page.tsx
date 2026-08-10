"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import type { Domain } from "@/types";
import { DOMAIN_STATUS_LABEL } from "@/types";
import { Globe, Plus, Copy, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DnsVerificationResult = {
  verified: boolean;
  dns_configured: boolean;
  found_cname: string | null;
  expected_cname: string;
  hostname_status: string;
  ssl_status: string;
  error: string | null;
} | null;

export default function DomainsPage() {
  const { selectedStore, refreshSelectedStore } = useStore();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [instructions, setInstructions] = useState<{
    type: string;
    host: string;
    target: string;
    expected_cname: string;
    hostname: string;
  } | null>(null);
  const [pendingDomain, setPendingDomain] = useState<Domain | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [dnsResult, setDnsResult] = useState<DnsVerificationResult>(null);

  const cnameTarget =
    process.env.NEXT_PUBLIC_CLOUDFLARE_SAAS_CNAME_TARGET ||
    "customers.bersenker.shop";

  const fetchDomains = async () => {
    if (!selectedStore) return;
    setLoading(true);
    try {
      const data = await api.get<Domain[]>(`/stores/${selectedStore.id}/domains`);
      setDomains(data);
    } catch {
      toast.error("Erro ao carregar domínios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore]);

  const handleAddDomain = async () => {
    if (!selectedStore || !newDomain.trim()) return;
    if (domains.length > 0) {
      toast.error("Esta loja já possui um domínio personalizado.");
      return;
    }
    setAdding(true);
    try {
      const response = await api.post<{ domain: Domain; instructions: { type: string; host: string; target: string; expected_cname: string; hostname: string } }>(
        `/stores/${selectedStore.id}/domains`,
        { domain: newDomain.trim() }
      );
      setPendingDomain(response.domain);
      setInstructions(response.instructions);
      setAddDialogOpen(false);
      setNewDomain("");
      toast.success("Domínio adicionado!");
      await Promise.all([fetchDomains(), refreshSelectedStore()]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao adicionar domínio.";
      toast.error(message);
    } finally {
      setAdding(false);
    }
  };

  const handleVerifyDns = async () => {
    if (!selectedStore || !pendingDomain) return;
    setVerifying(true);
    setDnsResult(null);
    try {
      const result = await api.post<DnsVerificationResult>(
        `/stores/${selectedStore.id}/domains/${pendingDomain.id}/verify-dns`
      );
      setDnsResult(result);
      if (result?.verified) {
        toast.success("Domínio e certificado ativados na Cloudflare!");
        setPendingDomain(null);
        setInstructions(null);
        await Promise.all([fetchDomains(), refreshSelectedStore()]);
      } else if (result?.dns_configured) {
        toast.info("CNAME encontrado. A Cloudflare ainda está concluindo a validação.");
      } else {
        toast.error("CNAME ainda não encontrado. Verifique as instruções.");
      }
    } catch {
      toast.error("Erro ao verificar DNS.");
    } finally {
      setVerifying(false);
    }
  };

  const handleDelete = async (domainId: number) => {
    if (!selectedStore || !confirm("Remover este domínio?")) return;
    try {
      await api.delete(`/stores/${selectedStore.id}/domains/${domainId}`);
      toast.success("Domínio removido!");
      await Promise.all([fetchDomains(), refreshSelectedStore()]);
    } catch {
      toast.error("Erro ao remover domínio.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const openDomainSetup = (domain: Domain) => {
    const target = domain.cloudflare_cname_target || cnameTarget;
    setPendingDomain(domain);
    setDnsResult(null);
    setInstructions({
      type: "CNAME",
      host: "checkout",
      target,
      expected_cname: target,
      hostname: domain.domain,
    });
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "dns_verified":
        return "default";
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const checkoutAppDomain =
    process.env.NEXT_PUBLIC_CHECKOUT_APP_DOMAIN ||
    `checkout.${process.env.NEXT_PUBLIC_CHECKOUT_BASE_DOMAIN || "bersenker.shop"}`;
  const checkoutUrl = selectedStore
    ? `https://${checkoutAppDomain}/store/${selectedStore.id}/checkout`
    : null;
  const hasCustomDomain = domains.length > 0;

  return (
    <>
      <PageHeader
        title="Domínios"
        description={`Gerencie os domínios de ${selectedStore?.name ?? "sua loja"}.`}
        actions={
          <Button
            onClick={() => setAddDialogOpen(true)}
            disabled={loading || hasCustomDomain}
            title={hasCustomDomain ? "Cada loja pode ter apenas um domínio personalizado." : undefined}
          >
            <Plus className="h-4 w-4" /> Adicionar Domínio
          </Button>
        }
      />

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Subdomínio da Loja
            </CardTitle>
            <CardDescription>
              Este é o endereço padrão do seu checkout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checkoutUrl ? (
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
                  {checkoutUrl}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(checkoutUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Badge variant="success">Ativo</Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Subdomínio não configurado.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Domínios Personalizados</CardTitle>
            <CardDescription>
              Conecte um domínio próprio para usar no checkout. Cada loja pode ter apenas um domínio personalizado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : domains.length > 0 ? (
              <div className="space-y-3">
                {domains.map((domain) => (
                  <div
                    key={domain.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{domain.domain}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={getBadgeVariant(domain.status === "failed" ? "failed" : domain.ssl_status) as "success" | "default" | "destructive" | "secondary"}>
                          {DOMAIN_STATUS_LABEL[domain.status === "failed" ? "failed" : domain.ssl_status] || domain.ssl_status}
                        </Badge>
                        {domain.is_primary && (
                          <Badge variant="outline">Primário</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() => openDomainSetup(domain)}
                    >
                      {domain.ssl_active ? "Consultar" : "Configurar"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(domain.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Globe}
                title="Nenhum domínio personalizado"
                description="Adicione seu próprio domínio para usar no checkout."
                action={
                  <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="h-4 w-4" /> Adicionar Domínio
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Domínio Personalizado</DialogTitle>
            <DialogDescription>
              Digite seu domínio principal. O endereço do checkout será criado automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domínio principal</Label>
              <div className="flex rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring">
                <span className="flex items-center border-r bg-muted px-3 text-sm text-muted-foreground">
                  checkout.
                </span>
                <Input
                  id="domain"
                  className="border-0 focus-visible:ring-0"
                  placeholder="seudominio.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Se você informar www.seudominio.com, usaremos checkout.seudominio.com.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddDomain} disabled={adding || hasCustomDomain || !newDomain.trim()}>
              {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {pendingDomain && instructions && (
        <Dialog open={!!pendingDomain} onOpenChange={(open) => !open && setPendingDomain(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Configurar DNS</DialogTitle>
              <DialogDescription>
                Configure o CNAME para ativar {instructions.hostname}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-medium">1. Adicione um registro CNAME no seu DNS</h4>
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tipo:</span>
                    <code className="font-mono text-sm">{instructions.type}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Host/Nome:</span>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm">{instructions.host}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(instructions.host)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Destino/Valor:</span>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm">{instructions.target}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(instructions.target)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Acesse o painel do seu provedor de domínio (Cloudflare, Registro.br, GoDaddy, etc.) e adicione o registro CNAME acima.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">2. Verificar conexão</h4>
                <Button
                  onClick={handleVerifyDns}
                  disabled={verifying}
                  className="w-full"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Verificar na Cloudflare"
                  )}
                </Button>
                {dnsResult && (
                  <div className="rounded-lg border p-4">
                    {dnsResult.verified ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">Domínio ativo!</span>
                      </div>
                    ) : dnsResult.dns_configured ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-amber-600">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span className="font-medium">A Cloudflare ainda está validando</span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Hostname: <code className="font-mono">{dnsResult.hostname_status}</code></p>
                          <p>Certificado: <code className="font-mono">{dnsResult.ssl_status}</code></p>
                        </div>
                        {dnsResult.error && <p className="text-sm text-destructive">{dnsResult.error}</p>}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertCircle className="h-5 w-5" />
                          <span className="font-medium">CNAME não encontrado</span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Esperado: <code className="font-mono">{dnsResult.expected_cname}</code></p>
                          <p>Encontrado: <code className="font-mono">{dnsResult.found_cname || "Nenhum registro CNAME"}</code></p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          A propagação pode levar alguns minutos. Aguarde e tente novamente.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                A Cloudflare emitirá e renovará o certificado SSL automaticamente. Nenhuma ativação manual é necessária.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
