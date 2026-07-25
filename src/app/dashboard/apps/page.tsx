"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import {
  Package,
  Truck,
  BarChart3,
  DollarSign,
  MessageCircle,
  Megaphone,
  Settings2,
  Save,
  X,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AppCategory =
  | "logistica"
  | "tracking"
  | "gestao_financeira"
  | "atendimento_recuperacao"
  | "pixels";

type AppId =
  // Logística
  | "melhor_envio"
  | "superfrete"
  // Tracking
  | "utmify"
  | "otimizy"
  | "wetracked"
  // Gestão Financeira
  | "bling"
  // Atendimento e recuperação
  | "reportana"
  | "klaviyo"
  | "active_campaign"
  | "sak"
  | "whatsapp_automacao"
  | "convertx"
  | "voxuy"
  | "integra_flux"
  // Pixels
  | "google_ads"
  | "google_analytics"
  | "google_tag_manager"
  | "kwai_pixel"
  | "taboola_pixel"
  | "meta_pixel"
  | "tiktok_pixel";

interface AppField {
  key: string;
  label: string;
  type?: "text" | "password" | "number";
  placeholder?: string;
  helper?: string;
}

interface AppDefinition {
  id: AppId;
  name: string;
  description: string;
  category: AppCategory;
  color: string;
  bgColor: string;
  textColor?: string;
  docsUrl?: string;
  fields: AppField[];
}

const CATEGORY_LABELS: Record<AppCategory, string> = {
  logistica: "Logística",
  tracking: "Tracking",
  gestao_financeira: "Gestão Financeira",
  atendimento_recuperacao: "Atendimento e recuperação",
  pixels: "Pixels",
};

const CATEGORY_ICONS: Record<AppCategory, React.ComponentType<{ className?: string }>> = {
  logistica: Truck,
  tracking: BarChart3,
  gestao_financeira: DollarSign,
  atendimento_recuperacao: MessageCircle,
  pixels: Megaphone,
};

const APPS: AppDefinition[] = [
  // ── Logística ────────────────────────────────────────────────
  {
    id: "melhor_envio",
    name: "Melhor Envio",
    description: "Intermediador de fretes para calcular, comparar e enviar pedidos.",
    category: "logistica",
    color: "#F59E0B",
    bgColor: "#FEF3C7",
    fields: [{ key: "token", label: "Token de acesso", type: "password" }],
  },
  {
    id: "superfrete",
    name: "SuperFrete",
    description: "Cálculo, etiqueta e rastreamento de fretes em um só lugar.",
    category: "logistica",
    color: "#10B981",
    bgColor: "#D1FAE5",
    fields: [{ key: "token", label: "Token de acesso", type: "password" }],
  },

  // ── Tracking ─────────────────────────────────────────────────
  {
    id: "utmify",
    name: "Utmify",
    description: "Poderoso gerenciador de utms e rastreamento de vendas.",
    category: "tracking",
    color: "#7C3AED",
    bgColor: "#EDE9FE",
    docsUrl: "https://utmify.com.br",
    fields: [
      { key: "token", label: "Token da API", type: "password" },
      { key: "pixel_id", label: "Pixel ID (opcional)", placeholder: "ID do pixel/acompanhamento" },
    ],
  },
  {
    id: "otimizy",
    name: "Otimizy",
    description: "A única plataforma de Tracking que você precisa.",
    category: "tracking",
    color: "#2563EB",
    bgColor: "#DBEAFE",
    fields: [{ key: "token", label: "Token de acesso", type: "password" }],
  },
  {
    id: "wetracked",
    name: "Wetracked",
    description: "Plataforma de rastreamento e otimização de campanhas.",
    category: "tracking",
    color: "#0EA5E9",
    bgColor: "#E0F2FE",
    fields: [{ key: "token", label: "Token de acesso", type: "password" }],
  },

  // ── Gestão Financeira ────────────────────────────────────────
  {
    id: "bling",
    name: "Bling",
    description: "Gestão inteligente para vendas online e offline.",
    category: "gestao_financeira",
    color: "#22C55E",
    bgColor: "#DCFCE7",
    fields: [
      { key: "api_key", label: "API Key", type: "password" },
      { key: "api_secret", label: "API Secret", type: "password" },
    ],
  },

  // ── Atendimento e recuperação ────────────────────────────────
  {
    id: "reportana",
    name: "Reportana",
    description: "Maximize suas métricas. Tracking e relatórios avançados.",
    category: "atendimento_recuperacao",
    color: "#2563EB",
    bgColor: "#DBEAFE",
    fields: [{ key: "token", label: "Token de acesso", type: "password" }],
  },
  {
    id: "klaviyo",
    name: "Klaviyo",
    description: "Plataforma de automação de e-mail marketing e SMS.",
    category: "atendimento_recuperacao",
    color: "#111827",
    bgColor: "#F3F4F6",
    fields: [
      { key: "public_api_key", label: "Public API Key", placeholder: "Sua Public API Key" },
      { key: "private_api_key", label: "Private API Key", type: "password" },
    ],
  },
  {
    id: "active_campaign",
    name: "ActiveCampaign",
    description: "Plataforma de automação de marketing e CRM.",
    category: "atendimento_recuperacao",
    color: "#2563EB",
    bgColor: "#DBEAFE",
    fields: [
      { key: "url", label: "URL da conta", placeholder: "https://suaempresa.activehosted.com" },
      { key: "api_key", label: "API Key", type: "password" },
    ],
  },
  {
    id: "sak",
    name: "Sak",
    description: "Recuperar carrinhos abandonados via WhatsApp e SMS.",
    category: "atendimento_recuperacao",
    color: "#22C55E",
    bgColor: "#DCFCE7",
    fields: [{ key: "token", label: "Token de acesso", type: "password" }],
  },
  {
    id: "whatsapp_automacao",
    name: "Whatsapp",
    description: "Configure templates de envio e automações no WhatsApp.",
    category: "atendimento_recuperacao",
    color: "#22C55E",
    bgColor: "#DCFCE7",
    fields: [
      { key: "instance_name", label: "Nome da instância" },
      { key: "api_key", label: "API Key", type: "password" },
    ],
  },
  {
    id: "convertx",
    name: "ConvertX",
    description: "Automações e Campanhas de recuperação de vendas.",
    category: "atendimento_recuperacao",
    color: "#111827",
    bgColor: "#F3F4F6",
    fields: [{ key: "token", label: "Token de acesso", type: "password" }],
  },
  {
    id: "voxuy",
    name: "Voxuy",
    description: "Automação de WhatsApp e atendimento em escala.",
    category: "atendimento_recuperacao",
    color: "#7C3AED",
    bgColor: "#EDE9FE",
    fields: [{ key: "token", label: "Token de acesso", type: "password" }],
  },
  {
    id: "integra_flux",
    name: "Integra Flux",
    description: "Recuperação de vendas e automações de pós-venda.",
    category: "atendimento_recuperacao",
    color: "#DC2626",
    bgColor: "#FEE2E2",
    fields: [{ key: "token", label: "Token de acesso", type: "password" }],
  },

  // ── Pixels ───────────────────────────────────────────────────
  {
    id: "google_ads",
    name: "Google Ads",
    description: "Integração nativa com pixel de conversão do Google Ads.",
    category: "pixels",
    color: "#F59E0B",
    bgColor: "#FEF3C7",
    fields: [
      { key: "conversion_id", label: "Conversion ID", placeholder: "AW-XXXXXXXXX" },
      { key: "conversion_label", label: "Conversion Label (opcional)" },
    ],
  },
  {
    id: "google_analytics",
    name: "Google Analytics",
    description: "Integração nativa com pixel do Google Analytics 4.",
    category: "pixels",
    color: "#F59E0B",
    bgColor: "#FEF3C7",
    fields: [
      { key: "measurement_id", label: "Measurement ID", placeholder: "G-XXXXXXXXXX", helper: "ID do stream de dados do GA4." },
    ],
  },
  {
    id: "google_tag_manager",
    name: "Google Tag Manager",
    description: "Utilize o Gerenciador de tags do Google no checkout.",
    category: "pixels",
    color: "#2563EB",
    bgColor: "#DBEAFE",
    fields: [
      { key: "container_id", label: "Container ID", placeholder: "GTM-XXXXXX", helper: "Começa sempre com GTM-." },
    ],
  },
  {
    id: "kwai_pixel",
    name: "Kwai Pixel",
    description: "Integração nativa com pixel do Kwai para Ads.",
    category: "pixels",
    color: "#F97316",
    bgColor: "#FFEDD5",
    fields: [{ key: "pixel_id", label: "Pixel ID" }],
  },
  {
    id: "taboola_pixel",
    name: "Taboola Pixel",
    description: "Integração nativa com pixel de conversão do Taboola.",
    category: "pixels",
    color: "#2563EB",
    bgColor: "#DBEAFE",
    fields: [{ key: "pixel_id", label: "Pixel ID" }],
  },
  {
    id: "meta_pixel",
    name: "Meta Pixel",
    description: "Integração nativa com pixel do Facebook e Instagram Ads.",
    category: "pixels",
    color: "#2563EB",
    bgColor: "#DBEAFE",
    fields: [
      { key: "pixel_id", label: "Pixel ID", placeholder: "123456789012345" },
      { key: "access_token", label: "Access Token (opcional)", type: "password", helper: "Necessário apenas para envio server-side." },
    ],
  },
  {
    id: "tiktok_pixel",
    name: "TikTok Pixel",
    description: "Integração nativa com pixel do TikTok Ads.",
    category: "pixels",
    color: "#111827",
    bgColor: "#F3F4F6",
    fields: [{ key: "pixel_id", label: "Pixel ID" }],
  },
];

interface AppConfig {
  enabled: boolean;
  values: Record<string, string>;
}

const DEFAULT_CONFIGS: Record<AppId, AppConfig> = Object.fromEntries(
  APPS.map((app) => [app.id, { enabled: false, values: {} }])
) as Record<AppId, AppConfig>;

function storageKey(storeId: string | undefined, appId: AppId) {
  if (!storeId) return null;
  return `checkout_apps_v2_${storeId}_${appId}`;
}

function AppLogo({ app }: { app: AppDefinition }) {
  const initials = app.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
      style={{
        backgroundColor: app.bgColor,
        color: app.textColor ?? app.color,
      }}
    >
      {initials}
    </div>
  );
}

export default function AppsPage() {
  const { selectedStore } = useStore();
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<Record<AppId, AppConfig>>(DEFAULT_CONFIGS);
  const [activeApp, setActiveApp] = useState<AppId | null>(null);
  const [saving, setSaving] = useState(false);

  const activeDefinition = useMemo(
    () => APPS.find((a) => a.id === activeApp) ?? null,
    [activeApp]
  );

  const appsByCategory = useMemo(() => {
    const grouped: Partial<Record<AppCategory, AppDefinition[]>> = {};
    APPS.forEach((app) => {
      if (!grouped[app.category]) grouped[app.category] = [];
      grouped[app.category]!.push(app);
    });
    return grouped;
  }, []);

  // Load persisted configs per store.
  useEffect(() => {
    if (!selectedStore) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const next: Record<AppId, AppConfig> = { ...DEFAULT_CONFIGS };
    APPS.forEach((app) => {
      const key = storageKey(selectedStore.id, app.id);
      if (!key) return;
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as AppConfig;
          next[app.id] = {
            enabled: parsed.enabled ?? false,
            values: parsed.values ?? {},
          };
        }
      } catch {
        /* ignore corrupt storage */
      }
    });
    setConfigs(next);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore]);

  const persistConfig = (appId: AppId, config: AppConfig) => {
    const key = storageKey(selectedStore?.id, appId);
    if (key) {
      localStorage.setItem(key, JSON.stringify(config));
    }
    setConfigs((prev) => ({ ...prev, [appId]: config }));
  };

  const handleToggle = (appId: AppId) => {
    const current = configs[appId];
    const next = { ...current, enabled: !current.enabled };
    persistConfig(appId, next);
    const appName = APPS.find((a) => a.id === appId)?.name ?? appId;
    toast.success(next.enabled ? `${appName} ativado.` : `${appName} desativado.`);
  };

  const handleSaveActive = () => {
    if (!activeApp || !activeDefinition) return;
    setSaving(true);
    // Simulate API call; in the future this should sync with the backend.
    setTimeout(() => {
      persistConfig(activeApp, configs[activeApp]);
      setSaving(false);
      setActiveApp(null);
      toast.success("Configurações salvas!");
    }, 400);
  };

  const updateValue = (appId: AppId, key: string, value: string) => {
    setConfigs((prev) => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        values: { ...prev[appId].values, [key]: value },
      },
    }));
  };

  const isConfigured = (appId: AppId) => {
    const cfg = configs[appId];
    const app = APPS.find((a) => a.id === appId);
    if (!app || !cfg) return false;
    return app.fields.some((f) => cfg.values[f.key]?.trim());
  };

  return (
    <>
      <PageHeader
        title="Apps"
        description="Conecte ferramentas externas de logística, tracking, atendimento, pixels e mais."
      />

      <div className="mt-6 space-y-8">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          (Object.keys(appsByCategory) as AppCategory[]).map((category) => {
            const CategoryIcon = CATEGORY_ICONS[category];
            return (
              <section key={category}>
                <div className="mb-3 flex items-center gap-2">
                  <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">
                    {CATEGORY_LABELS[category]}
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {appsByCategory[category]!.map((app) => {
                    const cfg = configs[app.id];
                    const configured = isConfigured(app.id);
                    const active = cfg?.enabled ?? false;

                    return (
                      <div
                        key={app.id}
                        onClick={() => setActiveApp(app.id)}
                        className="group relative flex cursor-pointer items-center justify-between rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="truncate text-sm font-semibold">
                              {app.name}
                            </span>
                            <Badge
                              variant="secondary"
                              className="h-5 px-1.5 text-[10px] font-medium hover:bg-secondary"
                            >
                              {active ? "Configurar" : "Instalar"}
                            </Badge>
                          </div>
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {app.description}
                          </p>
                        </div>
                        <AppLogo app={app} />

                        {active && (
                          <span className="absolute right-2 top-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* Configuration dialog */}
      <Dialog
        open={!!activeApp}
        onOpenChange={(open) => !open && setActiveApp(null)}
      >
        <DialogContent className="max-w-lg">
          {activeDefinition && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <AppLogo app={activeDefinition} />
                  <div>
                    <DialogTitle>{activeDefinition.name}</DialogTitle>
                    <DialogDescription>
                      {activeDefinition.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Ativar integração</p>
                    <p className="text-xs text-muted-foreground">
                      Habilita o app nesta loja.
                    </p>
                  </div>
                  <Switch
                    checked={configs[activeDefinition.id].enabled}
                    onCheckedChange={() => handleToggle(activeDefinition.id)}
                  />
                </div>

                <div className="space-y-4">
                  {activeDefinition.fields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label htmlFor={field.key}>{field.label}</Label>
                      <Input
                        id={field.key}
                        type={field.type ?? "text"}
                        placeholder={field.placeholder}
                        value={configs[activeDefinition.id].values[field.key] ?? ""}
                        onChange={(e) =>
                          updateValue(activeDefinition.id, field.key, e.target.value)
                        }
                        autoComplete="off"
                      />
                      {field.helper && (
                        <p className="text-xs text-muted-foreground">
                          {field.helper}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {activeDefinition.docsUrl && (
                  <a
                    href={activeDefinition.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Documentação oficial
                  </a>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setActiveApp(null)}
                  disabled={saving}
                >
                  <X className="mr-1.5 h-4 w-4" /> Cancelar
                </Button>
                <Button onClick={handleSaveActive} disabled={saving}>
                  {saving ? (
                    "Salvando..."
                  ) : (
                    <>
                      <Save className="mr-1.5 h-4 w-4" /> Salvar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
