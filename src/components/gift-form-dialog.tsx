"use client";

import { useEffect, useMemo, useState } from "react";
import { Gift as GiftIcon, Package, X } from "lucide-react";
import { toast } from "sonner";

import { ProductSelectorDialog } from "@/components/product-selector-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Gift, GiftFormData, GiftRuleType, GiftScope, Product } from "@/types";

interface GiftFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gift?: Gift | null;
  onSave: (data: GiftFormData) => Promise<void>;
}

const toInputDate = (date: Date) => date.toISOString().slice(0, 10);

const emptyForm = (): GiftFormData => {
  const today = new Date();
  const end = new Date(today);
  end.setDate(end.getDate() + 30);
  return {
    name: "",
    product_ids: [],
    starts_at: toInputDate(today),
    expires_at: toInputDate(end),
    rule_type: "always",
    min_quantity: null,
    min_value: null,
    scope: "any",
    target_product_ids: [],
    is_active: true,
  };
};

const RULES: Array<{ value: GiftRuleType; title: string; description: string }> = [
  { value: "always", title: "Sempre mostrar", description: "O brinde será oferecido em todos os carrinhos elegíveis." },
  { value: "min_quantity", title: "Quantidade mínima de produtos", description: "O cliente precisa adicionar uma quantidade mínima de itens." },
  { value: "min_value", title: "Valor mínimo do carrinho", description: "O cliente precisa atingir um valor mínimo em produtos." },
];

const SCOPES: Array<{ value: GiftScope; title: string; description: string }> = [
  { value: "any", title: "Qualquer produto", description: "Disponível para qualquer produto no carrinho." },
  { value: "specific", title: "Produto específico", description: "Disponível quando um dos produtos selecionados estiver no carrinho." },
];

function ProductRows({
  items,
  target = false,
  onRemove,
}: {
  items: Product[];
  target?: boolean;
  onRemove: (id: number, target: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((product) => (
        <div key={product.id} className="flex items-center gap-3 rounded-lg border p-2.5">
          {product.image_url ? (
            // Product URLs are supplied dynamically by connected stores.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt="" className="h-10 w-10 rounded-md object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{product.parent_title || product.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {product.attributes?.map((attribute) => attribute.value).join(" / ") || "Variante única"}
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onRemove(product.id, target)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

export function GiftFormDialog({ open, onOpenChange, gift, onSave }: GiftFormDialogProps) {
  const { selectedStore } = useStore();
  const [form, setForm] = useState<GiftFormData>(emptyForm);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [giftSelectorOpen, setGiftSelectorOpen] = useState(false);
  const [targetSelectorOpen, setTargetSelectorOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Initialize the controlled dialog draft for the selected campaign.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(
      gift
        ? {
            name: gift.name,
            product_ids: gift.products.map((product) => product.id),
            starts_at: gift.starts_at.slice(0, 10),
            expires_at: gift.expires_at.slice(0, 10),
            rule_type: gift.rule_type,
            min_quantity: gift.min_quantity ?? null,
            min_value: gift.min_value == null ? null : Number(gift.min_value),
            scope: gift.scope,
            target_product_ids: gift.target_products.map((product) => product.id),
            is_active: gift.is_active,
          }
        : emptyForm()
    );
  }, [open, gift]);

  useEffect(() => {
    if (!open || !selectedStore) return;
    api
      .get<Product[]>(`/stores/${selectedStore.id}/products`)
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Erro ao carregar produtos."));
  }, [open, selectedStore]);

  const selectedProducts = useMemo(
    () => products.filter((product) => form.product_ids.includes(product.id)),
    [products, form.product_ids]
  );
  const selectedTargets = useMemo(
    () => products.filter((product) => form.target_product_ids.includes(product.id)),
    [products, form.target_product_ids]
  );

  const update = <K extends keyof GiftFormData>(key: K, value: GiftFormData[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const removeProduct = (id: number, target = false) => {
    const key = target ? "target_product_ids" : "product_ids";
    update(key, form[key].filter((productId) => productId !== id));
  };

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Informe o nome do brinde.");
    if (form.product_ids.length === 0) return toast.error("Selecione ao menos uma variante do brinde.");
    if (!form.starts_at || !form.expires_at || form.expires_at < form.starts_at) {
      return toast.error("Informe um período válido para o brinde.");
    }
    if (form.rule_type === "min_quantity" && (!form.min_quantity || form.min_quantity < 1)) {
      return toast.error("Informe a quantidade mínima de produtos.");
    }
    if (form.rule_type === "min_value" && (!form.min_value || form.min_value <= 0)) {
      return toast.error("Informe o valor mínimo do carrinho.");
    }
    if (form.scope === "specific" && form.target_product_ids.length === 0) {
      return toast.error("Selecione os produtos que ativam o brinde.");
    }

    setSaving(true);
    try {
      await onSave({ ...form, name: form.name.trim() });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GiftIcon className="h-5 w-5 text-primary" />
              {gift ? "Editar brinde" : "Novo brinde"}
            </DialogTitle>
            <DialogDescription>Configure o produto gratuito e as condições para exibi-lo no checkout.</DialogDescription>
          </DialogHeader>

          <div className="max-h-[68vh] space-y-6 overflow-y-auto pr-1">
            <section className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="gift-name">Nome do brinde</Label>
                <Input id="gift-name" placeholder="Ex: Brinde de Natal" value={form.name} onChange={(event) => update("name", event.target.value)} autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gift-start">Data de início</Label>
                <Input id="gift-start" type="date" value={form.starts_at} onChange={(event) => update("starts_at", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gift-end">Data de término</Label>
                <Input id="gift-end" type="date" value={form.expires_at} onChange={(event) => update("expires_at", event.target.value)} />
              </div>
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Produto a oferecer</h3>
                <p className="text-xs text-muted-foreground">Selecione as variantes que o cliente poderá escolher.</p>
              </div>
              <Button type="button" variant="secondary" className="w-full" onClick={() => setGiftSelectorOpen(true)}>Adicionar produto e variantes</Button>
              <ProductRows items={selectedProducts} onRemove={removeProduct} />
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Tipo de regra</h3>
              <div className="grid gap-2">
                {RULES.map((rule) => (
                  <button
                    key={rule.value}
                    type="button"
                    onClick={() => update("rule_type", rule.value)}
                    className={cn("rounded-lg border p-4 text-left transition-colors", form.rule_type === rule.value ? "border-primary bg-primary/5" : "hover:bg-muted/50")}
                  >
                    <span className="block text-sm font-semibold">{rule.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{rule.description}</span>
                  </button>
                ))}
              </div>
              {form.rule_type === "min_quantity" && (
                <div className="max-w-xs space-y-2">
                  <Label htmlFor="gift-min-quantity">Quantidade mínima</Label>
                  <Input id="gift-min-quantity" type="number" min={1} value={form.min_quantity ?? ""} onChange={(event) => update("min_quantity", Number(event.target.value) || null)} />
                </div>
              )}
              {form.rule_type === "min_value" && (
                <div className="max-w-xs space-y-2">
                  <Label htmlFor="gift-min-value">Valor mínimo</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                    <Input id="gift-min-value" type="number" min={0.01} step="0.01" className="pl-9" value={form.min_value ?? ""} onChange={(event) => update("min_value", Number(event.target.value) || null)} />
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Escopo do brinde</h3>
                <p className="text-xs text-muted-foreground">Defina quais produtos tornam a campanha visível.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {SCOPES.map((scope) => (
                  <button
                    key={scope.value}
                    type="button"
                    onClick={() => update("scope", scope.value)}
                    className={cn("rounded-lg border p-5 text-left transition-colors", form.scope === scope.value ? "border-primary bg-primary/5" : "hover:bg-muted/50")}
                  >
                    <span className="block text-sm font-semibold">{scope.title}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{scope.description}</span>
                  </button>
                ))}
              </div>
              {form.scope === "specific" && (
                <div className="space-y-3 rounded-lg border p-4">
                  <Button type="button" variant="secondary" className="w-full" onClick={() => setTargetSelectorOpen(true)}>Selecionar produtos do escopo</Button>
                  <ProductRows items={selectedTargets} target onRemove={removeProduct} />
                </div>
              )}
            </section>

            <section className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-semibold">Brinde ativo</p>
                <p className="text-xs text-muted-foreground">A campanha só será exibida dentro do período configurado.</p>
              </div>
              <Switch checked={form.is_active} onCheckedChange={(value) => update("is_active", value)} />
            </section>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={submit} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProductSelectorDialog
        open={giftSelectorOpen}
        onOpenChange={setGiftSelectorOpen}
        selectedIds={form.product_ids}
        onConfirm={(ids) => update("product_ids", ids)}
        description="Selecione um produto e marque as variantes disponíveis como brinde."
        variantSelection
        singleProductGroup
      />
      <ProductSelectorDialog
        open={targetSelectorOpen}
        onOpenChange={setTargetSelectorOpen}
        selectedIds={form.target_product_ids}
        onConfirm={(ids) => update("target_product_ids", ids)}
        description="Selecione as variantes que ativam a campanha quando estiverem no carrinho."
        variantSelection
      />
    </>
  );
}
