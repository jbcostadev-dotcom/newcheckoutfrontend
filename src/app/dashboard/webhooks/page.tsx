"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Webhook as WebhookIcon,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";

const EVENT_OPTIONS = [
  {
    value: "ORDER_CREATED",
    label: "Pedido criado",
    description: "O cliente iniciou um pedido no checkout.",
  },
  {
    value: "ORDER_PAID",
    label: "Pedido pago",
    description: "O pagamento foi confirmado.",
  },
  {
    value: "ORDER_REFUSED",
    label: "Pedido recusado",
    description: "A tentativa no cartão foi recusada.",
  },
  {
    value: "CART_ABANDONED",
    label: "Carrinho abandonado",
    description: "O cliente ficou 15 minutos sem iniciar o pagamento.",
  },
  {
    value: "PIX_CREATED",
    label: "Pix gerado",
    description: "Um código Pix foi gerado e aguarda pagamento.",
  },
  {
    value: "BILLET_CREATED",
    label: "Boleto gerado",
    description: "O boleto continua pendente após 15 minutos.",
  },
] as const;

type WebhookEvent = (typeof EVENT_OPTIONS)[number]["value"];

interface WebhookEndpoint {
  id: number;
  name: string;
  url: string;
  token: string;
  events: WebhookEvent[];
  is_active: boolean;
  deliveries_count?: number;
  created_at: string;
}

interface WebhookForm {
  name: string;
  url: string;
  events: WebhookEvent[];
  is_active: boolean;
  token: string;
}

const EMPTY_FORM: WebhookForm = {
  name: "",
  url: "",
  events: [],
  is_active: true,
  token: "",
};

export default function WebhooksPage() {
  const { selectedStore } = useStore();
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<WebhookForm>(EMPTY_FORM);

  const fetchWebhooks = useCallback(async () => {
    if (!selectedStore) {
      setWebhooks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await api.get<WebhookEndpoint[]>(
        `/stores/${selectedStore.id}/webhooks`
      );
      setWebhooks(data);
    } catch {
      toast.error("Não foi possível carregar os webhooks.");
    } finally {
      setLoading(false);
    }
  }, [selectedStore]);

  useEffect(() => {
    void fetchWebhooks();
  }, [fetchWebhooks]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") === "1") {
      setEditingId(null);
      setForm(EMPTY_FORM);
      setFormVisible(true);
    }
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormVisible(true);
  };

  const openEdit = (webhook: WebhookEndpoint) => {
    setEditingId(webhook.id);
    setForm({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      is_active: webhook.is_active,
      token: webhook.token,
    });
    setFormVisible(true);
  };

  const closeForm = () => {
    setFormVisible(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const toggleEvent = (event: WebhookEvent, checked: boolean) => {
    setForm((current) => ({
      ...current,
      events: checked
        ? [...current.events, event]
        : current.events.filter((item) => item !== event),
    }));
  };

  const handleSave = async () => {
    if (!selectedStore) return;
    if (!form.name.trim() || !form.url.trim()) {
      toast.error("Preencha o nome e a URL do webhook.");
      return;
    }
    if (form.events.length === 0) {
      toast.error("Selecione pelo menos um evento.");
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      url: form.url.trim(),
      events: form.events,
      is_active: form.is_active,
    };

    try {
      if (editingId) {
        await api.put(
          `/stores/${selectedStore.id}/webhooks/${editingId}`,
          payload
        );
        toast.success("Webhook atualizado.");
      } else {
        await api.post(`/stores/${selectedStore.id}/webhooks`, payload);
        toast.success("Webhook criado.");
      }

      closeForm();
      await fetchWebhooks();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRotateToken = async () => {
    if (!selectedStore || !editingId) return;
    setRotating(true);
    try {
      const updated = await api.post<WebhookEndpoint>(
        `/stores/${selectedStore.id}/webhooks/${editingId}/rotate-token`
      );
      setForm((current) => ({ ...current, token: updated.token }));
      setWebhooks((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      toast.success("Token renovado. Atualize o sistema receptor.");
    } catch {
      toast.error("Não foi possível renovar o token.");
    } finally {
      setRotating(false);
    }
  };

  const handleDelete = async (webhook: WebhookEndpoint) => {
    if (!selectedStore) return;
    if (!window.confirm(`Remover o webhook "${webhook.name}"?`)) return;

    try {
      await api.delete(
        `/stores/${selectedStore.id}/webhooks/${webhook.id}`
      );
      if (editingId === webhook.id) closeForm();
      setWebhooks((current) =>
        current.filter((item) => item.id !== webhook.id)
      );
      toast.success("Webhook removido.");
    } catch {
      toast.error("Não foi possível remover o webhook.");
    }
  };

  const copyToken = async (token: string) => {
    await navigator.clipboard.writeText(token);
    toast.success("Token copiado.");
  };

  return (
    <>
      <PageHeader
        className="min-w-0"
        title="Webhooks"
        description={`Envie eventos do checkout de ${selectedStore?.name ?? "sua loja"} para outros sistemas.`}
        actions={
          !formVisible ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Novo webhook
            </Button>
          ) : undefined
        }
      />

      <div className="mt-6 flex min-w-0 items-start gap-3 rounded-xl border bg-card p-4 text-sm shadow-[var(--panel-shadow)]">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="font-medium">Entrega autenticada e assíncrona</p>
          <p className="mt-1 break-words text-muted-foreground">
            Enviamos JSON por POST com o token no header Authorization. O seu
            endpoint deve responder com status 2xx em até 5 segundos.
          </p>
        </div>
      </div>

      {formVisible && (
        <div className="mt-6 grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>
                {editingId ? "Editar webhook" : "Criar webhook"}
              </CardTitle>
              <CardDescription>
                Defina o destino e escolha quais mudanças devem ser enviadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="webhook-name">Nome</Label>
                <Input
                  id="webhook-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Automação de pedidos"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-url">URL pública</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  value={form.url}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      url: event.target.value,
                    }))
                  }
                  placeholder="https://seusistema.com/webhooks/checkout"
                  autoComplete="url"
                />
                <p className="text-xs text-muted-foreground">
                  Endereços locais e redes privadas não são aceitos.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-token">Token</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="webhook-token"
                    className="min-w-0 font-mono text-xs"
                    value={
                      form.token || "O token será gerado depois de salvar"
                    }
                    readOnly
                  />
                  {form.token && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void copyToken(form.token)}
                    >
                      <Copy className="h-4 w-4" /> Copiar
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Enviado como Authorization: Bearer &lt;token&gt; em cada
                  requisição.
                </p>
              </div>

              <div>
                <div className="mb-3">
                  <h2 className="font-semibold">Eventos</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Selecione ao menos um evento para ativar a entrega.
                  </p>
                </div>
                <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
                  {EVENT_OPTIONS.map((event) => {
                    const checked = form.events.includes(event.value);
                    return (
                      <label
                        key={event.value}
                        className="flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border bg-background p-4 transition-colors hover:bg-accent/40"
                      >
                        <Switch
                          className="mt-0.5"
                          checked={checked}
                          onCheckedChange={(value) =>
                            toggleEvent(event.value, value)
                          }
                          aria-label={event.label}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">
                            {event.label}
                          </span>
                          <span className="mt-1 block break-words text-xs leading-relaxed text-muted-foreground">
                            {event.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={closeForm} disabled={saving}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? "Salvar alterações" : "Adicionar webhook"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="min-w-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status do webhook</CardTitle>
                <CardDescription>
                  Pause entregas sem apagar a configuração.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <label className="flex cursor-pointer items-center justify-between rounded-xl border bg-background p-4">
                  <span className="flex items-center gap-3 text-sm font-medium">
                    <CheckCircle2
                      className={
                        form.is_active
                          ? "h-5 w-5 text-primary"
                          : "h-5 w-5 text-muted-foreground"
                      }
                    />
                    {form.is_active ? "Ativo" : "Inativo"}
                  </span>
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        is_active: value,
                      }))
                    }
                    aria-label="Status do webhook"
                  />
                </label>
              </CardContent>
            </Card>

            {editingId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <KeyRound className="h-4 w-4" /> Segurança
                  </CardTitle>
                  <CardDescription>
                    Trocar o token invalida imediatamente o anterior.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleRotateToken}
                    disabled={rotating}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${rotating ? "animate-spin" : ""}`}
                    />
                    Renovar token
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Endpoints cadastrados</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada endpoint recebe somente os eventos selecionados.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-52 rounded-xl" />
            ))}
          </div>
        ) : webhooks.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={WebhookIcon}
                title="Nenhum webhook cadastrado"
                description="Crie um endpoint para receber eventos do checkout em tempo real."
                action={
                  <Button onClick={openCreate}>
                    <Plus className="h-4 w-4" /> Criar webhook
                  </Button>
                }
                className="border-0"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardHeader className="flex-row items-start justify-between space-y-0">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="truncate text-base">
                        {webhook.name}
                      </CardTitle>
                      <Badge
                        variant={webhook.is_active ? "success" : "secondary"}
                      >
                        {webhook.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <CardDescription className="mt-2 break-all font-mono text-xs">
                      {webhook.url}
                    </CardDescription>
                  </div>
                  <div className="ml-3 flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(webhook)}
                      aria-label={`Editar ${webhook.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => void handleDelete(webhook)}
                      aria-label={`Remover ${webhook.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.map((event) => (
                      <Badge key={event} variant="outline">
                        {EVENT_OPTIONS.find((item) => item.value === event)
                          ?.label ?? event}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-5 text-xs text-muted-foreground">
                    {webhook.deliveries_count ?? 0} entrega(s) registrada(s)
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
