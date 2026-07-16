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
}

const EMPTY_FORM: FormData = {
  provider: "unipay",
  api_key: "",
  secret_key: "",
  is_active: true,
};

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
    setEditingId(gw.id);
    setForm({
      provider: gw.provider as GatewayProvider,
      api_key: gw.api_key ?? "",
      secret_key: gw.secret_key ?? "",
      is_active: gw.is_active,
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!selectedStore) return;
    setSaving(true);
    try {
      if (editingId) {
        await api.put(
          `/stores/${selectedStore.id}/gateways/${editingId}`,
          form
        );
        toast.success("Gateway atualizado!");
      } else {
        await api.post(`/stores/${selectedStore.id}/gateways`, form);
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Gateway" : "Adicionar Gateway"}
            </DialogTitle>
            <DialogDescription>
              Configure as credenciais do provedor de pagamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
