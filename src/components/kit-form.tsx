"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Minus,
  Package,
  Plus,
  Save,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { KitProductPicker } from "@/components/kit-product-picker";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Kit, KitFormData, Product } from "@/types";

interface KitFormProps {
  kitId?: string;
}

interface KitItem {
  product: Product;
  quantity: number;
}

function variantLabel(product: Product): string | null {
  if (!product.attributes?.length) return product.sku || null;
  return product.attributes
    .map((attribute) => `${attribute.name}: ${attribute.value}`)
    .join(" / ");
}

export function KitForm({ kitId }: KitFormProps) {
  const router = useRouter();
  const { selectedStore } = useStore();
  const isEditing = Boolean(kitId);
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [items, setItems] = useState<KitItem[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [nameError, setNameError] = useState("");
  const [productsError, setProductsError] = useState("");

  useEffect(() => {
    if (!isEditing || !kitId || !selectedStore) return;

    const controller = new AbortController();
    void Promise.resolve()
      .then(() => {
        setLoading(true);
        return api.get<Kit>(`/stores/${selectedStore.id}/kits/${kitId}`, {
          signal: controller.signal,
        });
      })
      .then((kit) => {
        setName(kit.name);
        setIsActive(kit.is_active);
        setItems(
          kit.products.map((product) => ({
            product,
            quantity: Math.max(1, Number(product.pivot.quantity) || 1),
          }))
        );
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        toast.error("Não foi possível carregar o kit.");
        router.replace("/dashboard/kits");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [isEditing, kitId, router, selectedStore]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + Number(item.product.price) * Math.max(1, item.quantity),
        0
      ),
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const handleProductSelection = (products: Product[]) => {
    setItems((current) =>
      products.map((product) => ({
        product,
        quantity:
          current.find((item) => item.product.id === product.id)?.quantity ?? 1,
      }))
    );
    setProductsError("");
  };

  const updateQuantity = (productId: number, quantity: number) => {
    const safeQuantity = Math.min(99, Math.max(1, quantity || 1));
    setItems((current) =>
      current.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: safeQuantity }
          : item
      )
    );
  };

  const removeProduct = (productId: number) => {
    setItems((current) =>
      current.filter((item) => item.product.id !== productId)
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    let valid = true;

    if (!trimmedName) {
      setNameError("Informe o nome do kit.");
      valid = false;
    }
    if (items.length === 0) {
      setProductsError("Adicione pelo menos um produto ao kit.");
      valid = false;
    } else if (itemCount > 100) {
      setProductsError("O kit pode ter no máximo 100 itens no total.");
      valid = false;
    }
    if (!valid || !selectedStore) return;

    const payload: KitFormData = {
      name: trimmedName,
      is_active: isActive,
      products: items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
    };

    setSaving(true);
    try {
      if (isEditing && kitId) {
        await api.put(`/stores/${selectedStore.id}/kits/${kitId}`, payload);
        toast.success("Kit atualizado com sucesso.");
      } else {
        await api.post(`/stores/${selectedStore.id}/kits`, payload);
        toast.success("Kit criado com sucesso.");
      }
      router.push("/dashboard/kits");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar o kit."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" aria-label="Carregando kit">
        <Skeleton className="h-16 w-full max-w-md" />
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={isEditing ? "Editar Kit" : "Novo Kit"}
        description="Monte um carrinho pronto com vários produtos e quantidades."
      />

      <form onSubmit={handleSubmit} className="mt-6 space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-3">
              <Switch
                id="kit-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <div>
                <Label htmlFor="kit-active" className="cursor-pointer font-semibold">
                  Kit ativo
                </Label>
                <p className="text-sm text-muted-foreground">
                  Kits inativos continuam salvos, mas não devem ser divulgados.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kit-name">
                Nome do kit <span aria-hidden="true">*</span>
              </Label>
              <Input
                id="kit-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (event.target.value.trim()) setNameError("");
                }}
                placeholder="Digite o nome do kit"
                maxLength={255}
                aria-invalid={Boolean(nameError)}
                aria-describedby={nameError ? "kit-name-error" : undefined}
                autoFocus={!isEditing}
              />
              {nameError && (
                <p id="kit-name-error" className="text-sm text-destructive">
                  {nameError}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-col items-stretch justify-between gap-4 space-y-0 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <CardTitle className="text-base">Produtos do kit</CardTitle>
              <p className="text-sm text-muted-foreground">
                Adicione produtos e defina a quantidade de cada item.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setPickerOpen(true)}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Adicionar produto
            </Button>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20 px-6 text-center transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">Nenhum produto adicionado</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    Clique para selecionar os produtos deste carrinho.
                  </span>
                </span>
              </button>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <div className="divide-y">
                  {items.map(({ product, quantity }) => {
                    const detail = variantLabel(product);
                    return (
                      <div
                        key={product.id}
                        className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {product.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.image_url}
                              alt=""
                              className="h-12 w-12 shrink-0 rounded-lg border object-cover"
                            />
                          ) : (
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-muted">
                              <Package className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {product.parent_title || product.name}
                            </p>
                            {detail && (
                              <p className="truncate text-xs text-muted-foreground">
                                {detail}
                              </p>
                            )}
                            <p className="mt-1 text-sm text-muted-foreground sm:hidden">
                              {formatCurrency(Number(product.price))} cada
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2" aria-label={`Quantidade de ${product.name}`}>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            disabled={quantity <= 1}
                            aria-label="Diminuir quantidade"
                          >
                            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                          <Input
                            type="number"
                            min={1}
                            max={99}
                            value={quantity}
                            onChange={(event) =>
                              updateQuantity(product.id, Number(event.target.value))
                            }
                            className="h-8 w-16 px-1 text-center"
                            aria-label="Quantidade"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            disabled={quantity >= 99}
                            aria-label="Aumentar quantidade"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              {formatCurrency(Number(product.price) * quantity)}
                            </p>
                            <p className="hidden text-xs text-muted-foreground sm:block">
                              {formatCurrency(Number(product.price))} cada
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeProduct(product.id)}
                            aria-label={`Remover ${product.name}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-col gap-2 border-t bg-muted/20 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-muted-foreground">
                    {items.length} {items.length === 1 ? "produto" : "produtos"}, {itemCount} {itemCount === 1 ? "item" : "itens"}
                  </span>
                  <span className="font-semibold">Total: {formatCurrency(subtotal)}</span>
                </div>
              </div>
            )}
            {productsError && (
              <p className="mt-2 text-sm text-destructive" role="alert">
                {productsError}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/kits")}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving
              ? "Salvando..."
              : isEditing
                ? "Salvar alterações"
                : "Criar kit"}
          </Button>
        </div>
      </form>

      {pickerOpen && (
        <KitProductPicker
          open
          onOpenChange={setPickerOpen}
          selectedIds={items.map((item) => item.product.id)}
          onConfirm={handleProductSelection}
        />
      )}
    </>
  );
}
