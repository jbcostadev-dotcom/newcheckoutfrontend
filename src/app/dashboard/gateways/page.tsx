"use client";

import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import type { Gateway, GatewayProvider, CheckoutSettings } from "@/types";
import { GATEWAY_LABELS } from "@/types";
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  Zap,
  Percent,
  ExternalLink,
  Save,
  QrCode,
  Barcode,
  ChevronUp,
  ChevronDown,
  X,
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

/* ── Provider metadata for premium cards ── */
const PROVIDER_META: Record<
  string,
  {
    icon: string;
    color: string;
    description: string;
    methods: string[];
    isNew?: boolean;
  }
> = {
  unipay: {
    icon: "U",
    color: "hsl(243 75% 59%)",
    description: "A Unipay (FastSoft) oferece processamento de pagamentos via PIX e Cartão.",
    methods: ["PIX", "Cartão"],
    isNew: true,
  },
  mercadopago: {
    icon: "M",
    color: "hsl(199 100% 44%)",
    description: "O Mercado Pago oferece pagamentos via PIX, Cartão e Boleto.",
    methods: ["PIX", "Cartão", "Boleto"],
  },
  stripe: {
    icon: "S",
    color: "hsl(250 75% 60%)",
    description: "A Stripe oferece processamento de pagamentos via Cartão de crédito.",
    methods: ["Cartão"],
  },
  pagseguro: {
    icon: "P",
    color: "hsl(142 70% 45%)",
    description: "O PagSeguro oferece pagamentos via PIX, Cartão e Boleto.",
    methods: ["PIX", "Cartão", "Boleto"],
  },
  asaas: {
    icon: "A",
    color: "hsl(38 92% 50%)",
    description: "O Asaas oferece pagamentos via PIX e Cartão d...",
    methods: ["PIX", "Cartão"],
    isNew: true,
  },
};

const METHOD_ICON: Record<string, React.ReactNode> = {
  PIX: <QrCode className="h-3 w-3" />,
  Cartão: <CreditCard className="h-3 w-3" />,
  Boleto: <Barcode className="h-3 w-3" />,
};

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
  interest_free_installments: number;
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
  interest_free_installments: 1,
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

  /* ── Payment method settings state (arrays for fallback) ── */
  const [paymentSettings, setPaymentSettings] = useState({
    pix_enabled: true,
    pix_gateway_ids: [] as number[],
    card_enabled: true,
    card_gateway_ids: [] as number[],
    boleto_enabled: false,
    boleto_gateway_ids: [] as number[],
    default_payment_method: "credit_card" as "credit_card" | "pix" | "boleto",
  });
  const [savingPayment, setSavingPayment] = useState(false);

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

  const fetchPaymentSettings = useCallback(async () => {
    if (!selectedStore) return;
    try {
      const data = await api.get<CheckoutSettings>(
        `/stores/${selectedStore.id}/settings`
      );
      setPaymentSettings({
        pix_enabled: data.pix_enabled ?? true,
        pix_gateway_ids: data.pix_gateway_ids ?? (data.pix_gateway_id ? [data.pix_gateway_id] : []),
        card_enabled: data.card_enabled ?? true,
        card_gateway_ids: data.card_gateway_ids ?? (data.card_gateway_id ? [data.card_gateway_id] : []),
        boleto_enabled: data.boleto_enabled ?? false,
        boleto_gateway_ids: data.boleto_gateway_ids ?? (data.boleto_gateway_id ? [data.boleto_gateway_id] : []),
        default_payment_method: data.default_payment_method ?? "credit_card",
      });
    } catch {
      // silent — settings may not exist yet
    }
  }, [selectedStore]);

  useEffect(() => {
    fetchGateways();
    fetchPaymentSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore]);

  // Auto-fill: when gateways load, if a method is enabled but has no gateways, assign the first active one.
  useEffect(() => {
    const active = gateways.filter((g) => g.is_active);
    if (active.length === 0) return;
    const firstId = active[0].id;
    let changed = false;
    const patch: Partial<typeof paymentSettings> = {};

    if (paymentSettings.pix_enabled && paymentSettings.pix_gateway_ids.length === 0) {
      patch.pix_gateway_ids = [firstId];
      changed = true;
    }
    if (paymentSettings.card_enabled && paymentSettings.card_gateway_ids.length === 0) {
      patch.card_gateway_ids = [firstId];
      changed = true;
    }
    if (paymentSettings.boleto_enabled && paymentSettings.boleto_gateway_ids.length === 0) {
      patch.boleto_gateway_ids = [firstId];
      changed = true;
    }

    if (changed) {
      setPaymentSettings((prev) => ({ ...prev, ...patch }));
    }
  }, [gateways]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSavePaymentSettings = async () => {
    if (!selectedStore) return;
    setSavingPayment(true);
    try {
      await api.put(`/stores/${selectedStore.id}/settings`, {
        pix_enabled: paymentSettings.pix_enabled,
        pix_gateway_ids: paymentSettings.pix_gateway_ids,
        pix_gateway_id: paymentSettings.pix_gateway_ids[0] ?? null,
        card_enabled: paymentSettings.card_enabled,
        card_gateway_ids: paymentSettings.card_gateway_ids,
        card_gateway_id: paymentSettings.card_gateway_ids[0] ?? null,
        boleto_enabled: paymentSettings.boleto_enabled,
        boleto_gateway_ids: paymentSettings.boleto_gateway_ids,
        boleto_gateway_id: paymentSettings.boleto_gateway_ids[0] ?? null,
        default_payment_method: paymentSettings.default_payment_method,
      });
      toast.success("Métodos de pagamento salvos!");
    } catch {
      toast.error("Erro ao salvar métodos de pagamento.");
    } finally {
      setSavingPayment(false);
    }
  };

  const updatePayment = <K extends keyof typeof paymentSettings>(
    key: K,
    value: (typeof paymentSettings)[K]
  ) => {
    setPaymentSettings((prev) => ({ ...prev, [key]: value }));
  };

  /* ── Gateway list helpers ── */
  type GatewayListKey = "pix_gateway_ids" | "card_gateway_ids" | "boleto_gateway_ids";

  const addGatewayToList = (listKey: GatewayListKey, gwId: number) => {
    setPaymentSettings((prev) => {
      const current = prev[listKey];
      if (current.includes(gwId)) return prev;
      return { ...prev, [listKey]: [...current, gwId] };
    });
  };

  const removeGatewayFromList = (listKey: GatewayListKey, gwId: number) => {
    setPaymentSettings((prev) => ({
      ...prev,
      [listKey]: prev[listKey].filter((id) => id !== gwId),
    }));
  };

  const moveGatewayInList = (listKey: GatewayListKey, idx: number, direction: "up" | "down") => {
    setPaymentSettings((prev) => {
      const arr = [...prev[listKey]];
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= arr.length) return prev;
      [arr[idx], arr[targetIdx]] = [arr[targetIdx], arr[idx]];
      return { ...prev, [listKey]: arr };
    });
  };

  const getAvailableGateways = (listKey: GatewayListKey) => {
    const usedIds = paymentSettings[listKey];
    return activeGateways.filter((g) => !usedIds.includes(g.id));
  };

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
      interest_free_installments: gw.interest_free_installments ?? 1,
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
        interest_free_installments: form.interest_free_installments,
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

  const activeGateways = gateways.filter((g) => g.is_active);

  return (
    <>
      <PageHeader
        title="Gateways de Pagamento"
        description="Configure os provedores de pagamento e métodos aceitos no checkout."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Adicionar Gateway
          </Button>
        }
      />

      {/* ═══ Payment Methods Control Section ═══ */}
      <Card className="mt-6 border-border/60 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Métodos de Pagamento</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ative os métodos e selecione qual gateway processar cada um.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleSavePaymentSettings}
              disabled={savingPayment}
              className="gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              {savingPayment ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Default payment method */}
          <div className="mb-5 max-w-xs">
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Pagamento pré-selecionado
            </Label>
            <Select
              value={paymentSettings.default_payment_method}
              onValueChange={(v) =>
                updatePayment("default_payment_method", v as "credit_card" | "pix" | "boleto")
              }
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">Cartão de crédito</SelectItem>
                <SelectItem value="pix">Pix</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* ── PIX ── */}
            {(() => {
              const listKey: GatewayListKey = "pix_gateway_ids";
              const enabled = paymentSettings.pix_enabled;
              const ids = paymentSettings.pix_gateway_ids;
              const available = getAvailableGateways(listKey);
              return (
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-semibold">Pix</span>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(v) => updatePayment("pix_enabled", v)}
                    />
                  </div>
                  {enabled && (
                    <>
                      {ids.length === 0 && (
                        <p className="text-[11px] text-muted-foreground italic">Nenhuma gateway selecionada</p>
                      )}
                      <div className="space-y-1.5">
                        {ids.map((gwId, idx) => {
                          const gw = gateways.find((g) => g.id === gwId);
                          return (
                            <div key={gwId} className="flex items-center gap-1.5 rounded-md border border-border/40 bg-card px-2.5 py-1.5">
                              <span className="flex-1 text-xs font-medium truncate">
                                {gw ? (GATEWAY_LABELS[gw.provider] ?? gw.provider) : `#${gwId}`}
                              </span>
                              <Badge variant={idx === 0 ? "success" : "secondary"} className="text-[9px] px-1.5 py-0 h-4 shrink-0">
                                {idx === 0 ? "Principal" : `Fallback ${idx}`}
                              </Badge>
                              <button onClick={() => moveGatewayInList(listKey, idx, "up")} disabled={idx === 0} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors" title="Subir">
                                <ChevronUp className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => moveGatewayInList(listKey, idx, "down")} disabled={idx === ids.length - 1} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors" title="Descer">
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => removeGatewayFromList(listKey, gwId)} className="p-0.5 text-destructive hover:text-destructive/80 transition-colors" title="Remover">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      {available.length > 0 && (
                        <Select onValueChange={(v) => addGatewayToList(listKey, Number(v))}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="+ Adicionar fallback" />
                          </SelectTrigger>
                          <SelectContent>
                            {available.map((g) => (
                              <SelectItem key={g.id} value={String(g.id)}>
                                {GATEWAY_LABELS[g.provider] ?? g.provider}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

            {/* ── Cartão ── */}
            {(() => {
              const listKey: GatewayListKey = "card_gateway_ids";
              const enabled = paymentSettings.card_enabled;
              const ids = paymentSettings.card_gateway_ids;
              const available = getAvailableGateways(listKey);
              return (
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-semibold">Cartão de Crédito</span>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(v) => updatePayment("card_enabled", v)}
                    />
                  </div>
                  {enabled && (
                    <>
                      {ids.length === 0 && (
                        <p className="text-[11px] text-muted-foreground italic">Nenhuma gateway selecionada</p>
                      )}
                      <div className="space-y-1.5">
                        {ids.map((gwId, idx) => {
                          const gw = gateways.find((g) => g.id === gwId);
                          return (
                            <div key={gwId} className="flex items-center gap-1.5 rounded-md border border-border/40 bg-card px-2.5 py-1.5">
                              <span className="flex-1 text-xs font-medium truncate">
                                {gw ? (GATEWAY_LABELS[gw.provider] ?? gw.provider) : `#${gwId}`}
                              </span>
                              <Badge variant={idx === 0 ? "success" : "secondary"} className="text-[9px] px-1.5 py-0 h-4 shrink-0">
                                {idx === 0 ? "Principal" : `Fallback ${idx}`}
                              </Badge>
                              <button onClick={() => moveGatewayInList(listKey, idx, "up")} disabled={idx === 0} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors" title="Subir">
                                <ChevronUp className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => moveGatewayInList(listKey, idx, "down")} disabled={idx === ids.length - 1} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors" title="Descer">
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => removeGatewayFromList(listKey, gwId)} className="p-0.5 text-destructive hover:text-destructive/80 transition-colors" title="Remover">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      {available.length > 0 && (
                        <Select onValueChange={(v) => addGatewayToList(listKey, Number(v))}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="+ Adicionar fallback" />
                          </SelectTrigger>
                          <SelectContent>
                            {available.map((g) => (
                              <SelectItem key={g.id} value={String(g.id)}>
                                {GATEWAY_LABELS[g.provider] ?? g.provider}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

            {/* ── Boleto ── */}
            {(() => {
              const listKey: GatewayListKey = "boleto_gateway_ids";
              const enabled = paymentSettings.boleto_enabled;
              const ids = paymentSettings.boleto_gateway_ids;
              const available = getAvailableGateways(listKey);
              return (
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Barcode className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-semibold">Boleto</span>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(v) => updatePayment("boleto_enabled", v)}
                    />
                  </div>
                  {enabled && (
                    <>
                      {ids.length === 0 && (
                        <p className="text-[11px] text-muted-foreground italic">Nenhuma gateway selecionada</p>
                      )}
                      <div className="space-y-1.5">
                        {ids.map((gwId, idx) => {
                          const gw = gateways.find((g) => g.id === gwId);
                          return (
                            <div key={gwId} className="flex items-center gap-1.5 rounded-md border border-border/40 bg-card px-2.5 py-1.5">
                              <span className="flex-1 text-xs font-medium truncate">
                                {gw ? (GATEWAY_LABELS[gw.provider] ?? gw.provider) : `#${gwId}`}
                              </span>
                              <Badge variant={idx === 0 ? "success" : "secondary"} className="text-[9px] px-1.5 py-0 h-4 shrink-0">
                                {idx === 0 ? "Principal" : `Fallback ${idx}`}
                              </Badge>
                              <button onClick={() => moveGatewayInList(listKey, idx, "up")} disabled={idx === 0} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors" title="Subir">
                                <ChevronUp className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => moveGatewayInList(listKey, idx, "down")} disabled={idx === ids.length - 1} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors" title="Descer">
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => removeGatewayFromList(listKey, gwId)} className="p-0.5 text-destructive hover:text-destructive/80 transition-colors" title="Remover">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      {available.length > 0 && (
                        <Select onValueChange={(v) => addGatewayToList(listKey, Number(v))}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="+ Adicionar fallback" />
                          </SelectTrigger>
                          <SelectContent>
                            {available.map((g) => (
                              <SelectItem key={g.id} value={String(g.id)}>
                                {GATEWAY_LABELS[g.provider] ?? g.provider}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
          </div>

          {activeGateways.length === 0 && (
            <p className="text-[11px] text-muted-foreground text-center py-3 mt-3 border-t border-border/40">
              Nenhuma gateway ativa. Conecte uma gateway abaixo para usar nos métodos de pagamento.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ═══ Gateway Cards — Premium Dark Design ═══ */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Gateways Cadastradas</h2>
          <span className="text-xs text-muted-foreground">
            {gateways.length} gateway{gateways.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-56 w-full rounded-xl" />
            ))
          ) : gateways.length > 0 ? (
            gateways.map((gw) => {
              const meta = PROVIDER_META[gw.provider] ?? {
                icon: (gw.provider ?? "?")[0].toUpperCase(),
                color: "hsl(243 75% 59%)",
                description: `Gateway ${GATEWAY_LABELS[gw.provider] ?? gw.provider}`,
                methods: ["PIX"],
              };

              return (
                <div
                  key={gw.id}
                  className="group relative flex flex-col rounded-xl border border-border/40 bg-card overflow-hidden transition-all duration-300 hover:border-border/80 hover:shadow-lg hover:shadow-primary/5"
                >
                  {/* Card body */}
                  <div className="flex-1 p-5">
                    {/* Top row: icon + status */}
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white shadow-lg transition-transform duration-300 group-hover:scale-105"
                        style={{ backgroundColor: meta.color }}
                      >
                        {meta.icon}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            gw.is_active
                              ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                              : "bg-zinc-500"
                          }`}
                        />
                        <span className="text-[11px] text-muted-foreground">
                          {gw.is_active ? "Disponível" : "Inativo"}
                        </span>
                      </div>
                    </div>

                    {/* Name + badge */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-bold leading-tight">
                        {GATEWAY_LABELS[gw.provider] ?? gw.provider}
                      </h3>
                      {(meta as { isNew?: boolean }).isNew && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-1.5 py-0 h-4 font-bold bg-primary/15 text-primary border-0"
                        >
                          NOVO
                        </Badge>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                      {meta.description}
                    </p>

                    {/* Method badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {meta.methods.map((method) => (
                        <span
                          key={method}
                          className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                        >
                          {METHOD_ICON[method]}
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="border-t border-border/40 p-3 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 text-xs gap-1.5 transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary"
                      onClick={() => openEdit(gw)}
                    >
                      Conectar <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-foreground"
                      onClick={() => handleToggleActive(gw)}
                      title={gw.is_active ? "Desativar" : "Ativar"}
                    >
                      <Zap className={`h-3.5 w-3.5 ${gw.is_active ? "text-emerald-500" : ""}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(gw.id)}
                      title="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
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
              className="sm:col-span-2 lg:col-span-3 xl:col-span-4"
            />
          )}
        </div>
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

              {/* Interest-free installments */}
              <div className="space-y-2">
                <Label>Parcelas sem juros</Label>
                <Select
                  value={String(form.interest_free_installments)}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      interest_free_installments: parseInt(v),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        Até {n}x
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Parcelas de 1x até essa quantidade não terão juros.
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
