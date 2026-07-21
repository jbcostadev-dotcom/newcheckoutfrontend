"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import type { OrderBump, OrderBumpFormData, Product } from "@/types";
import { Sparkles, Check, CreditCard, QrCode, Barcode, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderBumpFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderBump?: OrderBump | null;
  onSave: (data: OrderBumpFormData) => Promise<void>;
}

const EMPTY_FORM: OrderBumpFormData = {
  name: "",
  product_id: 0,
  discount_value: 0,
  discount_type: "fixed",
  scope: "any",
  target_product_id: null,
  show_credit_card: true,
  show_pix: true,
  show_boleto: true,
  offer_title: "Você também pode gostar",
  offer_message: "Adicione este item à sua compra com um desconto especial!",
  bg_color: "#FEFCE8",
  border_color: "#E2E8F0",
  button_color: "#13BF8C",
  button_text_color: "#FFFFFF",
  button_label: "Quero essa oferta",
  is_active: true,
};

const DEFAULT_COLORS = {
  bg_color: "#FEFCE8",
  border_color: "#E2E8F0",
  button_color: "#13BF8C",
  button_text_color: "#FFFFFF",
};

export function OrderBumpFormDialog({
  open,
  onOpenChange,
  orderBump,
  onSave,
}: OrderBumpFormDialogProps) {
  const { selectedStore } = useStore();
  const [form, setForm] = useState<OrderBumpFormData>(EMPTY_FORM);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(orderBump);

  useEffect(() => {
    if (open) {
      if (orderBump) {
        setForm({
          name: orderBump.name,
          product_id: orderBump.product_id,
          discount_value: Number(orderBump.discount_value) || 0,
          discount_type: orderBump.discount_type,
          scope: orderBump.scope,
          target_product_id: orderBump.target_product_id ?? null,
          show_credit_card: orderBump.show_credit_card,
          show_pix: orderBump.show_pix,
          show_boleto: orderBump.show_boleto,
          offer_title: orderBump.offer_title,
          offer_message: orderBump.offer_message ?? "",
          bg_color: orderBump.bg_color,
          border_color: orderBump.border_color,
          button_color: orderBump.button_color,
          button_text_color: orderBump.button_text_color,
          button_label: orderBump.button_label,
          is_active: orderBump.is_active,
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [open, orderBump]);

  // Carrega produtos da loja quando o dialog abre.
  useEffect(() => {
    if (!open || !selectedStore) return;
    setLoadingProducts(true);
    api
      .get<Product[]>(`/stores/${selectedStore.id}/products`)
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        // Seleciona o primeiro produto automaticamente ao criar.
        if (!orderBump && data.length > 0 && form.product_id === 0) {
          setForm((f) => ({ ...f, product_id: data[0].id }));
        }
      })
      .catch(() => {
        toast.error("Erro ao carregar produtos.");
      })
      .finally(() => setLoadingProducts(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedStore]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === form.product_id) ?? null,
    [products, form.product_id]
  );

  const previewPrice = useMemo(() => {
    const base = Number(selectedProduct?.price) || 0;
    const value = Number(form.discount_value) || 0;
    if (form.discount_type === "percent") {
      return Math.max(0, base - (base * value) / 100);
    }
    return Math.max(0, base - value);
  }, [selectedProduct, form.discount_value, form.discount_type]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Informe um nome para o order bump.");
      return;
    }
    if (!form.product_id) {
      toast.error("Selecione o produto oferecido.");
      return;
    }
    if (form.scope === "specific" && !form.target_product_id) {
      toast.error("Selecione o produto-alvo para o escopo específico.");
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {isEditing ? "Editar Order Bump" : "Novo Order Bump"}
          </DialogTitle>
          <DialogDescription>
            Configure a oferta que será exibida no checkout para aumentar o
            ticket médio.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          {/* ─── Formulário ─── */}
          <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
            {/* Informações */}
            <section className="space-y-2">
              <Label htmlFor="ob-name">Nome do Order Bump</Label>
              <Input
                id="ob-name"
                placeholder="Ex: Oferta de roupa extra"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Nome interno para identificação no painel.
              </p>
            </section>

            {/* O que oferecer */}
            <section className="space-y-3">
              <div className="text-sm font-semibold">O que oferecer</div>

              <div className="space-y-2">
                <Label htmlFor="ob-product">Produto da oferta</Label>
                {loadingProducts ? (
                  <p className="text-sm text-muted-foreground">Carregando produtos…</p>
                ) : products.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    <AlertCircle className="h-4 w-4" />
                    Cadastre produtos na loja antes de criar um order bump.
                  </div>
                ) : (
                  <Select
                    value={String(form.product_id)}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, product_id: Number(v) }))
                    }
                  >
                    <SelectTrigger id="ob-product">
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name} — {formatCurrency(Number(p.price))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ob-discount">Desconto</Label>
                  {form.discount_type === "fixed" ? (
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        R$
                      </span>
                      <Input
                        id="ob-discount"
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.discount_value}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            discount_value: Number(e.target.value) || 0,
                          }))
                        }
                        className="pl-9"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        id="ob-discount"
                        type="number"
                        min={0}
                        max={100}
                        step="1"
                        value={form.discount_value}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            discount_value: Number(e.target.value) || 0,
                          }))
                        }
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <div className="inline-flex rounded-md border bg-card p-0.5">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, discount_type: "fixed" }))}
                      className={cn(
                        "px-3 py-2 text-sm rounded-[5px] transition-colors",
                        form.discount_type === "fixed"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent"
                      )}
                    >
                      R$
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, discount_type: "percent" }))}
                      className={cn(
                        "px-3 py-2 text-sm rounded-[5px] transition-colors",
                        form.discount_type === "percent"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent"
                      )}
                    >
                      %
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Escopo */}
            <section className="space-y-3">
              <div className="text-sm font-semibold">Quando exibir</div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      scope: "any",
                      target_product_id: null,
                    }))
                  }
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition",
                    form.scope === "any"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent"
                  )}
                >
                  <span className="text-sm font-medium">Qualquer produto</span>
                  <span className="text-xs text-muted-foreground">
                    Exibe para qualquer carrinho
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, scope: "specific" }))}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition",
                    form.scope === "specific"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent"
                  )}
                >
                  <span className="text-sm font-medium">Produto específico</span>
                  <span className="text-xs text-muted-foreground">
                    Só para um produto do carrinho
                  </span>
                </button>
              </div>

              {form.scope === "specific" && (
                <div className="space-y-2">
                  <Label htmlFor="ob-target">Produto-alvo no carrinho</Label>
                  <Select
                    value={String(form.target_product_id ?? "")}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, target_product_id: Number(v) }))
                    }
                  >
                    <SelectTrigger id="ob-target">
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </section>

            {/* Formas de pagamento */}
            <section className="space-y-3">
              <div className="text-sm font-semibold">Formas de pagamento</div>
              <div className="grid grid-cols-3 gap-3">
                <PayMethodToggle
                  icon={CreditCard}
                  label="Cartão"
                  checked={form.show_credit_card}
                  onChange={(v) => setForm((f) => ({ ...f, show_credit_card: v }))}
                />
                <PayMethodToggle
                  icon={QrCode}
                  label="Pix"
                  checked={form.show_pix}
                  onChange={(v) => setForm((f) => ({ ...f, show_pix: v }))}
                />
                <PayMethodToggle
                  icon={Barcode}
                  label="Boleto"
                  checked={form.show_boleto}
                  onChange={(v) => setForm((f) => ({ ...f, show_boleto: v }))}
                />
              </div>
            </section>

            {/* Personalização da oferta */}
            <section className="space-y-3">
              <div className="text-sm font-semibold">Texto da oferta</div>

              <div className="space-y-2">
                <Label htmlFor="ob-offer-title">Título da oferta</Label>
                <Input
                  id="ob-offer-title"
                  placeholder="Você também pode gostar"
                  value={form.offer_title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, offer_title: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ob-offer-message">Mensagem</Label>
                <Textarea
                  id="ob-offer-message"
                  placeholder="Descreva a oferta para o cliente…"
                  rows={3}
                  value={form.offer_message ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, offer_message: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ob-button-label">Texto do botão</Label>
                <Input
                  id="ob-button-label"
                  placeholder="Quero essa oferta"
                  value={form.button_label}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, button_label: e.target.value }))
                  }
                />
              </div>
            </section>
          </div>

          {/* ─── Lateral: Status + Cores + Preview ─── */}
          <div className="space-y-5">
            {/* Status */}
            <div className="flex items-center justify-between rounded-lg border bg-card p-3">
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-xs text-muted-foreground">
                  Order bumps ativos aparecem no checkout.
                </p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              />
            </div>

            {/* Cores */}
            <section className="space-y-3">
              <div className="text-sm font-semibold">Personalize seu Order Bump</div>
              <div className="space-y-2">
                <ColorField
                  label="Cor do fundo"
                  value={form.bg_color}
                  onChange={(v) => setForm((f) => ({ ...f, bg_color: v }))}
                />
                <ColorField
                  label="Cor da borda"
                  value={form.border_color}
                  onChange={(v) => setForm((f) => ({ ...f, border_color: v }))}
                />
                <ColorField
                  label="Cor do botão"
                  value={form.button_color}
                  onChange={(v) => setForm((f) => ({ ...f, button_color: v }))}
                />
                <ColorField
                  label="Cor do texto do botão"
                  value={form.button_text_color}
                  onChange={(v) => setForm((f) => ({ ...f, button_text_color: v }))}
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, ...DEFAULT_COLORS }))
                }
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                Restaurar cores padrão
              </button>
            </section>

            {/* Preview ao vivo */}
            <section className="space-y-2">
              <div className="text-sm font-semibold">Pré-visualização</div>
              <div
                className="rounded-lg border p-3"
                style={{
                  background: form.bg_color,
                  borderColor: form.border_color,
                }}
              >
                {selectedProduct ? (
                  <>
                    <div className="flex items-start gap-3">
                      {selectedProduct.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedProduct.image_url}
                          alt=""
                          className="h-14 w-14 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <Sparkles className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {form.offer_title || "Título da oferta"}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {form.offer_message || "Mensagem da oferta…"}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs line-through text-muted-foreground">
                            {formatCurrency(Number(selectedProduct.price))}
                          </span>
                          <span className="text-sm font-bold text-foreground">
                            {formatCurrency(previewPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mt-3 w-full rounded-md py-2 text-sm font-semibold transition-opacity"
                      style={{
                        background: form.button_color,
                        color: form.button_text_color,
                      }}
                    >
                      {form.button_label || "Quero essa oferta"}
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Selecione um produto para visualizar o preview.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !form.name.trim() || !form.product_id}
          >
            {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar order bump"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PayMethodToggle({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition",
        checked
          ? "border-primary bg-primary/5 text-primary"
          : "border-border text-muted-foreground hover:bg-accent"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
      {checked && <Check className="h-3.5 w-3.5" />}
    </button>
  );
}

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
    <div className="flex items-center justify-between gap-3">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border bg-transparent p-0"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-24 font-mono text-xs"
        />
      </div>
    </div>
  );
}

export default OrderBumpFormDialog;