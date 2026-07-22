"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { cn, formatCurrency } from "@/lib/utils";
import type { Coupon, CouponFormData, Product } from "@/types";
import {
  TicketPercent,
  AlertCircle,
  Package,
  X,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ProductSelectorDialog } from "@/components/product-selector-dialog";

interface CouponFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon?: Coupon | null;
  onSave: (data: CouponFormData) => Promise<void>;
}

const EMPTY_FORM: CouponFormData = {
  code: "",
  name: "",
  description: "",
  status: "active",
  max_uses: 0,
  discount_value: 0,
  discount_type: "fixed",
  auto_apply: false,
  first_purchase_only: false,
  accumulate_with_promos: false,
  free_shipping: false,
  min_purchase_value: null,
  min_items_required: false,
  min_items_quantity: null,
  starts_at: "",
  expires_at: "",
  applies_to_all_products: true,
  product_ids: [],
};

function toDatetimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string {
  if (!value) return "";
  return new Date(value).toISOString();
}

export function CouponFormDialog({
  open,
  onOpenChange,
  coupon,
  onSave,
}: CouponFormDialogProps) {
  const { selectedStore } = useStore();
  const [form, setForm] = useState<CouponFormData>(EMPTY_FORM);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const isEditing = Boolean(coupon);

  useEffect(() => {
    if (open) {
      if (coupon) {
        setForm({
          code: coupon.code,
          name: coupon.name,
          description: coupon.description ?? "",
          status: coupon.status,
          max_uses: coupon.max_uses,
          discount_value: Number(coupon.discount_value) || 0,
          discount_type: coupon.discount_type,
          auto_apply: coupon.auto_apply,
          first_purchase_only: coupon.first_purchase_only,
          accumulate_with_promos: coupon.accumulate_with_promos,
          free_shipping: coupon.free_shipping,
          min_purchase_value: coupon.min_purchase_value ?? null,
          min_items_required: coupon.min_items_required,
          min_items_quantity: coupon.min_items_quantity ?? null,
          starts_at: toDatetimeLocal(coupon.starts_at),
          expires_at: toDatetimeLocal(coupon.expires_at),
          applies_to_all_products: coupon.applies_to_all_products,
          product_ids: coupon.products?.map((p) => p.id) ?? [],
        });
      } else {
        const now = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        setForm({
          ...EMPTY_FORM,
          starts_at: toDatetimeLocal(now.toISOString()),
          expires_at: toDatetimeLocal(nextMonth.toISOString()),
        });
      }
    }
  }, [open, coupon]);

  useEffect(() => {
    if (!open || !selectedStore) return;
    setLoadingProducts(true);
    api
      .get<Product[]>(`/stores/${selectedStore.id}/products`)
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Erro ao carregar produtos."))
      .finally(() => setLoadingProducts(false));
  }, [open, selectedStore]);

  const selectedProducts = useMemo(() => {
    if (form.applies_to_all_products) return [];
    const map = new Map(products.map((p) => [p.id, p]));
    return form.product_ids
      .map((id) => map.get(id))
      .filter((p): p is Product => Boolean(p));
  }, [products, form.product_ids, form.applies_to_all_products]);

  const updateForm = <K extends keyof CouponFormData>(
    key: K,
    value: CouponFormData[K]
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleToggleAllProducts = (checked: boolean) => {
    setForm((f) => ({
      ...f,
      applies_to_all_products: checked,
      product_ids: checked ? [] : f.product_ids,
    }));
  };

  const handleProductSelection = (ids: number[]) => {
    setForm((f) => ({ ...f, product_ids: ids }));
  };

  const removeProduct = (id: number) => {
    setForm((f) => ({
      ...f,
      product_ids: f.product_ids.filter((x) => x !== id),
    }));
  };

  const handleSubmit = async () => {
    if (!form.code.trim()) {
      toast.error("Informe o código do cupom.");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Informe o nome do cupom.");
      return;
    }
    if (!form.starts_at || !form.expires_at) {
      toast.error("Informe as datas de início e término.");
      return;
    }
    if (new Date(form.expires_at) <= new Date(form.starts_at)) {
      toast.error("A data de término deve ser posterior à de início.");
      return;
    }
    if (!form.applies_to_all_products && form.product_ids.length === 0) {
      toast.error("Selecione pelo menos um produto ou habilite todos os produtos.");
      return;
    }

    const payload: CouponFormData = {
      ...form,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description?.trim() || null,
      starts_at: fromDatetimeLocal(form.starts_at),
      expires_at: fromDatetimeLocal(form.expires_at),
      min_purchase_value: form.min_purchase_value
        ? Number(form.min_purchase_value)
        : null,
      min_items_quantity: form.min_items_required
        ? Number(form.min_items_quantity) || 1
        : null,
      discount_value: Number(form.discount_value) || 0,
      product_ids: form.applies_to_all_products ? [] : form.product_ids,
    };

    setSaving(true);
    try {
      await onSave(payload);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TicketPercent className="h-5 w-5 text-primary" />
              {isEditing ? "Editar cupom" : "Novo cupom"}
            </DialogTitle>
            <DialogDescription>
              Configure os dados, desconto e produtos elegíveis para o cupom.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-[1fr_360px]">
            {/* ─── Coluna esquerda ─── */}
            <div className="space-y-6">
              {/* Dados do cupom */}
              <section className="rounded-xl border bg-card p-5 space-y-4">
                <h3 className="font-medium">Dados do cupom</h3>
                <div className="space-y-2">
                  <Label htmlFor="coupon-code">
                    Código <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="coupon-code"
                    placeholder="Insira o código do cupom"
                    value={form.code}
                    onChange={(e) => updateForm("code", e.target.value.toUpperCase())}
                    autoFocus={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coupon-name">
                    Nome <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="coupon-name"
                    placeholder="Insira um nome para o cupom"
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coupon-description">
                    Descrição <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="coupon-description"
                    placeholder="Descreva o cupom"
                    rows={3}
                    value={form.description ?? ""}
                    onChange={(e) => updateForm("description", e.target.value)}
                  />
                </div>
              </section>

              {/* Outras informações */}
              <section className="rounded-xl border bg-card p-5 space-y-4">
                <h3 className="font-medium">Outras informações</h3>

                <div className="space-y-2">
                  <Label htmlFor="coupon-status">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      updateForm("status", v as "active" | "inactive")
                    }
                  >
                    <SelectTrigger id="coupon-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coupon-min-purchase">Valor mínimo de compra</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      R$
                    </span>
                    <Input
                      id="coupon-min-purchase"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0,00"
                      value={form.min_purchase_value ?? ""}
                      onChange={(e) =>
                        updateForm(
                          "min_purchase_value",
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coupon-starts">
                      Data de início <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="coupon-starts"
                        type="datetime-local"
                        value={form.starts_at}
                        onChange={(e) => updateForm("starts_at", e.target.value)}
                      />
                      <Calendar className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coupon-expires">
                      Data de término <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="coupon-expires"
                        type="datetime-local"
                        value={form.expires_at}
                        onChange={(e) => updateForm("expires_at", e.target.value)}
                      />
                      <Calendar className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox
                    id="coupon-min-items"
                    checked={form.min_items_required}
                    onCheckedChange={(v) =>
                      updateForm("min_items_required", Boolean(v))
                    }
                  />
                  <Label htmlFor="coupon-min-items" className="font-normal">
                    Exigir quantidade mínima de itens
                  </Label>
                </div>

                {form.min_items_required && (
                  <div className="space-y-2">
                    <Label htmlFor="coupon-min-items-qty">Quantidade mínima</Label>
                    <Input
                      id="coupon-min-items-qty"
                      type="number"
                      min={1}
                      value={form.min_items_quantity ?? ""}
                      onChange={(e) =>
                        updateForm(
                          "min_items_quantity",
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                    />
                  </div>
                )}
              </section>

              {/* Produtos */}
              <section className="rounded-xl border bg-card p-5 space-y-4">
                <h3 className="font-medium">
                  Produtos <span className="text-red-500">*</span>
                </h3>

                <div className="flex items-center gap-3">
                  <Checkbox
                    id="coupon-all-products"
                    checked={form.applies_to_all_products}
                    onCheckedChange={(v) => handleToggleAllProducts(Boolean(v))}
                  />
                  <Label htmlFor="coupon-all-products" className="font-normal">
                    Habilitado para todos produtos
                  </Label>
                </div>

                {!form.applies_to_all_products && (
                  <div className="space-y-3">
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={() => setSelectorOpen(true)}
                    >
                      Adicionar produto(s)
                    </Button>

                    {selectedProducts.length > 0 && (
                      <div className="space-y-2">
                        {selectedProducts.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center gap-3 rounded-lg border p-2"
                          >
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt=""
                                className="h-10 w-10 rounded-md object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {product.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(Number(product.price))}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeProduct(product.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* ─── Coluna direita ─── */}
            <div className="space-y-6">
              <section className="rounded-xl border bg-card p-5 space-y-4">
                <h3 className="font-medium">Quantidade e desconto</h3>

                <div className="space-y-2">
                  <Label htmlFor="coupon-max-uses">
                    Limite uso do cupom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="coupon-max-uses"
                    type="number"
                    min={0}
                    step="1"
                    value={form.max_uses}
                    onChange={(e) =>
                      updateForm("max_uses", Number(e.target.value) || 0)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    0 = uso ilimitado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coupon-discount">
                    Desconto <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      {form.discount_type === "fixed" && (
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          R$
                        </span>
                      )}
                      <Input
                        id="coupon-discount"
                        type="number"
                        min={0}
                        step={form.discount_type === "percent" ? 1 : 0.01}
                        max={form.discount_type === "percent" ? 100 : undefined}
                        value={form.discount_value}
                        onChange={(e) =>
                          updateForm(
                            "discount_value",
                            Number(e.target.value) || 0
                          )
                        }
                        className={form.discount_type === "fixed" ? "pl-9" : ""}
                      />
                      {form.discount_type === "percent" && (
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          %
                        </span>
                      )}
                    </div>
                    <div className="inline-flex rounded-md border bg-card p-0.5">
                      <button
                        type="button"
                        onClick={() => updateForm("discount_type", "fixed")}
                        className={cn(
                          "px-3 py-2 text-sm rounded-[5px] transition-colors font-semibold",
                          form.discount_type === "fixed"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent"
                        )}
                      >
                        R$
                      </button>
                      <button
                        type="button"
                        onClick={() => updateForm("discount_type", "percent")}
                        className={cn(
                          "px-3 py-2 text-sm rounded-[5px] transition-colors font-semibold",
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

                <div className="space-y-3 pt-2">
                  <ToggleRow
                    id="coupon-auto-apply"
                    label="Aplicação automática do cupom no carrinho de compras"
                    checked={form.auto_apply}
                    onChange={(v) => updateForm("auto_apply", v)}
                  />
                  {form.auto_apply && (
                    <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <p>
                        Atenção: apenas 1 cupom pode ter aplicação automática
                        ativa por vez. Para ativar essa regra em outro cupom,
                        será necessário desativá-la no cupom atual.
                      </p>
                    </div>
                  )}

                  <ToggleRow
                    id="coupon-first-purchase"
                    label="Apenas na primeira compra"
                    checked={form.first_purchase_only}
                    onChange={(v) => updateForm("first_purchase_only", v)}
                  />

                  <ToggleRow
                    id="coupon-accumulate"
                    label="Permite acumular com outras promoções ativas"
                    checked={form.accumulate_with_promos}
                    onChange={(v) => updateForm("accumulate_with_promos", v)}
                  />

                  <ToggleRow
                    id="coupon-free-shipping"
                    label="Ativar frete grátis"
                    checked={form.free_shipping}
                    onChange={(v) => updateForm("free_shipping", v)}
                  />
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
              disabled={saving}
            >
              {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProductSelectorDialog
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        selectedIds={form.product_ids}
        onConfirm={handleProductSelection}
      />
    </>
  );
}

function ToggleRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(Boolean(v))}
      />
      <Label htmlFor={id} className="cursor-pointer font-normal leading-tight">
        {label}
      </Label>
    </div>
  );
}

export default CouponFormDialog;
