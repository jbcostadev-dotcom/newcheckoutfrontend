"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";
import { ChevronDown, ChevronLeft, ChevronRight, Package, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ProductSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  onConfirm: (ids: number[]) => void;
  selectionMode?: "single" | "multiple";
  description?: string;
  variantSelection?: boolean;
  singleProductGroup?: boolean;
}

interface ProductGroup {
  key: string;
  name: string;
  imageUrl: string | null;
  productIds: number[];
  products: Product[];
  variantCount: number;
  minPrice: number;
  shopifyProductId?: string | null;
}

const PAGE_SIZE = 10;

export function ProductSelectorDialog({
  open,
  onOpenChange,
  selectedIds,
  onConfirm,
  selectionMode = "multiple",
  description = "Escolha os produtos que deseja adicionar.",
  variantSelection = false,
  singleProductGroup = false,
}: ProductSelectorDialogProps) {
  const { selectedStore } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [localSelected, setLocalSelected] = useState<number[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!open) return;
    // Reset the dialog draft whenever a new controlled open cycle starts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalSelected(selectedIds);
    setSearch("");
    setPage(1);
    setExpandedGroups(new Set());
  }, [open, selectedIds]);

  useEffect(() => {
    if (!open || !selectedStore) return;
    // Loading is part of synchronizing this controlled dialog with the selected store.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    api
      .get<Product[]>(`/stores/${selectedStore.id}/products`)
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Erro ao carregar produtos."))
      .finally(() => setLoading(false));
  }, [open, selectedStore]);

  const groups = useMemo<ProductGroup[]>(() => {
    const map = new Map<string, ProductGroup>();
    for (const product of products) {
      const key = product.shopify_product_id
        ? `shopify:${product.shopify_product_id}`
        : `plain:${product.id}`;
      const existing = map.get(key);
      if (existing) {
        existing.productIds.push(product.id);
        existing.products.push(product);
        existing.variantCount += 1;
        existing.minPrice = Math.min(existing.minPrice, Number(product.price));
        continue;
      }
      map.set(key, {
        key,
        name: product.parent_title || product.name,
        imageUrl: product.image_url ?? null,
        productIds: [product.id],
        products: [product],
        variantCount: 1,
        minPrice: Number(product.price),
        shopifyProductId: product.shopify_product_id ?? null,
      });
    }
    return Array.from(map.values());
  }, [products]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? groups.filter((group) => group.name.toLowerCase().includes(term)) : groups;
  }, [groups, search]);

  const lastPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const safePage = Math.min(page, lastPage);
    return filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  }, [filtered, page, lastPage]);

  const isGroupSelected = (group: ProductGroup) => {
    if (selectionMode === "single") return group.productIds.some((id) => localSelected.includes(id));
    return group.productIds.length > 0 && group.productIds.every((id) => localSelected.includes(id));
  };

  const isGroupPartial = (group: ProductGroup) => {
    if (selectionMode === "single") return false;
    const count = group.productIds.filter((id) => localSelected.includes(id)).length;
    return count > 0 && count < group.productIds.length;
  };

  const toggleGroup = (group: ProductGroup) => {
    if (selectionMode === "single") {
      const productId = group.productIds[0];
      setLocalSelected((prev) => (prev.includes(productId) ? [] : [productId]));
      return;
    }
    if (isGroupSelected(group)) {
      setLocalSelected((prev) => prev.filter((id) => !group.productIds.includes(id)));
      return;
    }
    setLocalSelected((prev) => {
      const base = singleProductGroup ? [] : prev;
      return Array.from(new Set([...base, ...group.productIds]));
    });
  };

  const toggleVariant = (group: ProductGroup, productId: number) => {
    setLocalSelected((prev) => {
      const base = singleProductGroup ? prev.filter((id) => group.productIds.includes(id)) : prev;
      return base.includes(productId)
        ? base.filter((id) => id !== productId)
        : [...base, productId];
    });
  };

  const toggleExpanded = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const allSelectedOnPage = paginated.length > 0 && paginated.every(isGroupSelected);
  const toggleAllOnPage = () => {
    const pageIds = paginated.flatMap((group) => group.productIds);
    setLocalSelected((prev) =>
      allSelectedOnPage
        ? prev.filter((id) => !pageIds.includes(id))
        : Array.from(new Set([...prev, ...pageIds]))
    );
  };

  const variantLabel = (product: Product) =>
    product.attributes?.length
      ? product.attributes.map((attribute) => attribute.value).join(" / ")
      : product.name;

  const handleConfirm = () => {
    onConfirm(localSelected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Selecionar produtos</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar produtos"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            {selectionMode === "multiple" && !singleProductGroup && (
              <Button variant="outline" size="sm" onClick={toggleAllOnPage} disabled={paginated.length === 0}>
                {allSelectedOnPage ? "Desmarcar todos" : "Marcar todos"}
              </Button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto rounded-lg border">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-16 w-full animate-pulse rounded-md bg-muted" />
                ))}
              </div>
            ) : paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                <Package className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Nenhum produto encontrado.</p>
              </div>
            ) : (
              <div className="divide-y">
                {paginated.map((group) => {
                  const selected = isGroupSelected(group);
                  const partial = isGroupPartial(group);
                  const expanded = expandedGroups.has(group.key);
                  return (
                    <div key={group.key}>
                      <div className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50">
                        <Checkbox
                          checked={selected}
                          data-state={partial ? "indeterminate" : selected ? "checked" : "unchecked"}
                          onCheckedChange={() => toggleGroup(group)}
                          aria-label={`Selecionar ${group.name}`}
                        />
                        {group.imageUrl ? (
                          // Product URLs are supplied dynamically by connected stores.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={group.imageUrl} alt="" className="h-12 w-12 rounded-md object-cover" />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => variantSelection && group.variantCount > 1 && toggleExpanded(group.key)}
                        >
                          <p className="truncate text-sm font-medium">{group.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {group.shopifyProductId ?? `#${group.productIds[0]}`} - {group.variantCount} {group.variantCount === 1 ? "variante" : "variantes"}
                          </p>
                        </button>
                        <div className="text-right text-sm font-medium">{formatCurrency(group.minPrice)}</div>
                        {variantSelection && group.variantCount > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleExpanded(group.key)}
                            aria-label={expanded ? "Ocultar variantes" : "Mostrar variantes"}
                          >
                            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                          </Button>
                        )}
                      </div>

                      {variantSelection && expanded && (
                        <div className="border-t bg-muted/20">
                          {group.products.map((product) => (
                            <label
                              key={product.id}
                              className="grid cursor-pointer grid-cols-[24px_1fr_auto] items-center gap-3 border-b px-4 py-2.5 last:border-b-0 hover:bg-muted/40"
                            >
                              <Checkbox
                                checked={localSelected.includes(product.id)}
                                onCheckedChange={() => toggleVariant(group, product.id)}
                              />
                              <span className="text-sm">{variantLabel(product)}</span>
                              <span className="flex items-center gap-5 text-xs text-muted-foreground">
                                <span>Disponível: {product.stock_quantity ?? 0}</span>
                                <span>{formatCurrency(Number(product.price))}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{page} de {lastPage}</span>
              <Button variant="outline" size="icon" disabled={page >= lastPage} onClick={() => setPage((value) => value + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {localSelected.length} variante{localSelected.length === 1 ? "" : "s"} selecionada{localSelected.length === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleConfirm} disabled={localSelected.length === 0}>Adicionar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ProductSelectorDialog;
