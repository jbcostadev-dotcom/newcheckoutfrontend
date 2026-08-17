"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Package, Search } from "lucide-react";
import { toast } from "sonner";

import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { cn, formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";
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
import { Skeleton } from "@/components/ui/skeleton";

interface KitProductPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  onConfirm: (products: Product[]) => void;
}

function productDetail(product: Product): string {
  const attributes = product.attributes
    ?.map((attribute) => attribute.value)
    .filter(Boolean)
    .join(" / ");

  return attributes || product.sku || `Produto #${product.id}`;
}

export function KitProductPicker({
  open,
  onOpenChange,
  selectedIds,
  onConfirm,
}: KitProductPickerProps) {
  const { selectedStore } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [localSelected, setLocalSelected] = useState<number[]>(selectedIds);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !selectedStore) return;

    const controller = new AbortController();
    void Promise.resolve()
      .then(() => {
        setLoading(true);
        return api.get<Product[]>(`/stores/${selectedStore.id}/products`, {
          signal: controller.signal,
        });
      })
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        toast.error("Não foi possível carregar os produtos.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [open, selectedStore]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const sorted = [...products].sort((a, b) =>
      (a.parent_title || a.name).localeCompare(b.parent_title || b.name, "pt-BR")
    );

    if (!term) return sorted;

    return sorted.filter((product) => {
      const searchable = [
        product.parent_title,
        product.name,
        product.sku,
        product.attributes?.map((attribute) => attribute.value).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      return searchable.includes(term);
    });
  }, [products, search]);

  const toggleProduct = (product: Product) => {
    if (!product.is_active && !localSelected.includes(product.id)) return;
    setLocalSelected((current) =>
      current.includes(product.id)
        ? current.filter((id) => id !== product.id)
        : [...current, product.id]
    );
  };

  const handleConfirm = () => {
    const selected = localSelected
      .map((id) => products.find((product) => product.id === id))
      .filter((product): product is Product => Boolean(product));
    onConfirm(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar produtos</DialogTitle>
          <DialogDescription>
            Escolha os produtos que farão parte deste kit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, SKU ou variante"
              className="pl-9"
              aria-label="Buscar produtos"
            />
          </div>

          <div className="max-h-[420px] overflow-y-auto rounded-xl border">
            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <Package className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium">Nenhum produto encontrado</p>
                <p className="text-sm text-muted-foreground">
                  Tente outro termo ou cadastre um produto primeiro.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredProducts.map((product) => {
                  const selected = localSelected.includes(product.id);
                  const disabled = !product.is_active && !selected;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => toggleProduct(product)}
                      disabled={disabled}
                      className={cn(
                        "flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                        selected && "bg-primary/5",
                        disabled && "cursor-not-allowed opacity-50"
                      )}
                      aria-pressed={selected}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input bg-background"
                        )}
                      >
                        {selected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                      </span>

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

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {product.parent_title || product.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {productDetail(product)}
                          {!product.is_active ? " (inativo)" : ""}
                        </span>
                      </span>
                      <span className="text-sm font-semibold">
                        {formatCurrency(Number(product.price))}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {localSelected.length} {localSelected.length === 1 ? "produto" : "produtos"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={loading}>
              Adicionar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
