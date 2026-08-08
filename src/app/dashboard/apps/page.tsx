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
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  type?: "text" | "password" | "number" | "select" | "checkbox";
  placeholder?: string;
  helper?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  section?: string;
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
    docsUrl: "https://docs.melhorenvio.com.br/docs/introducao-a-api",
    fields: [
      { key: "token", label: "Token de acesso", type: "password", required: true, section: "Credenciais" },
      {
        key: "remetente_nome",
        label: "Nome do Remetente",
        required: true,
        section: "Informações Básicas",
      },
      {
        key: "remetente_telefone",
        label: "Telefone do Remetente",
        required: true,
        placeholder: "(00) 00000-0000",
        section: "Informações Básicas",
      },
      {
        key: "remetente_email",
        label: "E-mail do Remetente",
        required: true,
        type: "text",
        placeholder: "exemplo@email.com",
        section: "Informações Básicas",
      },
      {
        key: "remetente_cpf",
        label: "CPF do Remetente",
        required: true,
        placeholder: "000.000.000-00",
        section: "Informações Básicas",
      },
      {
        key: "remetente_cnpj",
        label: "CNPJ",
        placeholder: "00.000.000/0000-00",
        section: "Informações Básicas",
      },
      {
        key: "remetente_ie",
        label: "Inscrição estadual",
        section: "Informações Básicas",
      },
      {
        key: "remetente_cep",
        label: "CEP do Remetente",
        required: true,
        placeholder: "00000-000",
        section: "Informações Básicas",
      },
      {
        key: "remetente_endereco",
        label: "Endereço do Remetente",
        required: true,
        section: "Informações Básicas",
      },
      {
        key: "remetente_numero",
        label: "Número do Remetente",
        required: true,
        section: "Informações Básicas",
      },
      {
        key: "remetente_complemento",
        label: "Complemento do Remetente",
        section: "Informações Básicas",
      },
      {
        key: "remetente_bairro",
        label: "Bairro do Remetente",
        required: true,
        section: "Informações Básicas",
      },
      {
        key: "remetente_cidade",
        label: "Cidade do Remetente",
        required: true,
        section: "Informações Básicas",
      },
      {
        key: "remetente_estado",
        label: "Estado do Remetente",
        required: true,
        placeholder: "UF",
        section: "Informações Básicas",
      },
      {
        key: "etiquetas_sem_nota",
        label: "Inserir etiquetas no carrinho, sem nota fiscal?",
        type: "select",
        required: true,
        section: "Opções de etiqueta",
        options: [
          { label: "Sim", value: "sim" },
          { label: "Não", value: "nao" },
        ],
      },
      {
        key: "nao_enviar_etiquetas",
        label: "Não enviar etiquetas",
        type: "checkbox",
        helper:
          "Faz somente a cotação de frete no checkout, sem gerar etiquetas automaticamente.",
        section: "Opções de etiqueta",
      },
      {
        key: "comprar_automatico",
        label: "Comprar automaticamente a etiqueta",
        type: "checkbox",
        helper:
          "Compra a etiqueta que chega no carrinho do Melhor Envio (se houver saldo na carteira).",
        section: "Opções de etiqueta",
      },
    ],
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
    docsUrl: "https://docs.utmify.com.br/envio-de-vendas",
    fields: [
      { key: "token", label: "Credencial de API (x-api-token)", type: "password", placeholder: "Cole aqui sua credencial de API da Utmify" },
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
    docsUrl: "https://support.google.com/google-ads/answer/6095821",
    fields: [],
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
    docsUrl: "https://docs.qingque.cn/d/home/eZQDaewub9hw8vS2dHfz5OKl-?identityId=1oE1i26WBWd",
    fields: [],
  },
  {
    id: "taboola_pixel",
    name: "Taboola Pixel",
    description: "Integração nativa com pixel de conversão do Taboola.",
    category: "pixels",
    color: "#2563EB",
    bgColor: "#DBEAFE",
    docsUrl: "https://developers.taboola.com/pixel/docs/pixel-overview",
    fields: [],
  },
  {
    id: "meta_pixel",
    name: "Meta Pixel",
    description: "Integração nativa com pixel do Facebook e Instagram Ads.",
    category: "pixels",
    color: "#2563EB",
    bgColor: "#DBEAFE",
    docsUrl: "https://www.facebook.com/business/help/AboutConversionsAPI",
    fields: [],
  },
  {
    id: "tiktok_pixel",
    name: "TikTok Pixel",
    description: "Integração nativa com pixel do TikTok Ads.",
    category: "pixels",
    color: "#111827",
    bgColor: "#F3F4F6",
    docsUrl: "https://ads.tiktok.com/help/article/events-api?lang=pt",
    fields: [],
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

  // Estado do Utmify, salvo no backend (não em localStorage como os demais apps).
  const [utmify, setUtmify] = useState({ enabled: false, hasToken: false, token: "" });
  const [utmifySaving, setUtmifySaving] = useState(false);

  // Estado do Melhor Envio, salvo no backend (credencial + dados do remetente).
  const [melhorEnvio, setMelhorEnvio] = useState<{
    enabled: boolean;
    hasToken: boolean;
    values: Record<string, string>;
    token: string;
  }>({ enabled: false, hasToken: false, values: {}, token: "" });
  const [melhorEnvioSaving, setMelhorEnvioSaving] = useState(false);

  // Estado do Google Ads, salvo no backend (pixel + flags de disparo + produtos).
  const [googleAds, setGoogleAds] = useState<{
    enabled: boolean;
    hasPixel: boolean;
    values: {
      pixel_name: string;
      pixel_id: string;
      conversion_label: string;
      only_paid_sales: boolean;
      only_selected_products: boolean;
      selected_product_ids: number[];
    };
  }>({
    enabled: false,
    hasPixel: false,
    values: {
      pixel_name: "",
      pixel_id: "",
      conversion_label: "",
      only_paid_sales: true,
      only_selected_products: false,
      selected_product_ids: [],
    },
  });
  const [googleAdsSaving, setGoogleAdsSaving] = useState(false);

  const [metaPixel, setMetaPixel] = useState({
    enabled: false,
    hasPixel: false,
    hasAccessToken: false,
    hasTestEventCode: false,
    values: {
      pixel_name: "",
      pixel_id: "",
      browser_enabled: true,
      capi_enabled: true,
      only_paid_sales: true,
      only_selected_products: false,
      selected_product_ids: [] as number[],
    },
    accessToken: "",
    testEventCode: "",
  });
  const [metaPixelSaving, setMetaPixelSaving] = useState(false);

  const [tiktokPixel, setTikTokPixel] = useState({
    enabled: false,
    hasPixel: false,
    hasAccessToken: false,
    hasTestEventCode: false,
    values: {
      pixel_name: "",
      pixel_code: "",
      browser_enabled: true,
      events_api_enabled: true,
      only_paid_sales: true,
      only_selected_products: false,
      selected_product_ids: [] as number[],
    },
    accessToken: "",
    testEventCode: "",
  });
  const [tiktokPixelSaving, setTikTokPixelSaving] = useState(false);

  const [kwaiPixel, setKwaiPixel] = useState({
    enabled: false,
    hasPixel: false,
    hasAccessToken: false,
    hasTestEventCode: false,
    eventsApiAvailable: false,
    values: {
      pixel_name: "",
      pixel_code: "",
      browser_enabled: true,
      events_api_enabled: false,
      only_paid_sales: true,
      only_selected_products: false,
      selected_product_ids: [] as number[],
    },
    accessToken: "",
    testEventCode: "",
  });
  const [kwaiPixelSaving, setKwaiPixelSaving] = useState(false);

  const [taboolaPixel, setTaboolaPixel] = useState({
    enabled: false,
    hasAccountId: false,
    hasPostbackUrl: false,
    values: {
      pixel_name: "",
      account_id: "",
      browser_enabled: true,
      s2s_enabled: true,
      only_paid_sales: true,
      only_selected_products: false,
      selected_product_ids: [] as number[],
      page_view_event_name: "page_view",
      view_content_event_name: "PRODUCT_VIEW",
      add_to_cart_event_name: "ADD_TO_CART",
      initiate_checkout_event_name: "CHECKOUT",
      add_payment_info_event_name: "ADD_PAYMENT_INFO",
      purchase_event_name: "PURCHASE",
    },
    postbackUrl: "",
  });
  const [taboolaPixelSaving, setTaboolaPixelSaving] = useState(false);

  // Produtos da loja — carregados sob demanda para o seletor do Google Ads.
  const [storeProducts, setStoreProducts] = useState<
    { id: number; name: string; parent_title?: string | null; image_url?: string | null; is_active: boolean }[]
  >([]);
  const [storeProductsLoading, setStoreProductsLoading] = useState(false);

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

  // Carrega o status da integração Utmify (sempre do backend).
  useEffect(() => {
    if (!selectedStore) return;
    api
      .get<{ enabled: boolean; has_token: boolean }>(`/stores/${selectedStore.id}/utmify`)
      .then((data) => {
        setUtmify((prev) => ({
          enabled: data.enabled ?? false,
          hasToken: data.has_token ?? false,
          // Mantém o token em edição se já digitado; senão vazio.
          token: prev.token && !data.has_token ? prev.token : "",
        }));
      })
      .catch(() => {
        /* ignore */
      });
  }, [selectedStore]);

  // Carrega o status e valores da integração Melhor Envio (sempre do backend).
  useEffect(() => {
    if (!selectedStore) return;
    api
      .get<{ enabled: boolean; has_token: boolean; values: Record<string, string> }>(
        `/stores/${selectedStore.id}/melhor-envio`
      )
      .then((data) => {
        setMelhorEnvio((prev) => ({
          enabled: data.enabled ?? false,
          hasToken: data.has_token ?? false,
          values: data.values ?? {},
          token: prev.token && !data.has_token ? prev.token : "",
        }));
      })
      .catch(() => {
        /* ignore */
      });
  }, [selectedStore]);

  // Carrega o status e valores da integração Google Ads (sempre do backend).
  useEffect(() => {
    if (!selectedStore) return;
    api
      .get<{
        enabled: boolean;
        has_pixel: boolean;
        values: {
          pixel_name: string;
          pixel_id: string;
          conversion_label: string;
          only_paid_sales: boolean;
          only_selected_products: boolean;
          selected_product_ids: number[];
        };
      }>(`/stores/${selectedStore.id}/google-ads`)
      .then((data) => {
        setGoogleAds({
          enabled: data.enabled ?? false,
          hasPixel: data.has_pixel ?? false,
          values: {
            pixel_name: data.values?.pixel_name ?? "",
            pixel_id: data.values?.pixel_id ?? "",
            conversion_label: data.values?.conversion_label ?? "",
            only_paid_sales: data.values?.only_paid_sales ?? true,
            only_selected_products: data.values?.only_selected_products ?? false,
            selected_product_ids: data.values?.selected_product_ids ?? [],
          },
        });
      })
      .catch(() => {
        /* ignore */
      });
  }, [selectedStore]);

  // Carrega os produtos da loja quando o dialog do Google Ads é aberto.
  useEffect(() => {
    if (!selectedStore || !["google_ads", "meta_pixel", "tiktok_pixel", "kwai_pixel", "taboola_pixel"].includes(activeApp ?? "")) return;
    let cancelled = false;
    (async () => {
      setStoreProductsLoading(true);
      try {
        const data = await api.get<
          { id: number; name: string; parent_title?: string | null; image_url?: string | null; is_active: boolean }[]
        >(`/stores/${selectedStore.id}/products`);
        if (!cancelled) setStoreProducts(data);
      } catch {
        if (!cancelled) setStoreProducts([]);
      } finally {
        if (!cancelled) setStoreProductsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedStore, activeApp]);

  // Carrega a configuração Taboola; a URL do postback nunca é exposta pelo backend.
  useEffect(() => {
    if (!selectedStore) return;
    api.get<{
      enabled: boolean;
      has_account_id: boolean;
      has_postback_url: boolean;
      values: typeof taboolaPixel.values;
    }>(`/stores/${selectedStore.id}/taboola-pixel`).then((data) => {
      setTaboolaPixel((prev) => ({
        ...prev,
        enabled: data.enabled ?? false,
        hasAccountId: data.has_account_id ?? false,
        hasPostbackUrl: data.has_postback_url ?? false,
        values: { ...prev.values, ...(data.values ?? {}), account_id: data.values?.account_id ?? "", selected_product_ids: data.values?.selected_product_ids ?? [] },
        postbackUrl: "",
      }));
    }).catch(() => { /* ignore */ });
  }, [selectedStore]);

  // Carrega o status da Meta (segredos nunca retornam da API).
  useEffect(() => {
    if (!selectedStore) return;
    api
      .get<{
        enabled: boolean;
        has_pixel: boolean;
        has_access_token: boolean;
        has_test_event_code: boolean;
        values: typeof metaPixel.values;
      }>(`/stores/${selectedStore.id}/meta-pixel`)
      .then((data) => {
        setMetaPixel((prev) => ({
          ...prev,
          enabled: data.enabled ?? false,
          hasPixel: data.has_pixel ?? false,
          hasAccessToken: data.has_access_token ?? false,
          hasTestEventCode: data.has_test_event_code ?? false,
          values: {
            ...prev.values,
            ...(data.values ?? {}),
            pixel_name: data.values?.pixel_name ?? "",
            pixel_id: data.values?.pixel_id ?? "",
            selected_product_ids: data.values?.selected_product_ids ?? [],
          },
          accessToken: "",
          testEventCode: "",
        }));
      })
      .catch(() => {
        /* ignore */
      });
  }, [selectedStore]);

  // Carrega o status do Kwai Pixel; tokens nunca retornam para o navegador.
  useEffect(() => {
    if (!selectedStore) return;
    api
      .get<{
        enabled: boolean;
        has_pixel: boolean;
        has_access_token: boolean;
        has_test_event_code: boolean;
        events_api_available?: boolean;
        values: typeof kwaiPixel.values;
      }>(`/stores/${selectedStore.id}/kwai-pixel`)
      .then((data) => {
        setKwaiPixel((prev) => ({
          ...prev,
          enabled: data.enabled ?? false,
          hasPixel: data.has_pixel ?? false,
          hasAccessToken: data.has_access_token ?? false,
          hasTestEventCode: data.has_test_event_code ?? false,
          eventsApiAvailable: data.events_api_available ?? false,
          values: {
            ...prev.values,
            ...(data.values ?? {}),
            pixel_name: data.values?.pixel_name ?? "",
            pixel_code: data.values?.pixel_code ?? "",
            selected_product_ids: data.values?.selected_product_ids ?? [],
          },
          accessToken: "",
          testEventCode: "",
        }));
      })
      .catch(() => {
        /* ignore */
      });
  }, [selectedStore]);

  // Carrega o status do TikTok Pixel e da Events API (segredos nunca retornam).
  useEffect(() => {
    if (!selectedStore) return;
    api
      .get<{
        enabled: boolean;
        has_pixel: boolean;
        has_access_token: boolean;
        has_test_event_code: boolean;
        values: typeof tiktokPixel.values;
      }>(`/stores/${selectedStore.id}/tiktok-pixel`)
      .then((data) => {
        setTikTokPixel((prev) => ({
          ...prev,
          enabled: data.enabled ?? false,
          hasPixel: data.has_pixel ?? false,
          hasAccessToken: data.has_access_token ?? false,
          hasTestEventCode: data.has_test_event_code ?? false,
          values: {
            ...prev.values,
            ...(data.values ?? {}),
            pixel_name: data.values?.pixel_name ?? "",
            pixel_code: data.values?.pixel_code ?? "",
            selected_product_ids: data.values?.selected_product_ids ?? [],
          },
          accessToken: "",
          testEventCode: "",
        }));
      })
      .catch(() => {
        /* ignore */
      });
  }, [selectedStore]);

  const persistConfig = (appId: AppId, config: AppConfig) => {
    const key = storageKey(selectedStore?.id, appId);
    if (key) {
      localStorage.setItem(key, JSON.stringify(config));
    }
    setConfigs((prev) => ({ ...prev, [appId]: config }));
  };

  const handleToggle = (appId: AppId) => {
    if (appId === "melhor_envio") {
      handleToggleMelhorEnvio();
      return;
    }
    if (appId === "google_ads") {
      handleToggleGoogleAds();
      return;
    }
    if (appId === "meta_pixel") {
      handleToggleMetaPixel();
      return;
    }
    if (appId === "tiktok_pixel") {
      handleToggleTikTokPixel();
      return;
    }
    if (appId === "kwai_pixel") {
      handleToggleKwaiPixel();
      return;
    }
    if (appId === "taboola_pixel") {
      handleToggleTaboolaPixel();
      return;
    }
    const current = configs[appId];
    const next = { ...current, enabled: !current.enabled };
    persistConfig(appId, next);
    const appName = APPS.find((a) => a.id === appId)?.name ?? appId;
    toast.success(next.enabled ? `${appName} ativado.` : `${appName} desativado.`);
  };

  const handleSaveActive = () => {
    if (!activeApp || !activeDefinition) return;
    // Utmify é salvo no backend (credencial de API sensível).
    if (activeApp === "utmify") {
      handleSaveUtmify();
      return;
    }
    // Melhor Envio é salvo no backend (token + dados do remetente).
    if (activeApp === "melhor_envio") {
      handleSaveMelhorEnvio();
      return;
    }
    // Google Ads é salvo no backend (pixel + flags de disparo).
    if (activeApp === "google_ads") {
      handleSaveGoogleAds();
      return;
    }
    if (activeApp === "meta_pixel") {
      handleSaveMetaPixel();
      return;
    }
    if (activeApp === "tiktok_pixel") {
      handleSaveTikTokPixel();
      return;
    }
    if (activeApp === "kwai_pixel") {
      handleSaveKwaiPixel();
      return;
    }
    if (activeApp === "taboola_pixel") {
      handleSaveTaboolaPixel();
      return;
    }
    // Valida campos obrigatórios (campos com `required: true`).
    const missing = getMissingRequired(activeApp);
    if (missing.length > 0) {
      toast.error(
        `Preencha os campos obrigatórios: ${missing.map((m) => m.label).join(", ")}`
      );
      return;
    }
    setSaving(true);
    // Simulate API call; in the future this should sync with the backend.
    setTimeout(() => {
      persistConfig(activeApp, configs[activeApp]);
      setSaving(false);
      setActiveApp(null);
      toast.success("Configurações salvas!");
    }, 400);
  };

  const handleSaveUtmify = async () => {
    if (!selectedStore) return;
    setUtmifySaving(true);
    try {
      const payload: Record<string, unknown> = { enabled: utmify.enabled };
      const token = utmify.token.trim();
      if (token) {
        payload.api_token = token;
      } else if (!utmify.hasToken) {
        toast.error("Cole a credencial de API da Utmify.");
        setUtmifySaving(false);
        return;
      }
      const data = await api.put<{ enabled: boolean; has_token: boolean }>(
        `/stores/${selectedStore.id}/utmify`,
        payload
      );
      setUtmify((prev) => ({
        enabled: data.enabled ?? prev.enabled,
        hasToken: data.has_token ?? prev.hasToken,
        token: "",
      }));
      toast.success("Credencial da Utmify salva!");
      setActiveApp(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar a credencial da Utmify.");
    } finally {
      setUtmifySaving(false);
    }
  };

  const handleToggleUtmify = async () => {
    if (!selectedStore) return;
    const nextEnabled = !utmify.enabled;
    setUtmify((prev) => ({ ...prev, enabled: nextEnabled }));
    try {
      const data = await api.put<{ enabled: boolean; has_token: boolean }>(
        `/stores/${selectedStore.id}/utmify`,
        { enabled: nextEnabled }
      );
      setUtmify((prev) => ({ ...prev, enabled: data.enabled ?? prev.enabled }));
      toast.success(nextEnabled ? "Utmify ativada." : "Utmify desativada.");
    } catch (err) {
      // Reverte em caso de erro.
      setUtmify((prev) => ({ ...prev, enabled: !nextEnabled }));
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar Utmify.");
    }
  };

  const handleSaveMelhorEnvio = async () => {
    if (!selectedStore) return;
    const missing = getMissingRequired("melhor_envio");
    if (missing.length > 0) {
      toast.error(
        `Preencha os campos obrigatórios: ${missing.map((m) => m.label).join(", ")}`
      );
      return;
    }

    const token = melhorEnvio.token.trim();
    if (!token && !melhorEnvio.hasToken) {
      toast.error("Cole o token de acesso do Melhor Envio.");
      return;
    }

    setMelhorEnvioSaving(true);
    try {
      const payload: Record<string, unknown> = {
        enabled: melhorEnvio.enabled,
        ...melhorEnvio.values,
      };
      if (token) {
        payload.api_token = token;
      }

      const data = await api.put<{
        enabled: boolean;
        has_token: boolean;
        values: Record<string, string>;
      }>(`/stores/${selectedStore.id}/melhor-envio`, payload);

      setMelhorEnvio((prev) => ({
        enabled: data.enabled ?? prev.enabled,
        hasToken: data.has_token ?? prev.hasToken,
        values: data.values ?? prev.values,
        token: "",
      }));
      toast.success("Configurações do Melhor Envio salvas!");
      setActiveApp(null);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Erro ao salvar as configurações do Melhor Envio."
      );
    } finally {
      setMelhorEnvioSaving(false);
    }
  };

  const handleToggleMelhorEnvio = async () => {
    if (!selectedStore) return;
    const nextEnabled = !melhorEnvio.enabled;
    setMelhorEnvio((prev) => ({ ...prev, enabled: nextEnabled }));
    try {
      const data = await api.put<{
        enabled: boolean;
        has_token: boolean;
        values: Record<string, string>;
      }>(`/stores/${selectedStore.id}/melhor-envio`, { enabled: nextEnabled });
      setMelhorEnvio((prev) => ({
        ...prev,
        enabled: data.enabled ?? prev.enabled,
      }));
      toast.success(nextEnabled ? "Melhor Envio ativado." : "Melhor Envio desativado.");
    } catch (err) {
      setMelhorEnvio((prev) => ({ ...prev, enabled: !nextEnabled }));
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar Melhor Envio."
      );
    }
  };

  const handleSaveGoogleAds = async () => {
    if (!selectedStore) return;
    const pixelId = googleAds.values.pixel_id.trim();
    // Se o pixel já existe e o usuário não redigitou, mantemos o atual.
    const keepCurrentPixel = pixelId === "" && googleAds.hasPixel;
    if (!keepCurrentPixel && !pixelId) {
      toast.error("Informe o ID do Pixel (ex.: AW-XXXXXXXXX).");
      return;
    }
    if (googleAds.values.only_selected_products && googleAds.values.selected_product_ids.length === 0) {
      toast.error("Selecione ao menos um produto para disparar o pixel.");
      return;
    }
    setGoogleAdsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        enabled: googleAds.enabled,
        pixel_name: googleAds.values.pixel_name,
        conversion_label: googleAds.values.conversion_label,
        only_paid_sales: googleAds.values.only_paid_sales,
        only_selected_products: googleAds.values.only_selected_products,
        selected_product_ids: googleAds.values.selected_product_ids,
      };
      if (!keepCurrentPixel) {
        payload.pixel_id = pixelId;
      }
      const data = await api.put<{
        enabled: boolean;
        has_pixel: boolean;
        values: typeof googleAds.values;
      }>(`/stores/${selectedStore.id}/google-ads`, payload);
      setGoogleAds((prev) => ({
        enabled: data.enabled ?? prev.enabled,
        hasPixel: data.has_pixel ?? prev.hasPixel,
        values: {
          ...(data.values ?? prev.values),
        },
      }));
      toast.success("Configurações do Google Ads salvas!");
      setActiveApp(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao salvar as configurações do Google Ads."
      );
    } finally {
      setGoogleAdsSaving(false);
    }
  };

  const handleToggleGoogleAds = async () => {
    if (!selectedStore) return;
    const nextEnabled = !googleAds.enabled;
    setGoogleAds((prev) => ({ ...prev, enabled: nextEnabled }));
    try {
      const data = await api.put<{
        enabled: boolean;
        has_pixel: boolean;
        values: typeof googleAds.values;
      }>(`/stores/${selectedStore.id}/google-ads`, { enabled: nextEnabled });
      setGoogleAds((prev) => ({
        ...prev,
        enabled: data.enabled ?? prev.enabled,
        hasPixel: data.has_pixel ?? prev.hasPixel,
        values: data.values ?? prev.values,
      }));
      toast.success(nextEnabled ? "Google Ads ativado." : "Google Ads desativado.");
    } catch (err) {
      setGoogleAds((prev) => ({ ...prev, enabled: !nextEnabled }));
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar Google Ads."
      );
    }
  };

  const updateValue = (appId: AppId, key: string, value: string) => {
    if (appId === "melhor_envio") {
      setMelhorEnvio((prev) => ({
        ...prev,
        values: { ...prev.values, [key]: value },
      }));
      return;
    }
    setConfigs((prev) => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        values: { ...prev[appId].values, [key]: value },
      },
    }));
  };

  const handleSaveMetaPixel = async () => {
    if (!selectedStore) return;
    const pixelId = metaPixel.values.pixel_id.trim();
    const keepCurrentPixel = pixelId === "" && metaPixel.hasPixel;
    if (!keepCurrentPixel && !/^\d+$/.test(pixelId)) {
      toast.error("Informe um Pixel ID numérico da Meta.");
      return;
    }
    const token = metaPixel.accessToken.trim();
    if (metaPixel.enabled && metaPixel.values.capi_enabled && !metaPixel.hasAccessToken && !token) {
      toast.error("Informe o Access Token para ativar a API de Conversões.");
      return;
    }
    if (metaPixel.values.only_selected_products && metaPixel.values.selected_product_ids.length === 0) {
      toast.error("Selecione ao menos um produto para filtrar os eventos.");
      return;
    }
    setMetaPixelSaving(true);
    try {
      const payload: Record<string, unknown> = {
        enabled: metaPixel.enabled,
        pixel_name: metaPixel.values.pixel_name,
        browser_enabled: metaPixel.values.browser_enabled,
        capi_enabled: metaPixel.values.capi_enabled,
        only_paid_sales: metaPixel.values.only_paid_sales,
        only_selected_products: metaPixel.values.only_selected_products,
        selected_product_ids: metaPixel.values.selected_product_ids,
      };
      if (!keepCurrentPixel) payload.pixel_id = pixelId;
      if (token) payload.access_token = token;
      if (metaPixel.testEventCode.trim()) payload.test_event_code = metaPixel.testEventCode.trim();
      const data = await api.put<{
        enabled: boolean;
        has_pixel: boolean;
        has_access_token: boolean;
        has_test_event_code: boolean;
        values: typeof metaPixel.values;
      }>(`/stores/${selectedStore.id}/meta-pixel`, payload);
      setMetaPixel((prev) => ({
        ...prev,
        enabled: data.enabled ?? prev.enabled,
        hasPixel: data.has_pixel ?? prev.hasPixel,
        hasAccessToken: data.has_access_token ?? prev.hasAccessToken,
        hasTestEventCode: data.has_test_event_code ?? prev.hasTestEventCode,
        accessToken: "",
        testEventCode: "",
        values: { ...prev.values, ...(data.values ?? {}) },
      }));
      toast.success("Meta Pixel e API de Conversões salvos.");
      setActiveApp(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar Meta Pixel.");
    } finally {
      setMetaPixelSaving(false);
    }
  };

  const handleToggleMetaPixel = async () => {
    if (!selectedStore) return;
    const nextEnabled = !metaPixel.enabled;
    if (nextEnabled && !metaPixel.hasPixel) {
      toast.error("Informe e salve o Pixel ID antes de ativar.");
      return;
    }
    if (nextEnabled && metaPixel.values.capi_enabled && !metaPixel.hasAccessToken) {
      toast.error("Informe e salve o Access Token antes de ativar a API de Conversões.");
      return;
    }
    setMetaPixel((prev) => ({ ...prev, enabled: nextEnabled }));
    try {
      const data = await api.put<{ enabled: boolean }>(`/stores/${selectedStore.id}/meta-pixel`, { enabled: nextEnabled });
      setMetaPixel((prev) => ({ ...prev, enabled: data.enabled ?? nextEnabled }));
      toast.success(nextEnabled ? "Meta Pixel ativado." : "Meta Pixel desativado.");
    } catch (err) {
      setMetaPixel((prev) => ({ ...prev, enabled: !nextEnabled }));
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar Meta Pixel.");
    }
  };

  const handleSaveTikTokPixel = async () => {
    if (!selectedStore) return;
    const pixelCode = tiktokPixel.values.pixel_code.trim();
    const keepCurrentPixel = pixelCode === "" && tiktokPixel.hasPixel;
    if (!keepCurrentPixel && pixelCode === "") {
      toast.error("Informe o Pixel Code do TikTok.");
      return;
    }
    const token = tiktokPixel.accessToken.trim();
    if (tiktokPixel.enabled && tiktokPixel.values.events_api_enabled && !tiktokPixel.hasAccessToken && !token) {
      toast.error("Informe o Access Token para ativar a Events API do TikTok.");
      return;
    }
    if (tiktokPixel.values.only_selected_products && tiktokPixel.values.selected_product_ids.length === 0) {
      toast.error("Selecione ao menos um produto para filtrar os eventos.");
      return;
    }

    setTikTokPixelSaving(true);
    try {
      const payload: Record<string, unknown> = {
        enabled: tiktokPixel.enabled,
        pixel_name: tiktokPixel.values.pixel_name,
        browser_enabled: tiktokPixel.values.browser_enabled,
        events_api_enabled: tiktokPixel.values.events_api_enabled,
        only_paid_sales: tiktokPixel.values.only_paid_sales,
        only_selected_products: tiktokPixel.values.only_selected_products,
        selected_product_ids: tiktokPixel.values.selected_product_ids,
      };
      if (!keepCurrentPixel) payload.pixel_code = pixelCode;
      if (token) payload.access_token = token;
      if (tiktokPixel.testEventCode.trim()) payload.test_event_code = tiktokPixel.testEventCode.trim();

      const data = await api.put<{
        enabled: boolean;
        has_pixel: boolean;
        has_access_token: boolean;
        has_test_event_code: boolean;
        values: typeof tiktokPixel.values;
      }>(`/stores/${selectedStore.id}/tiktok-pixel`, payload);
      setTikTokPixel((prev) => ({
        ...prev,
        enabled: data.enabled ?? prev.enabled,
        hasPixel: data.has_pixel ?? prev.hasPixel,
        hasAccessToken: data.has_access_token ?? prev.hasAccessToken,
        hasTestEventCode: data.has_test_event_code ?? prev.hasTestEventCode,
        accessToken: "",
        testEventCode: "",
        values: { ...prev.values, ...(data.values ?? {}) },
      }));
      toast.success("TikTok Pixel e Events API salvos.");
      setActiveApp(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar TikTok Pixel.");
    } finally {
      setTikTokPixelSaving(false);
    }
  };

  const handleToggleTikTokPixel = async () => {
    if (!selectedStore) return;
    const nextEnabled = !tiktokPixel.enabled;
    if (nextEnabled && !tiktokPixel.hasPixel) {
      toast.error("Informe e salve o Pixel Code antes de ativar.");
      return;
    }
    if (nextEnabled && tiktokPixel.values.events_api_enabled && !tiktokPixel.hasAccessToken) {
      toast.error("Informe e salve o Access Token antes de ativar a Events API.");
      return;
    }
    setTikTokPixel((prev) => ({ ...prev, enabled: nextEnabled }));
    try {
      const data = await api.put<{ enabled: boolean }>(`/stores/${selectedStore.id}/tiktok-pixel`, { enabled: nextEnabled });
      setTikTokPixel((prev) => ({ ...prev, enabled: data.enabled ?? nextEnabled }));
      toast.success(nextEnabled ? "TikTok Pixel ativado." : "TikTok Pixel desativado.");
    } catch (err) {
      setTikTokPixel((prev) => ({ ...prev, enabled: !nextEnabled }));
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar TikTok Pixel.");
    }
  };

  const handleSaveKwaiPixel = async () => {
    if (!selectedStore) return;
    const pixelCode = kwaiPixel.values.pixel_code.trim();
    const keepCurrentPixel = pixelCode === "" && kwaiPixel.hasPixel;
    if (!keepCurrentPixel && pixelCode === "") {
      toast.error("Informe o Pixel ID do Kwai.");
      return;
    }
    const token = kwaiPixel.accessToken.trim();
    if (kwaiPixel.enabled && kwaiPixel.values.events_api_enabled && !kwaiPixel.hasAccessToken && !token) {
      toast.error("Informe o Access Token para ativar a API server-side do Kwai.");
      return;
    }
    if (kwaiPixel.values.only_selected_products && kwaiPixel.values.selected_product_ids.length === 0) {
      toast.error("Selecione ao menos um produto para filtrar os eventos.");
      return;
    }
    setKwaiPixelSaving(true);
    try {
      const payload: Record<string, unknown> = {
        enabled: kwaiPixel.enabled,
        pixel_name: kwaiPixel.values.pixel_name,
        browser_enabled: kwaiPixel.values.browser_enabled,
        events_api_enabled: kwaiPixel.values.events_api_enabled,
        only_paid_sales: kwaiPixel.values.only_paid_sales,
        only_selected_products: kwaiPixel.values.only_selected_products,
        selected_product_ids: kwaiPixel.values.selected_product_ids,
      };
      if (!keepCurrentPixel) payload.pixel_code = pixelCode;
      if (token) payload.access_token = token;
      if (kwaiPixel.testEventCode.trim()) payload.test_event_code = kwaiPixel.testEventCode.trim();
      const data = await api.put<{
        enabled: boolean;
        has_pixel: boolean;
        has_access_token: boolean;
        has_test_event_code: boolean;
        events_api_available?: boolean;
        values: typeof kwaiPixel.values;
      }>(`/stores/${selectedStore.id}/kwai-pixel`, payload);
      setKwaiPixel((prev) => ({
        ...prev,
        enabled: data.enabled ?? prev.enabled,
        hasPixel: data.has_pixel ?? prev.hasPixel,
        hasAccessToken: data.has_access_token ?? prev.hasAccessToken,
        hasTestEventCode: data.has_test_event_code ?? prev.hasTestEventCode,
        eventsApiAvailable: data.events_api_available ?? prev.eventsApiAvailable,
        accessToken: "",
        testEventCode: "",
        values: { ...prev.values, ...(data.values ?? {}) },
      }));
      toast.success("Kwai Pixel e configurações de eventos salvos.");
      setActiveApp(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar Kwai Pixel.");
    } finally {
      setKwaiPixelSaving(false);
    }
  };

  const handleToggleKwaiPixel = async () => {
    if (!selectedStore) return;
    const nextEnabled = !kwaiPixel.enabled;
    if (nextEnabled && !kwaiPixel.hasPixel) {
      toast.error("Informe e salve o Pixel ID antes de ativar.");
      return;
    }
    if (nextEnabled && kwaiPixel.values.events_api_enabled && !kwaiPixel.hasAccessToken) {
      toast.error("Informe e salve o Access Token antes de ativar a API server-side.");
      return;
    }
    setKwaiPixel((prev) => ({ ...prev, enabled: nextEnabled }));
    try {
      const data = await api.put<{ enabled: boolean }>(`/stores/${selectedStore.id}/kwai-pixel`, { enabled: nextEnabled });
      setKwaiPixel((prev) => ({ ...prev, enabled: data.enabled ?? nextEnabled }));
      toast.success(nextEnabled ? "Kwai Pixel ativado." : "Kwai Pixel desativado.");
    } catch (err) {
      setKwaiPixel((prev) => ({ ...prev, enabled: !nextEnabled }));
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar Kwai Pixel.");
    }
  };

  const handleSaveTaboolaPixel = async () => {
    if (!selectedStore) return;
    const accountId = taboolaPixel.values.account_id.trim();
    const keepCurrent = accountId === "" && taboolaPixel.hasAccountId;
    if (!keepCurrent && accountId === "") {
      toast.error("Informe o Account ID do Taboola.");
      return;
    }
    if (taboolaPixel.values.only_selected_products && taboolaPixel.values.selected_product_ids.length === 0) {
      toast.error("Selecione ao menos um produto para filtrar os eventos.");
      return;
    }
    setTaboolaPixelSaving(true);
    try {
      const payload: Record<string, unknown> = {
        enabled: taboolaPixel.enabled,
        pixel_name: taboolaPixel.values.pixel_name,
        browser_enabled: taboolaPixel.values.browser_enabled,
        s2s_enabled: taboolaPixel.values.s2s_enabled,
        only_paid_sales: taboolaPixel.values.only_paid_sales,
        only_selected_products: taboolaPixel.values.only_selected_products,
        selected_product_ids: taboolaPixel.values.selected_product_ids,
        page_view_event_name: taboolaPixel.values.page_view_event_name,
        view_content_event_name: taboolaPixel.values.view_content_event_name,
        add_to_cart_event_name: taboolaPixel.values.add_to_cart_event_name,
        initiate_checkout_event_name: taboolaPixel.values.initiate_checkout_event_name,
        add_payment_info_event_name: taboolaPixel.values.add_payment_info_event_name,
        purchase_event_name: taboolaPixel.values.purchase_event_name,
      };
      if (!keepCurrent) payload.account_id = accountId;
      if (taboolaPixel.postbackUrl.trim()) payload.postback_url = taboolaPixel.postbackUrl.trim();
      const data = await api.put<{
        enabled: boolean;
        has_account_id: boolean;
        has_postback_url: boolean;
        values: typeof taboolaPixel.values;
      }>(`/stores/${selectedStore.id}/taboola-pixel`, payload);
      setTaboolaPixel((prev) => ({
        ...prev,
        enabled: data.enabled ?? prev.enabled,
        hasAccountId: data.has_account_id ?? prev.hasAccountId,
        hasPostbackUrl: data.has_postback_url ?? prev.hasPostbackUrl,
        values: { ...prev.values, ...(data.values ?? {}) },
        postbackUrl: "",
      }));
      toast.success("Taboola Pixel e postback salvos.");
      setActiveApp(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar Taboola Pixel.");
    } finally {
      setTaboolaPixelSaving(false);
    }
  };

  const handleToggleTaboolaPixel = async () => {
    if (!selectedStore) return;
    const nextEnabled = !taboolaPixel.enabled;
    if (nextEnabled && !taboolaPixel.hasAccountId) {
      toast.error("Informe e salve o Account ID antes de ativar.");
      return;
    }
    setTaboolaPixel((prev) => ({ ...prev, enabled: nextEnabled }));
    try {
      const data = await api.put<{ enabled: boolean }>(`/stores/${selectedStore.id}/taboola-pixel`, { enabled: nextEnabled });
      setTaboolaPixel((prev) => ({ ...prev, enabled: data.enabled ?? nextEnabled }));
      toast.success(nextEnabled ? "Taboola Pixel ativado." : "Taboola Pixel desativado.");
    } catch (err) {
      setTaboolaPixel((prev) => ({ ...prev, enabled: !nextEnabled }));
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar Taboola Pixel.");
    }
  };

  const isConfigured = (appId: AppId) => {
    if (appId === "google_ads") return googleAds.hasPixel;
    if (appId === "meta_pixel") return metaPixel.hasPixel;
    if (appId === "tiktok_pixel") return tiktokPixel.hasPixel;
    if (appId === "kwai_pixel") return kwaiPixel.hasPixel;
    if (appId === "taboola_pixel") return taboolaPixel.hasAccountId;
    const cfg = appId === "melhor_envio" ? melhorEnvio : configs[appId];
    const app = APPS.find((a) => a.id === appId);
    if (!app || !cfg) return false;
    const requiredFields = app.fields.filter((f) => f.required);
    if (requiredFields.length === 0) {
      return app.fields.some((f) => cfg.values[f.key]?.trim());
    }
    return requiredFields.every((f) => {
      const v = cfg.values[f.key];
      return v !== undefined && v !== null && String(v).trim() !== "";
    });
  };

  const getMissingRequired = (appId: AppId): AppField[] => {
    if (appId === "google_ads") return [];
    const cfg = appId === "melhor_envio" ? melhorEnvio : configs[appId];
    const app = APPS.find((a) => a.id === appId);
    if (!app || !cfg) return [];
    return app.fields.filter((f) => {
      if (!f.required) return false;
      const v = cfg.values[f.key];
      return v === undefined || v === null || String(v).trim() === "";
    });
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
                    const isUtmify = app.id === "utmify";
                    const isMelhorEnvio = app.id === "melhor_envio";
                    const isGoogleAds = app.id === "google_ads";
                    const isMetaPixel = app.id === "meta_pixel";
                    const isTikTokPixel = app.id === "tiktok_pixel";
                    const isKwaiPixel = app.id === "kwai_pixel";
                    const isTaboolaPixel = app.id === "taboola_pixel";
                    const configured = isUtmify
                      ? utmify.hasToken
                      : isMelhorEnvio
                        ? melhorEnvio.hasToken
                        : isGoogleAds
                          ? googleAds.hasPixel
                          : isMetaPixel
                            ? metaPixel.hasPixel
                            : isTikTokPixel
                              ? tiktokPixel.hasPixel
                              : isKwaiPixel
                                ? kwaiPixel.hasPixel
                              : isTaboolaPixel
                                ? taboolaPixel.hasAccountId
                          : isConfigured(app.id);
                    const active = isUtmify
                      ? utmify.enabled
                      : isMelhorEnvio
                        ? melhorEnvio.enabled
                        : isGoogleAds
                          ? googleAds.enabled
                          : isMetaPixel
                            ? metaPixel.enabled
                            : isTikTokPixel
                              ? tiktokPixel.enabled
                              : isKwaiPixel
                                ? kwaiPixel.enabled
                              : isTaboolaPixel
                                ? taboolaPixel.enabled
                          : (cfg?.enabled ?? false);

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
        <DialogContent className="flex max-w-lg max-h-[85vh] flex-col overflow-hidden p-0">
          {activeDefinition && (
            <>
              <DialogHeader className="px-6 pt-6">
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

              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-2">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Ativar integração</p>
                    <p className="text-xs text-muted-foreground">
                      Habilita o app nesta loja.
                    </p>
                  </div>
                  <Switch
                    checked={
                      activeDefinition.id === "utmify"
                        ? utmify.enabled
                        : activeDefinition.id === "melhor_envio"
                          ? melhorEnvio.enabled
                          : activeDefinition.id === "google_ads"
                            ? googleAds.enabled
                            : activeDefinition.id === "meta_pixel"
                              ? metaPixel.enabled
                            : activeDefinition.id === "tiktok_pixel"
                              ? tiktokPixel.enabled
                            : activeDefinition.id === "kwai_pixel"
                              ? kwaiPixel.enabled
                            : activeDefinition.id === "taboola_pixel"
                              ? taboolaPixel.enabled
                            : configs[activeDefinition.id].enabled
                    }
                    onCheckedChange={() =>
                      activeDefinition.id === "utmify"
                        ? handleToggleUtmify()
                        : activeDefinition.id === "melhor_envio"
                          ? handleToggleMelhorEnvio()
                          : activeDefinition.id === "meta_pixel"
                            ? handleToggleMetaPixel()
                          : activeDefinition.id === "tiktok_pixel"
                            ? handleToggleTikTokPixel()
                          : activeDefinition.id === "kwai_pixel"
                            ? handleToggleKwaiPixel()
                          : activeDefinition.id === "taboola_pixel"
                            ? handleToggleTaboolaPixel()
                          : handleToggle(activeDefinition.id)
                    }
                  />
                </div>

                {activeDefinition.id === "meta_pixel" && (
                  <div className="space-y-4">
                    <div className="border-l-2 border-primary/40 pl-2">
                      <h3 className="text-sm font-semibold text-foreground">Credenciais da Meta</h3>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="meta_pixel_name">Nome do Pixel</Label>
                      <Input
                        id="meta_pixel_name"
                        value={metaPixel.values.pixel_name}
                        placeholder="Ex.: Pixel Vendas"
                        onChange={(e) => setMetaPixel((prev) => ({ ...prev, values: { ...prev.values, pixel_name: e.target.value } }))}
                        autoComplete="off"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="meta_pixel_id">Pixel ID<span className="ml-0.5 text-destructive">*</span></Label>
                      <Input
                        id="meta_pixel_id"
                        value={metaPixel.values.pixel_id}
                        placeholder={metaPixel.hasPixel ? "Pixel já salvo — informe um novo para substituir" : "123456789012345"}
                        onChange={(e) => setMetaPixel((prev) => ({ ...prev, values: { ...prev.values, pixel_id: e.target.value.replace(/\D/g, "") } }))}
                        inputMode="numeric"
                        autoComplete="off"
                      />
                      {metaPixel.hasPixel && <p className="text-xs text-emerald-600">Pixel configurado. Deixe vazio para manter o atual.</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="meta_access_token">Access Token da API de Conversões<span className="ml-0.5 text-destructive">*</span></Label>
                      <Input
                        id="meta_access_token"
                        type="password"
                        value={metaPixel.accessToken}
                        placeholder={metaPixel.hasAccessToken ? "Token já salvo — cole um novo para substituir" : "Cole o token gerado no Gerenciador de Eventos"}
                        onChange={(e) => setMetaPixel((prev) => ({ ...prev, accessToken: e.target.value }))}
                        autoComplete="new-password"
                      />
                      {metaPixel.hasAccessToken && <p className="text-xs text-emerald-600">Token configurado. Deixe vazio para manter o atual.</p>}
                      <p className="text-xs text-muted-foreground">Obrigatório quando a API de Conversões estiver ativa. O token fica criptografado e nunca é enviado ao checkout.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="meta_test_event_code">Código de teste (opcional)</Label>
                      <Input
                        id="meta_test_event_code"
                        type="password"
                        value={metaPixel.testEventCode}
                        placeholder={metaPixel.hasTestEventCode ? "Código já salvo — cole um novo para substituir" : "TEST12345"}
                        onChange={(e) => setMetaPixel((prev) => ({ ...prev, testEventCode: e.target.value }))}
                        autoComplete="off"
                      />
                    </div>
                    <div className="border-l-2 border-primary/40 pl-2"><h3 className="text-sm font-semibold text-foreground">Canais e regras</h3></div>
                    {([
                      ["browser_enabled", "Ativar Meta Pixel no navegador", "Dispara eventos no checkout para o navegador."],
                      ["capi_enabled", "Ativar API de Conversões", "Envia os eventos pelo servidor com dados enriquecidos."],
                      ["only_paid_sales", "Enviar Purchase somente após pagamento aprovado", "Evita contabilizar Pix/boleto ainda pendentes."],
                    ] as const).map(([key, label, helper]) => (
                      <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="pr-3"><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{helper}</p></div>
                        <Switch checked={metaPixel.values[key]} onCheckedChange={(checked) => setMetaPixel((prev) => ({ ...prev, values: { ...prev.values, [key]: checked } }))} />
                      </div>
                    ))}
                  </div>
                )}

                {activeDefinition.id === "tiktok_pixel" && (
                  <div className="space-y-4">
                    <div className="border-l-2 border-primary/40 pl-2">
                      <h3 className="text-sm font-semibold text-foreground">Credenciais do TikTok</h3>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="tiktok_pixel_name">Nome do Pixel</Label>
                      <Input
                        id="tiktok_pixel_name"
                        value={tiktokPixel.values.pixel_name}
                        placeholder="Ex.: Pixel Vendas"
                        onChange={(e) => setTikTokPixel((prev) => ({ ...prev, values: { ...prev.values, pixel_name: e.target.value } }))}
                        autoComplete="off"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="tiktok_pixel_code">Pixel Code (ID)<span className="ml-0.5 text-destructive">*</span></Label>
                      <Input
                        id="tiktok_pixel_code"
                        value={tiktokPixel.values.pixel_code}
                        placeholder={tiktokPixel.hasPixel ? "Pixel já salvo — informe um novo para substituir" : "CÓDIGO_DO_PIXEL"}
                        onChange={(e) => setTikTokPixel((prev) => ({ ...prev, values: { ...prev.values, pixel_code: e.target.value.trim() } }))}
                        autoComplete="off"
                      />
                      {tiktokPixel.hasPixel && <p className="text-xs text-emerald-600">Pixel configurado. Deixe vazio para manter o atual.</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="tiktok_access_token">Access Token da Events API<span className="ml-0.5 text-destructive">*</span></Label>
                      <Input
                        id="tiktok_access_token"
                        type="password"
                        value={tiktokPixel.accessToken}
                        placeholder={tiktokPixel.hasAccessToken ? "Token já salvo — cole um novo para substituir" : "Cole o token gerado no TikTok Events Manager"}
                        onChange={(e) => setTikTokPixel((prev) => ({ ...prev, accessToken: e.target.value }))}
                        autoComplete="new-password"
                      />
                      {tiktokPixel.hasAccessToken && <p className="text-xs text-emerald-600">Token configurado. Deixe vazio para manter o atual.</p>}
                      <p className="text-xs text-muted-foreground">Obrigatório quando a Events API estiver ativa. O token fica criptografado e nunca é enviado ao checkout.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="tiktok_test_event_code">Código de teste (opcional)</Label>
                      <Input
                        id="tiktok_test_event_code"
                        type="password"
                        value={tiktokPixel.testEventCode}
                        placeholder={tiktokPixel.hasTestEventCode ? "Código já salvo — cole um novo para substituir" : "TEST12345"}
                        onChange={(e) => setTikTokPixel((prev) => ({ ...prev, testEventCode: e.target.value }))}
                        autoComplete="off"
                      />
                    </div>
                    <div className="border-l-2 border-primary/40 pl-2"><h3 className="text-sm font-semibold text-foreground">Canais e regras</h3></div>
                    {([
                      ["browser_enabled", "Ativar TikTok Pixel no navegador", "Dispara eventos no checkout para o navegador."],
                      ["events_api_enabled", "Ativar TikTok Events API", "Envia os eventos pelo servidor com IP, user-agent e identificadores enriquecidos."],
                      ["only_paid_sales", "Enviar Purchase somente após pagamento aprovado", "Evita contabilizar Pix/boleto ainda pendentes."],
                    ] as const).map(([key, label, helper]) => (
                      <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="pr-3"><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{helper}</p></div>
                        <Switch checked={tiktokPixel.values[key]} onCheckedChange={(checked) => setTikTokPixel((prev) => ({ ...prev, values: { ...prev.values, [key]: checked } }))} />
                      </div>
                    ))}
                  </div>
                )}

                {activeDefinition.id === "kwai_pixel" && (
                  <div className="space-y-4">
                    <div className="border-l-2 border-primary/40 pl-2">
                      <h3 className="text-sm font-semibold text-foreground">Credenciais do Kwai</h3>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="kwai_pixel_name">Nome do Pixel</Label>
                      <Input id="kwai_pixel_name" value={kwaiPixel.values.pixel_name} placeholder="Ex.: Pixel Vendas"
                        onChange={(e) => setKwaiPixel((prev) => ({ ...prev, values: { ...prev.values, pixel_name: e.target.value } }))} autoComplete="off" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="kwai_pixel_code">Pixel ID<span className="ml-0.5 text-destructive">*</span></Label>
                      <Input id="kwai_pixel_code" value={kwaiPixel.values.pixel_code}
                        placeholder={kwaiPixel.hasPixel ? "Pixel já salvo — informe um novo para substituir" : "ID do Pixel no Kwai Ads Manager"}
                        onChange={(e) => setKwaiPixel((prev) => ({ ...prev, values: { ...prev.values, pixel_code: e.target.value.trim() } }))} autoComplete="off" />
                      {kwaiPixel.hasPixel && <p className="text-xs text-emerald-600">Pixel configurado. Deixe vazio para manter o atual.</p>}
                    </div>
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="kwai_access_token">Access Token server-side</Label>
                        <Input id="kwai_access_token" type="password" value={kwaiPixel.accessToken}
                          placeholder={kwaiPixel.hasAccessToken ? "Token já salvo — cole um novo para substituir" : "Cole o token fornecido pelo Kwai"}
                          onChange={(e) => setKwaiPixel((prev) => ({ ...prev, accessToken: e.target.value }))} autoComplete="new-password" />
                        {kwaiPixel.hasAccessToken && <p className="text-xs text-emerald-600">Token configurado. Deixe vazio para manter o atual.</p>}
                        <p className="text-xs text-muted-foreground">O token fica criptografado e nunca é enviado ao checkout.</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="kwai_test_event_code">Código de teste (opcional)</Label>
                        <Input id="kwai_test_event_code" type="password" value={kwaiPixel.testEventCode}
                          placeholder={kwaiPixel.hasTestEventCode ? "Código já salvo — cole um novo para substituir" : "Código de teste do Kwai"}
                          onChange={(e) => setKwaiPixel((prev) => ({ ...prev, testEventCode: e.target.value }))} autoComplete="off" />
                      </div>
                    </>
                    <div className="border-l-2 border-primary/40 pl-2"><h3 className="text-sm font-semibold text-foreground">Canais e regras</h3></div>
                    {([
                      ["browser_enabled", "Ativar Kwai Pixel no navegador", "Carrega o Pixel e envia eventos do checkout."],
                      ...(kwaiPixel.eventsApiAvailable ? [["events_api_enabled", "Ativar eventos server-side", "Envia eventos pelo servidor quando o endpoint do Kwai estiver habilitado."]] : []),
                      ["only_paid_sales", "Enviar Purchase somente após pagamento aprovado", "Evita contabilizar Pix/boleto ainda pendentes."],
                    ] as const).map(([key, label, helper]) => (
                      <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="pr-3"><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{helper}</p></div>
                        <Switch disabled={key === "events_api_enabled" && !kwaiPixel.eventsApiAvailable} checked={Boolean(kwaiPixel.values[key as keyof typeof kwaiPixel.values])} onCheckedChange={(checked) => setKwaiPixel((prev) => ({ ...prev, values: { ...prev.values, [key]: checked } }))} />
                      </div>
                    ))}
                  </div>
                )}

                {activeDefinition.id === "taboola_pixel" && (
                  <div className="space-y-4">
                    <div className="border-l-2 border-primary/40 pl-2">
                      <h3 className="text-sm font-semibold text-foreground">Credenciais do Taboola</h3>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="taboola_pixel_name">Nome da integração</Label>
                      <Input id="taboola_pixel_name" value={taboolaPixel.values.pixel_name} placeholder="Ex.: Taboola Vendas"
                        onChange={(e) => setTaboolaPixel((prev) => ({ ...prev, values: { ...prev.values, pixel_name: e.target.value } }))} autoComplete="off" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="taboola_account_id">Account ID<span className="ml-0.5 text-destructive">*</span></Label>
                      <Input id="taboola_account_id" value={taboolaPixel.values.account_id}
                        placeholder={taboolaPixel.hasAccountId ? "Account ID já salvo — informe um novo para substituir" : "ID da conta no Taboola Ads"}
                        onChange={(e) => setTaboolaPixel((prev) => ({ ...prev, values: { ...prev.values, account_id: e.target.value.trim() } }))} autoComplete="off" />
                      {taboolaPixel.hasAccountId && <p className="text-xs text-emerald-600">Account ID configurado. Deixe vazio para manter o atual.</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="taboola_postback_url">URL do postback S2S (opcional)</Label>
                      <Input id="taboola_postback_url" type="url" value={taboolaPixel.postbackUrl}
                        placeholder={taboolaPixel.hasPostbackUrl ? "URL personalizada já salva — deixe vazio para manter" : "https://trc.taboola.com/actions-handler/log/3/s2s-action"}
                        onChange={(e) => setTaboolaPixel((prev) => ({ ...prev, postbackUrl: e.target.value }))} autoComplete="off" />
                      <p className="text-xs text-muted-foreground">Deixe vazio para usar o endpoint oficial global do Taboola. A URL fica protegida no servidor.</p>
                    </div>
                    <div className="border-l-2 border-primary/40 pl-2"><h3 className="text-sm font-semibold text-foreground">Canais e regras</h3></div>
                    {([
                      ["browser_enabled", "Ativar Taboola Pixel no navegador", "Carrega o Pixel e envia PageView e eventos do checkout."],
                      ["s2s_enabled", "Ativar postback server-side", "Envia conversões ao Taboola quando o clique tblci estiver disponível."],
                      ["only_paid_sales", "Enviar Purchase somente após pagamento aprovado", "Evita contabilizar pedidos pendentes."],
                    ] as const).map(([key, label, helper]) => (
                      <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="pr-3"><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{helper}</p></div>
                        <Switch checked={Boolean(taboolaPixel.values[key as keyof typeof taboolaPixel.values])} onCheckedChange={(checked) => setTaboolaPixel((prev) => ({ ...prev, values: { ...prev.values, [key]: checked } }))} />
                      </div>
                    ))}
                    <div className="border-l-2 border-primary/40 pl-2"><h3 className="text-sm font-semibold text-foreground">Nomes dos eventos DCO</h3></div>
                    <p className="text-xs text-muted-foreground">Use os nomes exatamente como aparecem nos eventos personalizados da conta Taboola.</p>
                    {([
                      ["page_view_event_name", "PageView"], ["view_content_event_name", "ViewContent"], ["add_to_cart_event_name", "AddToCart"],
                      ["initiate_checkout_event_name", "InitiateCheckout"], ["add_payment_info_event_name", "AddPaymentInfo"], ["purchase_event_name", "Purchase"],
                    ] as const).map(([key, label]) => (
                      <div key={key} className="grid grid-cols-[1fr_1.2fr] items-center gap-3">
                        <Label htmlFor={`taboola_${key}`}>{label}</Label>
                        <Input id={`taboola_${key}`} value={taboolaPixel.values[key]} onChange={(e) => setTaboolaPixel((prev) => ({ ...prev, values: { ...prev.values, [key]: e.target.value } }))} />
                      </div>
                    ))}
                  </div>
                )}

                {activeDefinition.id === "google_ads" && (
                  <div className="space-y-4">
                    <div className="border-l-2 border-primary/40 pl-2">
                      <h3 className="text-sm font-semibold text-foreground">Pixel</h3>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="ga_pixel_name">
                        Nome do Pixel<span className="ml-0.5 text-destructive">*</span>
                      </Label>
                      <Input
                        id="ga_pixel_name"
                        type="text"
                        placeholder="Ex.: Pixel Vendas — BlackFriday"
                        value={googleAds.values.pixel_name}
                        onChange={(e) =>
                          setGoogleAds((prev) => ({
                            ...prev,
                            values: { ...prev.values, pixel_name: e.target.value },
                          }))
                        }
                        autoComplete="off"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="ga_pixel_id">
                        ID do Pixel<span className="ml-0.5 text-destructive">*</span>
                      </Label>
                      <Input
                        id="ga_pixel_id"
                        type="text"
                        placeholder={googleAds.hasPixel ? "Pixel já salvo — informe um novo para substituir" : "AW-XXXXXXXXX"}
                        onChange={(e) =>
                          setGoogleAds((prev) => ({
                            ...prev,
                            values: { ...prev.values, pixel_id: e.target.value },
                          }))
                        }
                        autoComplete="off"
                      />
                      {googleAds.hasPixel && (
                        <p className="text-xs text-emerald-600">
                          Pixel configurado. Deixe vazio para manter o atual.
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="ga_conversion_label">Rótulo de Conversão</Label>
                      <Input
                        id="ga_conversion_label"
                        type="text"
                        placeholder="Ex.: abcDEFgh"
                        value={googleAds.values.conversion_label}
                        onChange={(e) =>
                          setGoogleAds((prev) => ({
                            ...prev,
                            values: { ...prev.values, conversion_label: e.target.value },
                          }))
                        }
                        autoComplete="off"
                      />
                      <p className="text-xs text-muted-foreground">
                        Rótulo da ação de conversão no Google Ads. Opcional, mas recomendado.
                      </p>
                    </div>

                    <div className="border-l-2 border-primary/40 pl-2">
                      <h3 className="text-sm font-semibold text-foreground">Disparos</h3>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="pr-3">
                        <p className="text-sm font-medium">Disparar apenas as vendas pagas</p>
                        <p className="text-xs text-muted-foreground">
                          Quando ativo, só dispara a conversão após o pagamento ser confirmado.
                          Recomendado para casos em que você só quer pagar conversões reais.
                        </p>
                      </div>
                      <Switch
                        checked={googleAds.values.only_paid_sales}
                        onCheckedChange={(c) =>
                          setGoogleAds((prev) => ({
                            ...prev,
                            values: { ...prev.values, only_paid_sales: c },
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="pr-3">
                          <p className="text-sm font-medium">Disparar somente em produtos selecionados</p>
                          <p className="text-xs text-muted-foreground">
                            Quando ativo, o pixel só dispara para os produtos selecionados abaixo.
                          </p>
                        </div>
                        <Switch
                          checked={googleAds.values.only_selected_products}
                          onCheckedChange={(c) =>
                            setGoogleAds((prev) => ({
                              ...prev,
                              values: { ...prev.values, only_selected_products: c },
                            }))
                          }
                        />
                      </div>

                      {googleAds.values.only_selected_products && (
                        <div className="rounded-lg border p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-xs font-semibold text-muted-foreground">
                              Selecione os produtos que disparam o pixel
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {googleAds.values.selected_product_ids.length} selecionado(s)
                            </span>
                          </div>
                          {storeProductsLoading ? (
                            <div className="space-y-2">
                              <Skeleton className="h-10 w-full rounded-md" />
                              <Skeleton className="h-10 w-full rounded-md" />
                              <Skeleton className="h-10 w-full rounded-md" />
                            </div>
                          ) : storeProducts.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              Nenhum produto encontrado nesta loja.
                            </p>
                          ) : (
                            <div className="max-h-56 overflow-y-auto rounded-md border border-border/60">
                              {storeProducts.map((p) => {
                                const checked = googleAds.values.selected_product_ids.includes(p.id);
                                return (
                                  <label
                                    key={p.id}
                                    className={`flex cursor-pointer items-center gap-3 border-b border-border/40 px-3 py-2 last:border-0 hover:bg-muted/40 ${
                                      checked ? "bg-muted/40" : ""
                                    }`}
                                  >
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={() => {
                                      setGoogleAds((prev) => {
                                        const set = new Set(prev.values.selected_product_ids);
                                        if (set.has(p.id)) set.delete(p.id);
                                        else set.add(p.id);
                                        return {
                                          ...prev,
                                          values: {
                                            ...prev.values,
                                            selected_product_ids: Array.from(set).sort((a, b) => a - b),
                                          },
                                        };
                                      });
                                    }}
                                    />
                                    {p.image_url ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={p.image_url}
                                        alt=""
                                        className="h-8 w-8 shrink-0 rounded object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted text-xs">
                                        {p.name?.[0]?.toUpperCase() ?? "?"}
                                      </div>
                                    )}
                                    <span className="min-w-0 flex-1 truncate text-sm">
                                      {p.parent_title ?? p.name}
                                      {p.parent_title && p.name !== p.parent_title ? (
                                        <span className="block text-xs text-muted-foreground">
                                          {p.name}
                                        </span>
                                      ) : null}
                                    </span>
                                    {!p.is_active && (
                                      <Badge variant="secondary" className="text-[10px]">
                                        Inativo
                                      </Badge>
                                    )}
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {(() => {
                    const fields = activeDefinition.fields;
                    // Agrupa os campos por `section`, mantendo a ordem original.
                    const sections: { name?: string; fields: AppField[] }[] = [];
                    for (const field of fields) {
                      const last = sections[sections.length - 1];
                      if (last && last.name === field.section) {
                        last.fields.push(field);
                      } else {
                        sections.push({ name: field.section, fields: [field] });
                      }
                    }

                    return sections.map((section, sIdx) => (
                      <div key={sIdx} className="space-y-4">
                        {section.name && (
                          <div className="border-l-2 border-primary/40 pl-2">
                            <h3 className="text-sm font-semibold text-foreground">
                              {section.name}
                            </h3>
                          </div>
                        )}
                        {section.fields.map((field) => {
                          const isUtmify = activeDefinition.id === "utmify";
                          const isMelhorEnvio = activeDefinition.id === "melhor_envio";
                          const isCheckbox = field.type === "checkbox";
                          const isSelect = field.type === "select";
                          const isTokenField =
                            (isUtmify && field.key === "token") ||
                            (isMelhorEnvio && field.key === "token");

                          const baseValue = isUtmify
                            ? utmify.token
                            : isMelhorEnvio
                              ? melhorEnvio.values[field.key] ?? ""
                              : configs[activeDefinition.id].values[field.key] ?? "";

                          const value = isTokenField
                            ? isUtmify
                              ? utmify.token
                              : melhorEnvio.token
                            : baseValue;

                          const hasSavedToken = isUtmify
                            ? utmify.hasToken
                            : isMelhorEnvio
                              ? melhorEnvio.hasToken
                              : false;

                          const placeholder =
                            isTokenField && hasSavedToken
                              ? "Credencial já salva — cole uma nova para substituir"
                              : field.placeholder;

                          if (isSelect) {
                            return (
                              <div key={field.key} className="space-y-1.5">
                                <Label htmlFor={field.key}>
                                  {field.label}
                                  {field.required && (
                                    <span className="ml-0.5 text-destructive">*</span>
                                  )}
                                </Label>
                                <Select
                                  value={String(value || "")}
                                  onValueChange={(val) =>
                                    updateValue(activeDefinition.id, field.key, val)
                                  }
                                >
                                  <SelectTrigger id={field.key}>
                                    <SelectValue
                                      placeholder={placeholder ?? "Selecione..."}
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {field.options?.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {field.helper && (
                                  <p className="text-xs text-muted-foreground">
                                    {field.helper}
                                  </p>
                                )}
                              </div>
                            );
                          }

                          if (isCheckbox) {
                            const checked = value === "true";
                            return (
                              <div key={field.key} className="space-y-1.5">
                                <div className="flex items-start gap-2.5 rounded-lg border p-3">
                                  <Checkbox
                                    id={field.key}
                                    checked={checked}
                                    onCheckedChange={(c) =>
                                      updateValue(
                                        activeDefinition.id,
                                        field.key,
                                        c ? "true" : "false"
                                      )
                                    }
                                    className="mt-0.5"
                                  />
                                  <div className="space-y-1">
                                    <Label
                                      htmlFor={field.key}
                                      className="cursor-pointer text-sm font-medium"
                                    >
                                      {field.label}
                                    </Label>
                                    {field.helper && (
                                      <p className="text-xs text-muted-foreground">
                                        {field.helper}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={field.key} className="space-y-1.5">
                              <Label htmlFor={field.key}>
                                {field.label}
                                {field.required && (
                                  <span className="ml-0.5 text-destructive">*</span>
                                )}
                              </Label>
                              <Input
                                id={field.key}
                                type={field.type ?? "text"}
                                placeholder={placeholder}
                                value={value}
                                onChange={(e) =>
                                  isUtmify
                                    ? setUtmify((prev) => ({
                                        ...prev,
                                        token: e.target.value,
                                      }))
                                    : isMelhorEnvio && isTokenField
                                      ? setMelhorEnvio((prev) => ({
                                          ...prev,
                                          token: e.target.value,
                                        }))
                                      : updateValue(
                                          activeDefinition.id,
                                          field.key,
                                          e.target.value
                                        )
                                }
                                autoComplete="off"
                              />
                              {field.helper && (
                                <p className="text-xs text-muted-foreground">
                                  {field.helper}
                                </p>
                              )}
                              {(isUtmify || isMelhorEnvio) && hasSavedToken && (
                                <p className="text-xs text-emerald-600">
                                  Credencial configurada. Deixe vazio para manter a atual.
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ));
                  })()}
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

              <DialogFooter className="px-6 pb-6">
                <Button
                  variant="outline"
                  onClick={() => setActiveApp(null)}
                  disabled={saving || utmifySaving || melhorEnvioSaving || googleAdsSaving || metaPixelSaving || tiktokPixelSaving || kwaiPixelSaving || taboolaPixelSaving}
                >
                  <X className="mr-1.5 h-4 w-4" /> Cancelar
                </Button>
                <Button
                  onClick={handleSaveActive}
                  disabled={saving || utmifySaving || melhorEnvioSaving || googleAdsSaving || metaPixelSaving || tiktokPixelSaving || kwaiPixelSaving || taboolaPixelSaving}
                >
                  {saving || utmifySaving || melhorEnvioSaving || googleAdsSaving || metaPixelSaving || tiktokPixelSaving || kwaiPixelSaving || taboolaPixelSaving ? (
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
