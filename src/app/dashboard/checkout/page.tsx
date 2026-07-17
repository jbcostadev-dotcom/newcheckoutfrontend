"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import type { CheckoutSettings, SocialProof } from "@/types";
import {
  ArrowLeft,
  ChevronDown,
  Monitor,
  Smartphone,
  Save,
  Plus,
  Star,
  Trash2,
  Pencil,
  Upload,
  X,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AccordionSection } from "@/components/ui/accordion-section";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const DEFAULTS: CheckoutSettings = {
  store_id: 0,
  primary_color: "#6366f1",
  secondary_color: "#ffffff",
  logo_url: null,
  banner_url: null,
  banner_height: "md",
  enable_order_bump: false,
  dark_mode: true,
  button_text: "Finalizar Compra",
  banner_message: "Digite aqui a mensagem",
  header_store_name_visible: true,
  header_secure_badge: true,
  header_logo_alignment: "left",
  header_bg_color: "#ffffff",
  header_icon_color: "#666666",
  announcement_bar_enabled: true,
  announcement_bar_bg: "#333333",
  announcement_bar_text_color: "#d4a843",
  summary_title: "Resumo do pedido",
  summary_show_discount: true,
  summary_coupon_enabled: true,
  step_title_font_size: "1.25rem",
  scarcity_enabled: false,
  scarcity_type: "countdown",
  scarcity_text: null,
  scarcity_countdown_minutes: 15,
  pix_confirmation_title: "Aguardando pagamento...",
  pix_confirmation_message: null,
  pix_confirmation_logo: null,
  footer_text: "Ambiente seguro · SSL criptografado",
  footer_show_cnpj: false,
  footer_cnpj: null,
  font_family: "Inter",
  font_size_base: "16px",
  social_proofs_enabled: true,
};

interface SocialProofForm {
  name: string;
  testimonial: string;
  stars: number;
  photo: File | null;
  photoPreview: string | null;
}

const EMPTY_FORM: SocialProofForm = {
  name: "",
  testimonial: "",
  stars: 5,
  photo: null,
  photoPreview: null,
};

type DeviceMode = "desktop" | "mobile";

const GOOGLE_FONTS = [
  "Inter",
  "Roboto",
  "Poppins",
  "Montserrat",
  "Open Sans",
  "Lato",
  "Raleway",
  "Nunito",
  "Oswald",
  "Playfair Display",
  "Merriweather",
  "Ubuntu",
];

const FONT_SIZES = ["14px", "15px", "16px", "17px", "18px", "19px", "20px"];
const STEP_FONT_SIZES = ["1rem", "1.1rem", "1.25rem", "1.4rem", "1.5rem"];
const BANNER_HEIGHTS = [
  { value: "sm", label: "Pequeno" },
  { value: "md", label: "Médio" },
  { value: "lg", label: "Grande" },
];

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border border-border"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-mono text-xs h-8"
        />
      </div>
    </div>
  );
}

function FieldRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div>
        <Label className="text-xs">{label}</Label>
        {description && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <Label className="text-xs cursor-pointer">{label}</Label>
        {description && (
          <p className="text-[11px] text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default function CheckoutCustomizationPage() {
  const router = useRouter();
  const { selectedStore } = useStore();
  const [settings, setSettings] = useState<CheckoutSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Social Proofs state
  const [socialProofs, setSocialProofs] = useState<SocialProof[]>([]);
  const [spModalOpen, setSpModalOpen] = useState(false);
  const [spForm, setSpForm] = useState<SocialProofForm>(EMPTY_FORM);
  const [spEditingId, setSpEditingId] = useState<number | null>(null);
  const [spSaving, setSpSaving] = useState(false);
  const spFileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!selectedStore) return;
    setLoading(true);
    try {
      const data = await api.get<CheckoutSettings>(
        `/stores/${selectedStore.id}/settings`
      );
      setSettings({ ...DEFAULTS, ...data });
    } catch {
      toast.error("Erro ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  }, [selectedStore]);

  const fetchSocialProofs = useCallback(async () => {
    if (!selectedStore) return;
    try {
      const data = await api.get<SocialProof[]>(
        `/stores/${selectedStore.id}/social-proofs`
      );
      setSocialProofs(data);
    } catch {
      // silent — non-critical
    }
  }, [selectedStore]);

  useEffect(() => {
    fetchSettings();
    fetchSocialProofs();
  }, [fetchSettings, fetchSocialProofs]);

  const openSpModal = (proof?: SocialProof) => {
    if (proof) {
      setSpEditingId(proof.id);
      setSpForm({
        name: proof.name,
        testimonial: proof.testimonial,
        stars: proof.stars,
        photo: null,
        photoPreview: proof.photo_url || null,
      });
    } else {
      setSpEditingId(null);
      setSpForm(EMPTY_FORM);
    }
    setSpModalOpen(true);
  };

  const handleSpPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSpForm((prev) => ({
      ...prev,
      photo: file,
      photoPreview: URL.createObjectURL(file),
    }));
  };

  const handleSpSave = async () => {
    if (!selectedStore) return;
    if (!spForm.name.trim() || !spForm.testimonial.trim()) {
      toast.error("Preencha o nome e o depoimento.");
      return;
    }
    setSpSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", spForm.name);
      formData.append("testimonial", spForm.testimonial);
      formData.append("stars", String(spForm.stars));
      if (spForm.photo) {
        formData.append("photo", spForm.photo);
      }

      if (spEditingId) {
        await api.post(
          `/stores/${selectedStore.id}/social-proofs/${spEditingId}`,
          formData
        );
        toast.success("Prova social atualizada!");
      } else {
        await api.post(
          `/stores/${selectedStore.id}/social-proofs`,
          formData
        );
        toast.success("Prova social adicionada!");
      }
      setSpModalOpen(false);
      setSpForm(EMPTY_FORM);
      setSpEditingId(null);
      fetchSocialProofs();
    } catch {
      toast.error("Erro ao salvar prova social.");
    } finally {
      setSpSaving(false);
    }
  };

  const handleSpDelete = async (id: number) => {
    if (!selectedStore) return;
    try {
      await api.delete(`/stores/${selectedStore.id}/social-proofs/${id}`);
      toast.success("Prova social removida!");
      fetchSocialProofs();
    } catch {
      toast.error("Erro ao remover prova social.");
    }
  };

  const previewUrl = (() => {
    if (!selectedStore) return null;
    const checkoutAppDomain =
      process.env.NEXT_PUBLIC_CHECKOUT_APP_DOMAIN ||
      `checkout.${process.env.NEXT_PUBLIC_CHECKOUT_BASE_DOMAIN || "bersenker.shop"}`;
    const customDomain = selectedStore.custom_domain;
    const subdomain = selectedStore.subdomain;
    if (customDomain) {
      return `https://${customDomain}/checkout?preview=1`;
    }
    if (subdomain) {
      return `https://${checkoutAppDomain}/${subdomain}/checkout?preview=1`;
    }
    return null;
  })();

  const postSettingsToIframe = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage(
      {
        type: "checkout:settings",
        settings: {
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
          logo_url: settings.logo_url,
          banner_url: settings.banner_url,
          banner_height: settings.banner_height,
          enable_order_bump: settings.enable_order_bump,
          dark_mode: settings.dark_mode,
          button_text: settings.button_text,
          banner_message: settings.banner_message,
          header_store_name_visible: settings.header_store_name_visible,
          header_secure_badge: settings.header_secure_badge,
          header_logo_alignment: settings.header_logo_alignment,
          header_bg_color: settings.header_bg_color,
          header_icon_color: settings.header_icon_color,
          announcement_bar_enabled: settings.announcement_bar_enabled,
          announcement_bar_bg: settings.announcement_bar_bg,
          announcement_bar_text_color: settings.announcement_bar_text_color,
          summary_title: settings.summary_title,
          summary_show_discount: settings.summary_show_discount,
          summary_coupon_enabled: settings.summary_coupon_enabled,
          step_title_font_size: settings.step_title_font_size,
          scarcity_enabled: settings.scarcity_enabled,
          scarcity_type: settings.scarcity_type,
          scarcity_text: settings.scarcity_text,
          scarcity_countdown_minutes: settings.scarcity_countdown_minutes,
          pix_confirmation_title: settings.pix_confirmation_title,
          pix_confirmation_message: settings.pix_confirmation_message,
          pix_confirmation_logo: settings.pix_confirmation_logo,
          footer_text: settings.footer_text,
          footer_show_cnpj: settings.footer_show_cnpj,
          footer_cnpj: settings.footer_cnpj,
          font_family: settings.font_family,
          font_size_base: settings.font_size_base,
          social_proofs_enabled: settings.social_proofs_enabled,
        },
      },
      "*"
    );
  }, [settings]);

  useEffect(() => {
    if (!previewUrl) return;
    postSettingsToIframe();
  }, [settings, previewUrl, iframeKey, postSettingsToIframe]);

  const handleSave = async () => {
    if (!selectedStore) return;
    setSaving(true);
    try {
      await api.put(`/stores/${selectedStore.id}/settings`, {
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        logo_url: settings.logo_url,
        banner_url: settings.banner_url,
        banner_height: settings.banner_height,
        enable_order_bump: settings.enable_order_bump,
        dark_mode: settings.dark_mode,
        button_text: settings.button_text,
        banner_message: settings.banner_message,
        header_store_name_visible: settings.header_store_name_visible,
        header_secure_badge: settings.header_secure_badge,
        header_logo_alignment: settings.header_logo_alignment,
        header_bg_color: settings.header_bg_color,
        header_icon_color: settings.header_icon_color,
        announcement_bar_enabled: settings.announcement_bar_enabled,
        announcement_bar_bg: settings.announcement_bar_bg,
        announcement_bar_text_color: settings.announcement_bar_text_color,
        summary_title: settings.summary_title,
        summary_show_discount: settings.summary_show_discount,
        summary_coupon_enabled: settings.summary_coupon_enabled,
        step_title_font_size: settings.step_title_font_size,
        scarcity_enabled: settings.scarcity_enabled,
        scarcity_type: settings.scarcity_type,
        scarcity_text: settings.scarcity_text,
        scarcity_countdown_minutes: settings.scarcity_countdown_minutes,
        pix_confirmation_title: settings.pix_confirmation_title,
        pix_confirmation_message: settings.pix_confirmation_message,
        pix_confirmation_logo: settings.pix_confirmation_logo,
        footer_text: settings.footer_text,
        footer_show_cnpj: settings.footer_show_cnpj,
        footer_cnpj: settings.footer_cnpj,
        font_family: settings.font_family,
        font_size_base: settings.font_size_base,
        social_proofs_enabled: settings.social_proofs_enabled,
      });
      toast.success("Configurações salvas!");
    } catch {
      toast.error("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  const update = <K extends keyof CheckoutSettings>(
    key: K,
    value: CheckoutSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-full" />
        <div className="grid gap-6" style={{ gridTemplateColumns: "280px 1fr" }}>
          <Skeleton className="h-[600px] w-full rounded-xl" />
          <Skeleton className="h-[600px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* ─── Toolbar ─── */}
      <div className="flex items-center justify-between border-b bg-background px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="gap-1.5 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <span className="text-muted-foreground">Checkout</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={device === "desktop" ? "default" : "ghost"}
            onClick={() => setDevice("desktop")}
            title="Desktop"
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={device === "mobile" ? "default" : "ghost"}
            onClick={() => setDevice("mobile")}
            title="Mobile"
          >
            <Smartphone className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-border mx-1" />
          <Button onClick={handleSave} disabled={saving} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {/* ─── Body: Sidebar + Preview ─── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-[280px] shrink-0 border-r bg-background overflow-y-auto">
          {/* Cabeçalho */}
          <AccordionSection title="Cabeçalho" defaultOpen={true}>
            <ToggleRow
              label="Nome da loja"
              description="Exibir nome da loja no cabeçalho"
              checked={settings.header_store_name_visible ?? true}
              onCheckedChange={(v) => update("header_store_name_visible", v)}
            />
            <ToggleRow
              label="Selo de segurança"
              description='Exibir "Pagamento 100% Seguro"'
              checked={settings.header_secure_badge ?? true}
              onCheckedChange={(v) => update("header_secure_badge", v)}
            />
            <FieldRow label="URL da Logo">
              <Input
                value={settings.logo_url ?? ""}
                onChange={(e) => update("logo_url", e.target.value)}
                placeholder="https://exemplo.com/logo.png"
                className="h-8 text-xs"
              />
            </FieldRow>
            <FieldRow label="Alinhamento da Logo">
              <Select
                value={settings.header_logo_alignment ?? "left"}
                onValueChange={(v) => update("header_logo_alignment", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Direita</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
            <div className="grid grid-cols-2 gap-2 mt-2 pb-2">
              <ColorField
                label="Fundo cabeçalho"
                value={settings.header_bg_color ?? (settings.dark_mode ? "#1a1a1a" : "#ffffff")}
                onChange={(v) => update("header_bg_color", v)}
              />
              <ColorField
                label="Cor dos ícones"
                value={settings.header_icon_color ?? "#666666"}
                onChange={(v) => update("header_icon_color", v)}
              />
            </div>
          </AccordionSection>

          {/* Barra de avisos */}
          <AccordionSection title="Barra de avisos">
            <ToggleRow
              label="Ativar barra"
              checked={settings.announcement_bar_enabled ?? true}
              onCheckedChange={(v) => update("announcement_bar_enabled", v)}
            />
            {(settings.announcement_bar_enabled ?? true) && (
              <>
                <FieldRow label="Texto da mensagem">
                  <Input
                    value={settings.banner_message ?? ""}
                    onChange={(e) => update("banner_message", e.target.value)}
                    placeholder="Digite aqui a mensagem"
                    className="h-8 text-xs"
                  />
                </FieldRow>
                <div className="grid grid-cols-2 gap-2">
                  <ColorField
                    label="Cor de fundo"
                    value={settings.announcement_bar_bg ?? "#333333"}
                    onChange={(v) => update("announcement_bar_bg", v)}
                  />
                  <ColorField
                    label="Cor do texto"
                    value={settings.announcement_bar_text_color ?? "#d4a843"}
                    onChange={(v) => update("announcement_bar_text_color", v)}
                  />
                </div>
              </>
            )}
          </AccordionSection>

          {/* Banner */}
          <AccordionSection title="Banner">
            <FieldRow label="URL da imagem">
              <Input
                value={settings.banner_url ?? ""}
                onChange={(e) => update("banner_url", e.target.value)}
                placeholder="https://exemplo.com/banner.jpg"
                className="h-8 text-xs"
              />
            </FieldRow>
            <FieldRow label="Altura do banner">
              <Select
                value={settings.banner_height ?? "md"}
                onValueChange={(v) => update("banner_height", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BANNER_HEIGHTS.map((h) => (
                    <SelectItem key={h.value} value={h.value}>
                      {h.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            {settings.banner_url && (
              <img
                src={settings.banner_url}
                alt="Banner"
                className="w-full rounded-md object-cover"
                style={{
                  height:
                    settings.banner_height === "sm"
                      ? 60
                      : settings.banner_height === "lg"
                      ? 160
                      : 100,
                }}
              />
            )}
          </AccordionSection>

          {/* Resumo */}
          <AccordionSection title="Resumo">
            <FieldRow label="Título do resumo">
              <Input
                value={settings.summary_title ?? "Resumo do pedido"}
                onChange={(e) => update("summary_title", e.target.value)}
                placeholder="Resumo do pedido"
                className="h-8 text-xs"
              />
            </FieldRow>
            <ToggleRow
              label="Mostrar descontos"
              checked={settings.summary_show_discount ?? true}
              onCheckedChange={(v) => update("summary_show_discount", v)}
            />
            <ToggleRow
              label="Cupom de desconto"
              description="Exibir campo para inserir cupom"
              checked={settings.summary_coupon_enabled ?? true}
              onCheckedChange={(v) => update("summary_coupon_enabled", v)}
            />
          </AccordionSection>

          {/* Conteúdo das etapas */}
          <AccordionSection title="Conteúdo das etapas">
            <FieldRow label="Tamanho da fonte dos títulos">
              <Select
                value={settings.step_title_font_size ?? "1.25rem"}
                onValueChange={(v) => update("step_title_font_size", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STEP_FONT_SIZES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
          </AccordionSection>

          {/* Escassez */}
          <AccordionSection title="Escassez">
            <ToggleRow
              label="Ativar escassez"
              description="Exibir elemento de urgência"
              checked={settings.scarcity_enabled ?? false}
              onCheckedChange={(v) => update("scarcity_enabled", v)}
            />
            {(settings.scarcity_enabled ?? false) && (
              <>
                <FieldRow label="Tipo de escassez">
                  <Select
                    value={settings.scarcity_type ?? "countdown"}
                    onValueChange={(v) => update("scarcity_type", v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="countdown">Countdown (tempo)</SelectItem>
                      <SelectItem value="stock">Estoque restante</SelectItem>
                      <SelectItem value="visitors">Visitantes agora</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="Texto personalizado">
                  <Input
                    value={settings.scarcity_text ?? ""}
                    onChange={(e) => update("scarcity_text", e.target.value)}
                    placeholder="Ex: Oferta por tempo limitado!"
                    className="h-8 text-xs"
                  />
                </FieldRow>
                {(settings.scarcity_type ?? "countdown") === "countdown" && (
                  <FieldRow label="Minutos do countdown">
                    <Input
                      type="number"
                      min={1}
                      max={999}
                      value={settings.scarcity_countdown_minutes ?? 15}
                      onChange={(e) =>
                        update("scarcity_countdown_minutes", parseInt(e.target.value) || 15)
                      }
                      className="h-8 text-xs"
                    />
                  </FieldRow>
                )}
              </>
            )}
          </AccordionSection>

          {/* Tela de confirmação do Pix */}
          <AccordionSection title="Tela de confirmação do Pix">
            <FieldRow label="Título">
              <Input
                value={settings.pix_confirmation_title ?? "Aguardando pagamento..."}
                onChange={(e) => update("pix_confirmation_title", e.target.value)}
                className="h-8 text-xs"
              />
            </FieldRow>
            <FieldRow label="Mensagem">
              <Textarea
                value={settings.pix_confirmation_message ?? ""}
                onChange={(e) => update("pix_confirmation_message", e.target.value)}
                placeholder="Mensagem exibida abaixo do título..."
                className="min-h-[60px] text-xs"
              />
            </FieldRow>
            <FieldRow label="Logo (URL)">
              <Input
                value={settings.pix_confirmation_logo ?? ""}
                onChange={(e) => update("pix_confirmation_logo", e.target.value)}
                placeholder="https://exemplo.com/pix-logo.png"
                className="h-8 text-xs"
              />
            </FieldRow>
          </AccordionSection>

          {/* Cores */}
          <AccordionSection title="Cores">
            <div className="grid grid-cols-2 gap-2">
              <ColorField
                label="Cor primária"
                value={settings.primary_color}
                onChange={(v) => update("primary_color", v)}
              />
              <ColorField
                label="Cor secundária"
                value={settings.secondary_color}
                onChange={(v) => update("secondary_color", v)}
              />
            </div>
          </AccordionSection>

          {/* Provas Sociais */}
          <AccordionSection title="Provas Sociais">
            <ToggleRow
              label="Ativar provas sociais"
              description="Exibir depoimentos no checkout"
              checked={settings.social_proofs_enabled ?? true}
              onCheckedChange={(v) => update("social_proofs_enabled", v)}
            />

            {(settings.social_proofs_enabled ?? true) && (
              <>
                {/* Lista de provas sociais existentes */}
                {socialProofs.length > 0 && (
                  <div className="space-y-2">
                    {socialProofs.map((proof) => (
                      <div
                        key={proof.id}
                        className="flex items-center gap-2 rounded-lg border border-border p-2 bg-accent/30"
                      >
                        {proof.photo_url ? (
                          <img
                            src={proof.photo_url}
                            alt={proof.name}
                            className="h-9 w-9 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {proof.name}
                          </p>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < proof.stars
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => openSpModal(proof)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleSpDelete(proof.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {socialProofs.length === 0 && (
                  <p className="text-[11px] text-muted-foreground text-center py-2">
                    Nenhuma prova social adicionada ainda.
                  </p>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 text-xs"
                  onClick={() => openSpModal()}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar prova social
                </Button>
              </>
            )}
          </AccordionSection>

          {/* Rodapé */}
          <AccordionSection title="Rodapé">
            <FieldRow label="Texto do rodapé">
              <Input
                value={settings.footer_text ?? "Ambiente seguro · SSL criptografado"}
                onChange={(e) => update("footer_text", e.target.value)}
                className="h-8 text-xs"
              />
            </FieldRow>
            <ToggleRow
              label="Exibir CNPJ"
              checked={settings.footer_show_cnpj ?? false}
              onCheckedChange={(v) => update("footer_show_cnpj", v)}
            />
            {(settings.footer_show_cnpj ?? false) && (
              <FieldRow label="CNPJ">
                <Input
                  value={settings.footer_cnpj ?? ""}
                  onChange={(e) => update("footer_cnpj", e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="h-8 text-xs"
                />
              </FieldRow>
            )}
          </AccordionSection>

          {/* Tipografia */}
          <AccordionSection title="Tipografia">
            <FieldRow label="Família de fonte">
              <Select
                value={settings.font_family ?? "Inter"}
                onValueChange={(v) => update("font_family", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOOGLE_FONTS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Tamanho base">
              <Select
                value={settings.font_size_base ?? "16px"}
                onValueChange={(v) => update("font_size_base", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
          </AccordionSection>
        </div>

        {/* Preview */}
        <div className="flex-1 bg-muted/40 overflow-y-auto flex items-start justify-center p-6">
          {!previewUrl ? (
            <div className="flex h-96 items-center justify-center rounded-lg border text-sm text-muted-foreground">
              Esta loja não possui subdomínio/domínio para gerar o preview.
            </div>
          ) : (
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={previewUrl}
              title="Preview do checkout"
              className="rounded-lg border bg-white shadow-sm transition-all"
              style={{
                width: device === "mobile" ? 390 : "100%",
                maxWidth: device === "mobile" ? 390 : undefined,
                height: 700,
              }}
              onLoad={() => {
                postSettingsToIframe();
              }}
            />
          )}
        </div>
      </div>

      {/* ─── Social Proof Modal ─── */}
      <Dialog open={spModalOpen} onOpenChange={setSpModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {spEditingId ? "Editar prova social" : "Adicionar prova social"}
            </DialogTitle>
            <DialogDescription>
              {spEditingId
                ? "Atualize os dados do depoimento."
                : "Adicione um novo depoimento de cliente."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Photo upload */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="relative h-20 w-20 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden group"
                onClick={() => spFileInputRef.current?.click()}
              >
                {spForm.photoPreview ? (
                  <>
                    <img
                      src={spForm.photoPreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="h-5 w-5 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Foto</span>
                  </div>
                )}
              </div>
              <input
                ref={spFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSpPhotoChange}
              />
              {spForm.photoPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive hover:text-destructive gap-1 h-6"
                  onClick={() =>
                    setSpForm((prev) => ({
                      ...prev,
                      photo: null,
                      photoPreview: null,
                    }))
                  }
                >
                  <X className="h-3 w-3" />
                  Remover foto
                </Button>
              )}
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs">Nome</Label>
              <Input
                value={spForm.name}
                onChange={(e) =>
                  setSpForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Nome do cliente"
                className="h-9 text-sm"
              />
            </div>

            {/* Testimonial */}
            <div className="space-y-1.5">
              <Label className="text-xs">Depoimento</Label>
              <Textarea
                value={spForm.testimonial}
                onChange={(e) =>
                  setSpForm((prev) => ({
                    ...prev,
                    testimonial: e.target.value,
                  }))
                }
                placeholder="O que o cliente disse..."
                className="min-h-[80px] text-sm"
              />
            </div>

            {/* Star rating */}
            <div className="space-y-1.5">
              <Label className="text-xs">Avaliação</Label>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      setSpForm((prev) => ({ ...prev, stars: i + 1 }))
                    }
                    className="p-0.5 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        i < spForm.stars
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30 hover:text-amber-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs text-muted-foreground ml-2">
                  {spForm.stars}/5
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSpModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSpSave}
              disabled={spSaving}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Save className="h-4 w-4" />
              {spSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
