"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Gateway, GatewayProvider } from "@/types";
import { GATEWAY_LABELS } from "@/types";
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  Zap,
  Percent,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const PROVIDERS: { value: GatewayProvider; label: string }[] = [
  { value: "unipay", label: "Unipay (FastSoft)" },
  { value: "mercadopago", label: "Mercado Pago" },
  { value: "stripe", label: "Stripe" },
  { value: "pagseguro", label: "PagSeguro" },
  { value: "asaas", label: "Asaas" },
];

interface FormData {
  provider: GatewayProvider;
  api_key: string;
  secret_key: string;
  is_active: boolean;
  installment_type: "default" | "custom";
  default_installment_rate: number;
  installment_rates: (number | null)[];
  pre_selected_installment: number;
  installment_limit: number;
}

const EMPTY_FORM: FormData = {
  provider: "unipay",
  api_key: "",
  secret_key: "",
  is_active: true,
  installment_type: "default",
  default_installment_rate: 3.14,
  installment_rates: Array(12).fill(null),
  pre_selected_installment: 1,
  installment_limit: 12,
};

function parseRate(v: string): number | null {
  if (v.trim() === "" || v.trim() === "0") return 0;
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? null : n;
}

function formatRate(v: number | null): string {
  if (v === null || v === undefined) return "";
  return v.toString().replace(".", ",");
}

export default function GatewaysPage() {
  const { selectedStore } = useStore();
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchGateways = async () => {
    if (!selectedStore) return;
    setLoading(true);
    try {
      const data = await api.get<Gateway[]>(
        `/stores/${selectedStore.id}/gateways`
      );
      setGateways(data);
    } catch {
      toast.error("Erro ao carregar gateways.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGateways();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsOpen(true);
  };

  const openEdit = (gw: Gateway) => {
    const rates = gw.installment_rates ?? Array(12).fill(null);
    const padded = [...rates, ...Array(Math.max(0, 12 - rates.length)).fill(null)];
    setEditingId(gw.id);
    setForm({
      provider: gw.provider as GatewayProvider,
      api_key: gw.api_key ?? "",
      secret_key: gw.secret_key ?? "",
      is_active: gw.is_active,
      installment_type: gw.installment_type ?? "default",
      default_installment_rate: gw.default_installment_rate ?? 3.14,
      installment_rates: padded.slice(0, 12),
      pre_selected_installment: gw.pre_selected_installment ?? 1,
      installment_limit: gw.installment_limit ?? 12,
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!selectedStore) return;
    setSaving(true);
    try {
      const payload = {
        provider: form.provider,
        api_key: form.api_key,
        secret_key: form.secret_key,
        is_active: form.is_active,
        installment_type: form.installment_type,
        default_installment_rate: form.default_installment_rate,
        installment_rates: form.installment_type === "custom" ? form.installment_rates : Array(12).fill(form.default_installment_rate),
        pre_selected_installment: form.pre_selected_installment,
        installment_limit: form.installment_limit,
      };
      if (editingId) {
        await api.put(
          `/stores/${selectedStore.id}/gateways/${editingId}`,
          payload
        );
        toast.success("Gateway atualizado!");
      } else {
        await api.post(`/stores/${selectedStore.id}/gateways`, payload);
        toast.success("Gateway adicionado!");
      }
      setIsOpen(false);
      fetchGateways();
    } catch {
      toast.error("Erro ao salvar gateway.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!selectedStore) return;
    if (!confirm("Remover este gateway?")) return; // eslint-disable-line no-alert
    try {
      await api.delete(`/stores/${selectedStore.id}/gateways/${id}`);
      toast.success("Gateway removido!");
      fetchGateways();
    } catch {
      toast.error("Erro ao remover gateway.");
    }
  };

  const handleToggleActive = async (gw: Gateway) => {
    if (!selectedStore) return;
    try {
      await api.put(
        `/stores/${selectedStore.id}/gateways/${gw.id}`,
        { is_active: !gw.is_active }
      );
      setGateways((prev) =>
        prev.map((g) =>
          g.id === gw.id ? { ...g, is_active: !g.is_active } : g
        )
      );
      toast.success(
        gw.is_active ? "Gateway desativado." : "Gateway ativado."
      );
    } catch {
      toast.error("Erro ao alterar status do gateway.");
    }
  };

  const handleTest = async (id: number) => {
    if (!selectedStore) return;
    try {
      const result = await api.post<{ success: boolean; message: string }>(
        `/stores/${selectedStore.id}/gateways/${id}/test`
      );
      toast.success(result.message);
    } catch {
      toast.error("Erro ao testar gateway.");
    }
  };

  const handleRateChange = (idx: number, value: string) => {
    setForm((f) => {
      const rates = [...f.installment_rates];
      rates[idx] = parseRate(value);
      return { ...f, installment_rates: rates };
    });
  };

  return (
    <>
      <PageHeader
        title="Gateways de Pagamento"
        description="Configure os provedores de pagamento aceitos no checkout."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Adicionar Gateway
          </Button>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))
        ) : gateways.length > 0 ? (
          gateways.map((gw) => (
            <Card key={gw.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {GATEWAY_LABELS[gw.provider] ?? gw.provider}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Adicionado {formatDate(gw.created_at ?? "")}
                    </p>
                  </div>
                </div>
                <Badge variant={gw.is_active ? "success" : "secondary"}>
                  {gw.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Ativar no checkout
                  </Label>
                  <Switch
                    checked={gw.is_active}
                    onCheckedChange={() => handleToggleActive(gw)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEdit(gw)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleTest(gw.id)}
                  >
                    <Zap className="h-3.5 w-3.5" /> Testar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(gw.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <EmptyState
            icon={CreditCard}
            title="Nenhum gateway configurado"
            description="Adicione um provedor de pagamento para começar a receber."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Adicionar Gateway
              </Button>
            }
            className="sm:col-span-2 lg:col-span-3"
          />
        )}
      </div>

      {/* Dialog Criar/Editar Gateway */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Gateway" : "Adicionar Gateway"}
            </DialogTitle>
            <DialogDescription>
              Configure as credenciais do provedor de pagamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Provedor</Label>
              <Select
                value={form.provider}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, provider: v as GatewayProvider }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Chave Pública (API Key)</Label>
              <Input
                type="password"
                placeholder="pk_live_..."
                value={form.api_key}
                onChange={(e) =>
                  setForm((f) => ({ ...f, api_key: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Chave pública usada no SDK client-side (checkout).
              </p>
            </div>

            <div className="space-y-2">
              <Label>Chave Secreta (Secret Key)</Label>
              <Input
                type="password"
                placeholder="sk_..."
                value={form.secret_key}
                onChange={(e) =>
                  setForm((f) => ({ ...f, secret_key: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Chave secreta usada no servidor (Basic Auth). Nunca exponha no frontend.
              </p>
            </div>

            {/* Separator */}
            <div className="border-t border-border" />

            {/* Installment Configuration */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Percent className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-semibold">Configuração de Parcelamento</h3>
              </div>

              {/* Toggle custom rates */}
              <div className="flex items-center justify-between">
                <Label className="text-sm">Utilizar juros customizados por parcela</Label>
                <Switch
                  checked={form.installment_type === "custom"}
                  onCheckedChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      installment_type: v ? "custom" : "default",
                    }))
                  }
                />
              </div>

              {form.installment_type === "default" && (
                <div className="space-y-2">
                  <Label>Taxa de parcelamento</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="3,14"
                      value={formatRate(form.default_installment_rate)}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          default_installment_rate: parseFloat(e.target.value.replace(",", ".")) || 0,
                        }))
                      }
                      className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Taxa de juros compostos aplicada a todas as parcelas (1x a 12x). Padrão: 3,14%.
                  </p>
                </div>
              )}

              {form.installment_type === "custom" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Caso queira a parcela sem juros, adicione valor 0 (Zero).
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {form.installment_rates.map((rate, idx) => (
                      <div key={idx} className="space-y-1">
                        <Label className="text-xs">Em {idx + 1}x</Label>
                        <div className="relative">
                          <Input
                            type="text"
                            placeholder="0"
                            value={formatRate(rate)}
                            onChange={(e) => handleRateChange(idx, e.target.value)}
                            className="pr-8 text-sm h-8"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            %
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pre-selected installment */}
              <div className="space-y-2">
                <Label>Parcela pré-selecionada</Label>
                <Select
                  value={String(form.pre_selected_installment)}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      pre_selected_installment: parseInt(v),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}x
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Parcela que aparecerá selecionada por padrão no checkout.
                </p>
              </div>

              {/* Installment limit */}
              <div className="space-y-2">
                <Label>Limite de parcelas</Label>
                <Select
                  value={String(form.installment_limit)}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      installment_limit: parseInt(v),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}x
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Número máximo de parcelas disponíveis no checkout.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? "Salvando..."
                : editingId
                  ? "Salvar"
                  : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
