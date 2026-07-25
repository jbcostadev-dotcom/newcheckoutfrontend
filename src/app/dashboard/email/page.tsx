"use client";

import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/contexts/StoreContext";
import { api, ApiError } from "@/lib/api";
import type {
  SmtpSetting,
  SmtpSettingFormData,
  SmtpEncryption,
  EmailTemplate,
  EmailTemplateEvent,
  EmailTemplateFormData,
  EmailLog,
  Paginated,
} from "@/types";
import { EMAIL_EVENT_LABEL, EMAIL_EVENT_DESCRIPTION } from "@/types";
import {
  Mail, Plus, RefreshCw, Trash2, Pencil, Check, Eye, Code,
  AlertCircle, CheckCircle2, XCircle, ArrowLeft, Send, Server, Lock,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const PAYMENT_EVENTS: EmailTemplateEvent[] = [
  "payment_pending",
  "payment_approved",
  "payment_refused",
];

const RECOVERY_EVENTS: EmailTemplateEvent[] = [
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
  "{{pix_copia_cola}}",
  "{{boleto_url}}",
  "{{boleto_linha}}",
];

const PREVIEW_SAMPLE: Record<string, string> = {
  nome: "Maria",
  email: "maria@email.com",
  telefone: "(11) 99999-0000",
  valor: "R$ 197,00",
  metodo: "Pix",
  pedido: "1024",
  produtos: "Curso Completo x1\nMentoria x1",
  link: "https://minhaloja.com/checkout/abc123",
  pix_copia_cola: "00020126580014br.gov.bcb.pix...",
  boleto_url: "https://pagamento.com/boleto/123",
  boleto_linha: "23793.38128 60007.827136 95000.063305 9 11240000019700",
};

function renderPreview(html: string): string {
  return html.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (m, key) => {
    const value = PREVIEW_SAMPLE[String(key).toLowerCase()];
    return value !== undefined ? value.replace(/\n/g, "<br/>") : m;
  });
}

export default function EmailPage() {
  return (
    <>
      <PageHeader
        title="E-mail"
        description="Conecte o servidor SMTP da sua loja, personalize os templates em HTML e acompanhe as entregas."
        actions={null}
      />

      <div className="mt-6">
        <Tabs defaultValue="provider" className="w-full">
          <TabsList>
            <TabsTrigger value="provider" className="gap-1.5">
              <Mail className="h-4 w-4" /> Provedor
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-1.5">
              <Pencil className="h-4 w-4" /> Templates
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-1.5">
              <AlertCircle className="h-4 w-4" /> Falhas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="provider">
            <ProviderTab />
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

/* ════════════════════════════ PROVIDER TAB (SMTP) ════════════════════════════ */

function getEmptySmtpForm(): SmtpSettingFormData {
  return {
    name: "",
    host: "",
    port: "587",
    username: "",
    password: "",
    encryption: "tls",
    from_email: "",
    from_name: "",
    is_active: true,
  };
}

function ProviderTab() {
  const { selectedStore } = useStore();
  const [setting, setSetting] = useState<SmtpSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "form">("list");

  const [form, setForm] = useState<SmtpSettingFormData>(getEmptySmtpForm());
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const fetchSetting = useCallback(async () => {
    if (!selectedStore) return;
    setLoading(true);
    try {
      const data = await api.get<SmtpSetting | null>(
        `/stores/${selectedStore.id}/email/smtp`
      );
      setSetting(data);
    } catch {
      toast.error("Erro ao carregar configuração SMTP.");
    } finally {
      setLoading(false);
    }
  }, [selectedStore]);

  useEffect(() => {
    fetchSetting();
  }, [fetchSetting]);

  const openForm = () => {
    if (setting) {
      setForm({
        name: setting.name ?? "",
        host: setting.host ?? "",
        port: String(setting.port ?? "587"),
        username: setting.username ?? "",
        password: "",
        encryption: (setting.encryption as SmtpEncryption) || "tls",
        from_email: setting.from_email ?? "",
        from_name: setting.from_name ?? "",
        is_active: setting.is_active,
      });
    } else {
      setForm(getEmptySmtpForm());
    }
    setShowPassword(false);
    setView("form");
  };

  const handleTest = async () => {
    if (!selectedStore) return;
    setTesting(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>(
        `/stores/${selectedStore.id}/email/smtp/test`,
        {
          host: form.host,
          port: Number(form.port),
          username: form.username,
          password: form.password || undefined,
          encryption: form.encryption,
        }
      );
      toast.success(res.message || "Conexão estabelecida com sucesso!");
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Falha ao testar conexão.";
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!selectedStore) return;
    setSaving(true);
    try {
      const data = await api.put<SmtpSetting>(
        `/stores/${selectedStore.id}/email/smtp`,
        {
          name: form.name,
          host: form.host,
          port: Number(form.port),
          username: form.username,
          password: form.password || undefined,
          encryption: form.encryption,
          from_email: form.from_email || form.username,
          from_name: form.from_name || form.name,
          is_active: form.is_active,
        }
      );
      setSetting({ ...data, has_password: true });
      toast.success("Configuração SMTP salva!");
      setView("list");
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Erro ao salvar configuração.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStore) return;
    if (!confirm("Remover a configuração SMTP desta loja? Os e-mails deixarão de ser enviados.")) return; // eslint-disable-line no-alert
    try {
      await api.delete(`/stores/${selectedStore.id}/email/smtp`);
      setSetting(null);
      toast.success("Configuração removida.");
      setView("list");
    } catch {
      toast.error("Erro ao remover configuração.");
    }
  };

  if (loading) {
    return (
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  /* ── Formulário de configuração ── */
  if (view === "form") {
    return (
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setView("list")}
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar para provedores
        </button>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">SMTP</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Preencha os dados abaixo para conectar o servidor aos envios
                    da sua loja.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-name">Nome da conta deseja conectar</Label>
                <Input
                  id="smtp-name"
                  placeholder="Ex: Conta do João, BM e etc"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  autoFocus
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    placeholder="smtp.hostinger.com"
                    value={form.host}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, host: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    placeholder="587"
                    value={form.port}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, port: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp-username">Usuário (e-mail)</Label>
                <Input
                  id="smtp-username"
                  type="email"
                  placeholder="seu@email.com"
                  value={form.username}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, username: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp-password">Senha</Label>
                <div className="relative">
                  <Input
                    id="smtp-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={
                      setting?.has_password
                        ? "Deixe em branco para manter a atual"
                        : "senha"
                    }
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Criptografia (conexão segura)</Label>
                <Select
                  value={form.encryption}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      encryption: v as SmtpEncryption,
                      port:
                        v === "ssl"
                          ? "465"
                          : v === "tls"
                            ? "587"
                            : f.port,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tls">TLS (STARTTLS · porta 587)</SelectItem>
                    <SelectItem value="ssl">SSL (porta 465)</SelectItem>
                    <SelectItem value="none">Nenhuma</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtp-from-email">E-mail do remetente</Label>
                  <Input
                    id="smtp-from-email"
                    type="email"
                    placeholder={form.username || "seu@email.com"}
                    value={form.from_email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, from_email: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-from-name">Nome do remetente</Label>
                  <Input
                    id="smtp-from-name"
                    placeholder={form.name || "Minha Loja"}
                    value={form.from_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, from_name: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                <div>
                  <Label className="text-sm">Envio ativo</Label>
                  <p className="text-xs text-muted-foreground">
                    Quando inativo, nenhum e-mail é disparado.
                  </p>
                </div>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, is_active: v }))
                  }
                />
              </div>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleTest}
                  disabled={
                    testing ||
                    !form.host.trim() ||
                    !form.port.trim() ||
                    !form.username.trim() ||
                    (!form.password && !setting?.has_password)
                  }
                >
                  {testing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {testing ? "Testando..." : "Testar Conexão"}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={
                    saving ||
                    !form.name.trim() ||
                    !form.host.trim() ||
                    !form.port.trim() ||
                    !form.username.trim() ||
                    (!form.password && !setting?.has_password)
                  }
                >
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </div>

              {setting && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remover configuração
                </Button>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Sobre</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Conecte o servidor SMTP do seu provedor de e-mail (Hostinger,
                  Google Workspace, Amazon SES etc). Apenas uma configuração
                  ativa por loja.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Precisa de ajuda?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tem dúvidas? Fale com o suporte pelo chat no canto da tela.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  /* ── Lista de provedores ── */
  return (
    <div className="mt-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Provedores de e-mail</h2>
        <p className="text-xs text-muted-foreground">
          Escolha um provedor integrado à plataforma. Apenas uma configuração
          ativa por vez.
        </p>
      </div>

      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        SMTP customizado
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col rounded-xl border border-border/40 bg-card overflow-hidden transition-all hover:border-border/80 hover:shadow-md">
          <div className="flex-1 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              {setting ? (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${
                    setting.is_active
                      ? "bg-emerald-500/15 text-emerald-500"
                      : "bg-zinc-500/15 text-muted-foreground"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      setting.is_active ? "bg-emerald-500" : "bg-zinc-400"
                    }`}
                  />
                  {setting.is_active ? "Conectado" : "Inativo"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold bg-zinc-500/15 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                  Não configurado
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold leading-tight">SMTP</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Servidor SMTP próprio (host, porta e credenciais). Controle total
              sobre o envio.
            </p>
            {setting && (
              <div className="mt-3 space-y-0.5 text-xs text-muted-foreground">
                <p className="truncate font-medium text-foreground">
                  {setting.name || setting.username}
                </p>
                <p className="truncate">
                  <Server className="mr-1 inline h-3 w-3" />
                  {setting.host}:{setting.port}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-border/40 p-3">
            <Button
              variant={setting ? "outline" : "default"}
              size="sm"
              className="w-full h-9 text-xs"
              onClick={openForm}
            >
              {setting ? "Editar configuração" : "Configurar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════ TEMPLATES TAB ════════════════════════════ */

const DEFAULT_HTML = `<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="margin: 0 0 12px;">Olá, {{nome}}!</h2>
  <p style="color: #555; line-height: 1.6;">
    Escreva aqui a mensagem do seu e-mail.
  </p>
  <p style="color: #555; line-height: 1.6;">
    Pedido: <strong>#{{pedido}}</strong><br/>
    Valor: <strong>{{valor}}</strong>
  </p>
  <a href="{{link}}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #6c5ce7; color: #fff; text-decoration: none; border-radius: 8px;">
    Finalizar compra
  </a>
</div>`;

function TemplatesTab() {
  const { selectedStore } = useStore();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentActive, setPaymentActive] = useState<EmailTemplateEvent>(
    "payment_pending"
  );
  const [recoveryActive, setRecoveryActive] = useState<EmailTemplateEvent>(
    "pix_unpaid"
  );

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState<EmailTemplateFormData>(getEmptyForm());
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const fetchTemplates = useCallback(async () => {
    if (!selectedStore) return;
    setLoading(true);
    try {
      const data = await api.get<EmailTemplate[]>(
        `/stores/${selectedStore.id}/email/templates`
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

  const openCreate = (event: EmailTemplateEvent) => {
    setEditing(null);
    setForm({
      ...getEmptyForm(),
      event,
      name: EMAIL_EVENT_LABEL[event],
      subject: `${EMAIL_EVENT_LABEL[event]} — ${selectedStore?.name ?? "Loja"}`,
      body_html: DEFAULT_HTML,
    });
    setPreviewMode(false);
    setIsEditOpen(true);
  };

  const openEdit = (t: EmailTemplate) => {
    setEditing(t);
    setForm({
      event: t.event as EmailTemplateEvent,
      name: t.name,
      subject: t.subject ?? "",
      body_html: t.body_html ?? "",
      is_active: t.is_active,
    });
    setPreviewMode(false);
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!selectedStore) return;
    if (!form.name.trim() || !form.subject.trim() || !form.body_html.trim())
      return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(
          `/stores/${selectedStore.id}/email/templates/${editing.id}`,
          form
        );
        toast.success("Template atualizado!");
      } else {
        await api.post(`/stores/${selectedStore.id}/email/templates`, form);
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

  const handleDelete = async (t: EmailTemplate) => {
    if (!selectedStore) return;
    if (!confirm("Remover este template?")) return; // eslint-disable-line no-alert
    try {
      await api.delete(
        `/stores/${selectedStore.id}/email/templates/${t.id}`
      );
      toast.success("Template removido.");
      fetchTemplates();
    } catch {
      toast.error("Erro ao remover template.");
    }
  };

  const handleToggleActive = async (t: EmailTemplate) => {
    if (!selectedStore) return;
    try {
      await api.put(
        `/stores/${selectedStore.id}/email/templates/${t.id}`,
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
    (event: EmailTemplateEvent) => templates.filter((t) => t.event === event),
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar template" : "Novo template"}
            </DialogTitle>
            <DialogDescription>
              {EMAIL_EVENT_LABEL[form.event]} —{" "}
              {EMAIL_EVENT_DESCRIPTION[form.event]}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
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
                <Label htmlFor="tpl-subject">Assunto do e-mail</Label>
                <Input
                  id="tpl-subject"
                  placeholder="Ex: Seu pagamento está pendente"
                  value={form.subject}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subject: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="tpl-body">Conteúdo (HTML)</Label>
                <div className="flex items-center gap-1 rounded-md border border-border/40 p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewMode(false)}
                    className={`inline-flex items-center gap-1 rounded-sm px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      !previewMode
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Code className="h-3 w-3" /> Código
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode(true)}
                    className={`inline-flex items-center gap-1 rounded-sm px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      previewMode
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Eye className="h-3 w-3" /> Pré-visualizar
                  </button>
                </div>
              </div>

              {previewMode ? (
                <div className="overflow-hidden rounded-lg border border-border/50 bg-white">
                  <iframe
                    title="Pré-visualização do e-mail"
                    sandbox=""
                    srcDoc={renderPreview(form.body_html)}
                    className="h-[380px] w-full"
                  />
                </div>
              ) : (
                <Textarea
                  id="tpl-body"
                  rows={14}
                  placeholder={DEFAULT_HTML}
                  value={form.body_html}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, body_html: e.target.value }))
                  }
                  className="resize-y font-mono text-xs leading-relaxed"
                />
              )}

              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_VARS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, body_html: f.body_html + v }))
                    }
                    className="rounded-md border border-border/50 bg-secondary/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-secondary"
                  >
                    {v}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                A pré-visualização usa dados de exemplo. As variáveis são
                substituídas pelos dados reais do pedido no envio.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
              <div>
                <Label className="text-sm">Template ativo</Label>
                <p className="text-xs text-muted-foreground">
                  Templates inativos não disparam e-mails.
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
              disabled={
                saving ||
                !form.name.trim() ||
                !form.subject.trim() ||
                !form.body_html.trim()
              }
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
  events: EmailTemplateEvent[];
  active: EmailTemplateEvent;
  onSelect: (e: EmailTemplateEvent) => void;
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
          {EMAIL_EVENT_LABEL[e]}
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
  event: EmailTemplateEvent;
  items: EmailTemplate[];
  onEdit: (t: EmailTemplate) => void;
  onDelete: (t: EmailTemplate) => void;
  onToggleActive: (t: EmailTemplate) => void;
  onCreate: (event: EmailTemplateEvent) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 rounded-lg border border-border/40 bg-secondary/20 p-3">
        <div>
          <p className="text-sm font-semibold">{EMAIL_EVENT_LABEL[event]}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {EMAIL_EVENT_DESCRIPTION[event]}
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
                    <Badge
                      variant="secondary"
                      className="text-[9px] h-4 px-1.5"
                    >
                      Inativo
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground truncate">
                  Assunto: {t.subject}
                </p>
                <p className="mt-1.5 text-[11px] text-muted-foreground/70 line-clamp-2 font-mono">
                  {t.body_html}
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

function getEmptyForm(): EmailTemplateFormData {
  return {
    event: "payment_pending",
    name: "",
    subject: "",
    body_html: "",
    is_active: true,
  };
}

/* ════════════════════════════ LOGS TAB (FALHAS) ════════════════════════════ */

function LogsTab() {
  const { selectedStore } = useStore();
  const [logs, setLogs] = useState<EmailLog[]>([]);
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
      const data = await api.get<Paginated<EmailLog>>(
        `/stores/${selectedStore.id}/email/logs?status=${statusFilter}&page=${page}`
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
            Log de todas as tentativas de envio de e-mail. Falhas ajudam a
            diagnosticar credenciais e conexão SMTP.
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
                          EMAIL_EVENT_LABEL[log.event ?? ""] ??
                          log.event ??
                          "—"}
                      </span>
                      <Badge
                        variant={
                          log.status === "sent" ? "success" : "destructive"
                        }
                        className="text-[9px] h-4 px-1.5"
                      >
                        {log.status === "sent" ? "Enviado" : "Falhou"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {log.email ?? "sem destinatário"}
                      {log.smtp_setting?.host
                        ? ` · ${log.smtp_setting.host}`
                        : ""}
                      {" · "}
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              </div>
              {log.subject && (
                <p className="mt-2 text-xs font-medium text-foreground/90">
                  Assunto: {log.subject}
                </p>
              )}
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
              : "Ainda não há registros de envio de e-mail."
          }
        />
      )}
    </div>
  );
}
