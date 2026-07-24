"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import type {
  WhatsappChip,
  WhatsappTemplate,
  WhatsappTemplateEvent,
  WhatsappTemplateFormData,
  WhatsappLog,
  Paginated,
} from "@/types";
import {
  WHATSAPP_CHIP_STATUS_LABEL,
  WHATSAPP_EVENT_LABEL,
  WHATSAPP_EVENT_DESCRIPTION,
} from "@/types";
import {
  MessageCircle,
  Plus,
  QrCode,
  RefreshCw,
  Trash2,
  LogOut,
  Pencil,
  Check,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  XCircle,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const PAYMENT_EVENTS: WhatsappTemplateEvent[] = [
  "payment_pending",
  "payment_approved",
  "payment_refused",
];

const RECOVERY_EVENTS: WhatsappTemplateEvent[] = [
  "pix_unpaid",
  "pix_expired",
  "cart_abandoned",
];

const TEMPLATE_VARS = [
  "{{nome}}",
  "{{email}}",
  "{{telefone}}",
  "{{valor}}",
  "{{metodo}}",
  "{{pedido}}",
  "{{produtos}}",
  "{{link}}",
];

function statusBadge(status: string) {
  const cls: Record<string, string> = {
    connected: "bg-emerald-500/15 text-emerald-500 border-transparent",
    qr_ready: "bg-amber-500/15 text-amber-500 border-transparent",
    starting: "bg-blue-500/15 text-blue-500 border-transparent",
    failed: "bg-destructive/15 text-destructive border-transparent",
    disconnected: "bg-zinc-500/15 text-muted-foreground border-transparent",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${cls[status] ?? cls.disconnected}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "connected"
            ? "bg-emerald-500"
            : status === "qr_ready"
              ? "bg-amber-500"
              : status === "starting"
                ? "bg-blue-500"
                : status === "failed"
                  ? "bg-red-500"
                  : "bg-zinc-400"
        }`}
      />
      {WHATSAPP_CHIP_STATUS_LABEL[status] ?? status}
    </span>
  );
}

export default function WhatsappPage() {
  return (
    <>
      <PageHeader
        title="WhatsApp"
        description="Integre a API não oficial (WAHA) para conectar chips, criar templates de mensagens e acompanhar as entregas."
        actions={null}
      />

      <div className="mt-6">
        <Tabs defaultValue="chips" className="w-full">
          <TabsList>
            <TabsTrigger value="chips" className="gap-1.5">
              <MessageCircle className="h-4 w-4" /> Chips
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-1.5">
              <Pencil className="h-4 w-4" /> Templates
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-1.5">
              <AlertCircle className="h-4 w-4" /> Falhas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chips">
            <ChipsTab />
          </TabsContent>
          <TabsContent value="templates">
            <TemplatesTab />
          </TabsContent>
          <TabsContent value="logs">
            <LogsTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

/* ════════════════════════════ CHIPS TAB ════════════════════════════ */

function ChipsTab() {
  const { selectedStore } = useStore();
  const [chips, setChips] = useState<WhatsappChip[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Dialog: criar chip
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [chipName, setChipName] = useState("");
  const [creating, setCreating] = useState(false);

  // Dialog: QR (conectar)
  const [qrChip, setQrChip] = useState<WhatsappChip | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrRefreshing, setQrRefreshing] = useState(false);
  const [qrStatus, setQrStatus] = useState<string>("starting");
  const [qrPhone, setQrPhone] = useState<string | null>(null);
  const qrPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchChips = useCallback(async () => {
    if (!selectedStore) return;
    setLoading(true);
    try {
      const data = await api.get<WhatsappChip[]>(
        `/stores/${selectedStore.id}/whatsapp/chips`
      );
      setChips(data);
    } catch {
      toast.error("Erro ao carregar chips.");
    } finally {
      setLoading(false);
    }
  }, [selectedStore]);

  useEffect(() => {
    fetchChips();
  }, [fetchChips]);

  const handleSync = async () => {
    if (!selectedStore) return;
    setSyncing(true);
    try {
      const data = await api.post<WhatsappChip[]>(
        `/stores/${selectedStore.id}/whatsapp/chips/sync`
      );
      setChips(data);
      toast.success("Status dos chips atualizado.");
    } catch {
      toast.error("Erro ao sincronizar status.");
    } finally {
      setSyncing(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedStore || !chipName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post<{ chip: WhatsappChip; warning?: string }>(
        `/stores/${selectedStore.id}/whatsapp/chips`,
        { instance_name: chipName.trim() }
      );
      if (res.warning) toast.warning(res.warning);
      setChips((prev) => [res.chip, ...prev]);
      setChipName("");
      setIsCreateOpen(false);
      // Abre direto o dialog de conexão/QR.
      openQr(res.chip);
    } catch {
      toast.error("Erro ao criar chip.");
    } finally {
      setCreating(false);
    }
  };

  const refreshQr = useCallback(
    async (chipId: number) => {
      if (!selectedStore) return;
      try {
        const data = await api.get<{
          status: string;
          phone_number?: string | null;
          qr_code_url?: string | null;
        }>(`/stores/${selectedStore.id}/whatsapp/chips/${chipId}/qr`);
        setQrStatus(data.status);
        setQrPhone(data.phone_number ?? null);
        setQrImageUrl(data.qr_code_url ?? null);

        if (data.status === "connected") {
          if (qrPollRef.current) clearInterval(qrPollRef.current);
          qrPollRef.current = null;
          toast.success("Chip conectado com sucesso!");
          setQrRefreshing(false);
          fetchChips();
        }
      } catch {
        // erro silencioso no poll
      }
    },
    [selectedStore, fetchChips]
  );

  const openQr = useCallback(
    (chip: WhatsappChip) => {
      setQrChip(chip);
      setQrImageUrl(chip.qr_code_url ?? null);
      setQrStatus(chip.status);
      setQrPhone(chip.phone_number ?? null);
      setQrRefreshing(true);

      if (qrPollRef.current) clearInterval(qrPollRef.current);
      // Dispara imediatamente e depois a cada 5s.
      void refreshQr(chip.id);
      qrPollRef.current = setInterval(() => {
        void refreshQr(chip.id);
      }, 5000);
    },
    [refreshQr]
  );

  useEffect(() => {
    return () => {
      if (qrPollRef.current) clearInterval(qrPollRef.current);
    };
  }, []);

  const closeQr = () => {
    if (qrPollRef.current) clearInterval(qrPollRef.current);
    qrPollRef.current = null;
    setQrChip(null);
    setQrImageUrl(null);
    fetchChips();
  };

  const handleLogout = async (chip: WhatsappChip) => {
    if (!selectedStore) return;
    if (!confirm("Desconectar este chip? Você precisará escanear o QR novamente.")) return; // eslint-disable-line no-alert
    try {
      await api.post(
        `/stores/${selectedStore.id}/whatsapp/chips/${chip.id}/logout`
      );
      toast.success("Chip desconectado.");
      fetchChips();
    } catch {
      toast.error("Erro ao desconectar chip.");
    }
  };

  const handleDelete = async (chip: WhatsappChip) => {
    if (!selectedStore) return;
    if (!confirm("Remover este chip definitivamente?")) return; // eslint-disable-line no-alert
    try {
      await api.delete(
        `/stores/${selectedStore.id}/whatsapp/chips/${chip.id}`
      );
      toast.success("Chip removido.");
      fetchChips();
    } catch {
      toast.error("Erro ao remover chip.");
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Chips conectados</h2>
          <p className="text-xs text-muted-foreground">
            Cada chip é um número de WhatsApp conectado via WAHA. Escaneie o QR
            code com o WhatsApp do aparelho.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Verificando..." : "Verificar status"}
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4" /> Cadastrar chip
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : chips.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {chips.map((chip) => (
            <div
              key={chip.id}
              className="flex flex-col rounded-xl border border-border/40 bg-card overflow-hidden transition-all hover:border-border/80 hover:shadow-md"
            >
              <div className="flex-1 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  {statusBadge(chip.status)}
                </div>
                <h3 className="text-sm font-bold leading-tight truncate">
                  {chip.instance_name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {chip.phone_number
                    ? `${chip.phone_number}`
                    : chip.session_name
                      ? `Sessão: ${chip.session_name}`
                      : "Sem número conectado"}
                </p>
              </div>

              <div className="border-t border-border/40 p-3 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 text-xs gap-1.5"
                  onClick={() => openQr(chip)}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  {chip.status === "connected" ? "Reescanear" : "Conectar"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  onClick={() => handleLogout(chip)}
                  title="Desconectar"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(chip)}
                  title="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MessageCircle}
          title="Nenhum chip conectado"
          description="Cadastre um chip para gerar o QR code e conectar via WAHA."
          action={
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Cadastrar chip
            </Button>
          }
        />
      )}

      {/* Dialog: criar chip */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar chip</DialogTitle>
            <DialogDescription>
              Dê um nome ao chip (ex: Suporte). Uma sessão será criada na WAHA e
              o QR code será exibido em seguida.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="chip-name">Nome do chip</Label>
            <Input
              id="chip-name"
              placeholder="Ex: Suporte · Chip 1"
              value={chipName}
              onChange={(e) => setChipName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={creating || !chipName.trim()}>
              {creating ? "Criando..." : "Criar e gerar QR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: QR / Conectar */}
      <Dialog open={!!qrChip} onOpenChange={(o) => !o && closeQr()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar chip</DialogTitle>
            <DialogDescription>
              Abra o WhatsApp no aparelho → Menu → Aparelhos conectados →
              Conectar aparelho e escaneie o QR code abaixo.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex h-72 w-72 items-center justify-center rounded-xl border border-border/50 bg-white p-4">
              {qrStatus === "connected" ? (
                <div className="flex flex-col items-center gap-2 text-emerald-500">
                  <CheckCircle2 className="h-16 w-16" />
                  <p className="text-sm font-semibold">Chip conectado!</p>
                  {qrPhone && (
                    <p className="text-xs text-muted-foreground">{qrPhone}</p>
                  )}
                </div>
              ) : qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  alt="QR Code"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 opacity-40" />
                  <p className="text-xs">
                    {qrRefreshing ? "Aguardando QR code..." : "QR indisponível"}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {statusBadge(qrStatus)}
              {qrPhone && qrStatus !== "connected" && (
                <Badge variant="secondary" className="text-[10px]">
                  {qrPhone}
                </Badge>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => qrChip && refreshQr(qrChip.id)}
              disabled={qrRefreshing || qrStatus === "connected"}
            >
              <RefreshCw
                className={`h-4 w-4 ${qrRefreshing ? "animate-spin" : ""}`}
              />
              Atualizar QR
            </Button>
            <Button onClick={closeQr}>Concluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ════════════════════════════ TEMPLATES TAB ════════════════════════════ */

function TemplatesTab() {
  const { selectedStore } = useStore();
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentActive, setPaymentActive] = useState<WhatsappTemplateEvent>(
    "payment_pending"
  );
  const [recoveryActive, setRecoveryActive] = useState<WhatsappTemplateEvent>(
    "pix_unpaid"
  );

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<WhatsappTemplate | null>(null);
  const [form, setForm] = useState<WhatsappTemplateFormData>(getEmptyForm());
  const [saving, setSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    if (!selectedStore) return;
    setLoading(true);
    try {
      const data = await api.get<WhatsappTemplate[]>(
        `/stores/${selectedStore.id}/whatsapp/templates`
      );
      setTemplates(data);
    } catch {
      toast.error("Erro ao carregar templates.");
    } finally {
      setLoading(false);
    }
  }, [selectedStore]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const openCreate = (event: WhatsappTemplateEvent) => {
    setEditing(null);
    setForm({ ...getEmptyForm(), event });
    setIsEditOpen(true);
  };

  const openEdit = (t: WhatsappTemplate) => {
    setEditing(t);
    setForm({
      event: t.event as WhatsappTemplateEvent,
      name: t.name,
      message: t.message ?? "",
      is_active: t.is_active,
    });
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!selectedStore) return;
    if (!form.name.trim() || !form.message.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(
          `/stores/${selectedStore.id}/whatsapp/templates/${editing.id}`,
          form
        );
        toast.success("Template atualizado!");
      } else {
        await api.post(
          `/stores/${selectedStore.id}/whatsapp/templates`,
          form
        );
        toast.success("Template criado!");
      }
      setIsEditOpen(false);
      fetchTemplates();
    } catch {
      toast.error("Erro ao salvar template.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: WhatsappTemplate) => {
    if (!selectedStore) return;
    if (!confirm("Remover este template?")) return; // eslint-disable-line no-alert
    try {
      await api.delete(
        `/stores/${selectedStore.id}/whatsapp/templates/${t.id}`
      );
      toast.success("Template removido.");
      fetchTemplates();
    } catch {
      toast.error("Erro ao remover template.");
    }
  };

  const handleToggleActive = async (t: WhatsappTemplate) => {
    if (!selectedStore) return;
    try {
      await api.put(
        `/stores/${selectedStore.id}/whatsapp/templates/${t.id}`,
        { is_active: !t.is_active }
      );
      setTemplates((prev) =>
        prev.map((x) =>
          x.id === t.id ? { ...x, is_active: !t.is_active } : x
        )
      );
    } catch {
      toast.error("Erro ao alterar template.");
    }
  };

  const templatesByEvent = useCallback(
    (event: WhatsappTemplateEvent) =>
      templates.filter((t) => t.event === event),
    [templates]
  );

  return (
    <div className="mt-4 space-y-8">
      <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Fluxo de pagamentos</CardTitle>
          <p className="text-xs text-muted-foreground">
            Acontecem durante o checkout conforme o status do pagamento.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : (
            <>
              <EventPills
                events={PAYMENT_EVENTS}
                active={paymentActive}
                onSelect={setPaymentActive}
              />
              <EventList
                event={paymentActive}
                items={templatesByEvent(paymentActive)}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                onCreate={openCreate}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recuperação</CardTitle>
          <p className="text-xs text-muted-foreground">
            Disparadas automaticamente para resgatar clientes que saíram do
            checkout.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : (
            <>
              <EventPills
                events={RECOVERY_EVENTS}
                active={recoveryActive}
                onSelect={setRecoveryActive}
              />
              <EventList
                event={recoveryActive}
                items={templatesByEvent(recoveryActive)}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                onCreate={openCreate}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog criar/editar template */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar template" : "Novo template"}
            </DialogTitle>
            <DialogDescription>
              {WHATSAPP_EVENT_LABEL[form.event]} — {WHATSAPP_EVENT_DESCRIPTION[form.event]}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tpl-name">Nome do template</Label>
              <Input
                id="tpl-name"
                placeholder="Ex: Pagamento pendente"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="tpl-message">Mensagem</Label>
                <span className="text-xs text-muted-foreground">
                  Use variáveis entre chaves
                </span>
              </div>
              <Textarea
                id="tpl-message"
                rows={7}
                placeholder={`*Pagamento Pendente*\nOlá {{nome}}! Identificamos que seu pagamento Pix de {{valor}} está pendente...`}
                value={form.message}
                onChange={(e) =>
                  setForm((f) => ({ ...f, message: e.target.value }))
                }
                className="resize-none"
              />
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_VARS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, message: f.message + " " + v }))
                    }
                    className="rounded-md border border-border/50 bg-secondary/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-secondary"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
              <div>
                <Label className="text-sm">Template ativo</Label>
                <p className="text-xs text-muted-foreground">
                  Templates inativos não disparam mensagens.
                </p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, is_active: v }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.message.trim()}
            >
              {saving ? "Salvando..." : editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EventPills({
  events,
  active,
  onSelect,
}: {
  events: WhatsappTemplateEvent[];
  active: WhatsappTemplateEvent;
  onSelect: (e: WhatsappTemplateEvent) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {events.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onSelect(e)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            active === e
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
          }`}
        >
          {WHATSAPP_EVENT_LABEL[e]}
        </button>
      ))}
    </div>
  );
}

function EventList({
  event,
  items,
  onEdit,
  onDelete,
  onToggleActive,
  onCreate,
}: {
  event: WhatsappTemplateEvent;
  items: WhatsappTemplate[];
  onEdit: (t: WhatsappTemplate) => void;
  onDelete: (t: WhatsappTemplate) => void;
  onToggleActive: (t: WhatsappTemplate) => void;
  onCreate: (event: WhatsappTemplateEvent) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 rounded-lg border border-border/40 bg-secondary/20 p-3">
        <div>
          <p className="text-sm font-semibold">
            {WHATSAPP_EVENT_LABEL[event]}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {WHATSAPP_EVENT_DESCRIPTION[event]}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => onCreate(event)}>
          <Plus className="h-4 w-4" /> Novo
        </Button>
      </div>

      {items.length > 0 ? (
        items.map((t) => (
          <div
            key={t.id}
            className="rounded-lg border border-border/40 bg-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold truncate">{t.name}</h4>
                  {t.is_active ? (
                    <Badge variant="success" className="text-[9px] h-4 px-1.5">
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                      Inativo
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4">
                  {t.message}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Switch
                  checked={t.is_active}
                  onCheckedChange={() => onToggleActive(t)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(t)}
                  title="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => onDelete(t)}
                  title="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-lg border border-dashed border-border/40 p-6 text-center">
          <p className="text-xs text-muted-foreground">
            Nenhum template para este evento ainda.
          </p>
        </div>
      )}
    </div>
  );
}

function getEmptyForm(): WhatsappTemplateFormData {
  return {
    event: "payment_pending",
    name: "",
    message: "",
    is_active: true,
  };
}

/* ════════════════════════════ LOGS TAB (FALHAS) ════════════════════════════ */

function LogsTab() {
  const { selectedStore } = useStore();
  const [logs, setLogs] = useState<WhatsappLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"failed" | "sent" | "all">(
    "failed"
  );
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    if (!selectedStore) return;
    setLoading(true);
    try {
      const data = await api.get<Paginated<WhatsappLog>>(
        `/stores/${selectedStore.id}/whatsapp/logs?status=${statusFilter}&page=${page}`
      );
      setLogs(data.data);
      setLastPage(data.last_page);
    } catch {
      toast.error("Erro ao carregar logs.");
    } finally {
      setLoading(false);
    }
  }, [selectedStore, statusFilter, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const setFilter = (f: "failed" | "sent" | "all") => {
    setStatusFilter(f);
    setPage(1);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Entregas e falhas</h2>
          <p className="text-xs text-muted-foreground">
            Log de todas as tentativas de envio do WhatsApp. Falhas ajudam a
            diagnosticar conexão e números.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border/40 p-1">
          {(
            [
              { v: "failed", l: "Falhas" },
              { v: "sent", l: "Enviadas" },
              { v: "all", l: "Todas" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setFilter(opt.v)}
              className={`rounded-sm px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === opt.v
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : logs.length > 0 ? (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded-lg border border-border/40 bg-card p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {log.status === "sent" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {log.template?.name ??
                          WHATSAPP_EVENT_LABEL[log.event ?? ""] ??
                          log.event ??
                          "—"}
                      </span>
                      <Badge
                        variant={log.status === "sent" ? "success" : "destructive"}
                        className="text-[9px] h-4 px-1.5"
                      >
                        {log.status === "sent" ? "Enviada" : "Falhou"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {log.phone ?? "sem número"}
                      {log.instance?.instance_name
                        ? ` · ${log.instance.instance_name}`
                        : ""}
                      {" · "}
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
                {log.message}
              </p>
              {log.error && (
                <p className="mt-1.5 text-xs text-destructive/90">
                  <AlertCircle className="inline h-3 w-3 mr-1" />
                  {log.error}
                </p>
              )}
            </div>
          ))}

          {lastPage > 1 && (
            <div className="flex items-center justify-between pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Anterior
              </Button>
              <span className="text-xs text-muted-foreground">
                Página {page} de {lastPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={page >= lastPage}
              >
                Próxima
              </Button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={Check}
          title="Nenhuma entrega registrada"
          description={
            statusFilter === "failed"
              ? "Nenhuma falha de envio até agora."
              : "Ainda não há registros de envio de WhatsApp."
          }
        />
      )}
    </div>
  );
}