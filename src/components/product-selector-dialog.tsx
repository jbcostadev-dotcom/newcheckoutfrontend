"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";
import { Search, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProductSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  onConfirm: (ids: number[]) => void;
}

interface ProductGroup {
  key: string;
  name: string;
  imageUrl: string | null;
  productIds: number[];
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
}: ProductSelectorDialogProps) {
  const { selectedStore } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [localSelected, setLocalSelected] = useState<number[]>([]);

  useEffect(() => {
    if (open) {
      setLocalSelected(selectedIds);
      setSearch("");
      setPage(1);
    }
  }, [open, selectedIds]);

  useEffect(() => {
    if (!open || !selectedStore) return;
    setLoading(true);
    api
      .get<Product[]>(`/stores/${selectedStore.id}/products`)
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        toast.error("Erro ao carregar produtos.");
      })
      .finally(() => setLoading(false));
  }, [open, selectedStore]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const groups = useMemo<ProductGroup[]>(() => {
    const map = new Map<string, ProductGroup>();
    for (const p of products) {
      if (p.shopify_product_id) {
        const key = `shopify:${p.shopify_product_id}`;
        const existing = map.get(key);
        if (existing) {
          existing.productIds.push(p.id);
          existing.variantCount += 1;
          existing.minPrice = Math.min(existing.minPrice, Number(p.price));
        } else {
          map.set(key, {
            key,
            name: p.parent_title || p.name,
            imageUrl: p.image_url ?? null,
            productIds: [p.id],
            variantCount: 1,
            minPrice: Number(p.price),
            shopifyProductId: p.shopify_product_id,
          });
        }
      } else {
        map.set(`plain:${p.id}`, {
          key: `plain:${p.id}`,
          name: p.name,
          imageUrl: p.image_url ?? null,
          productIds: [p.id],
          variantCount: 1,
          minPrice: Number(p.price),
          shopifyProductId: null,
        });
      }
    }
    return Array.from(map.values());
  }, [products]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(term));
  }, [groups, search]);

  const lastPage = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    [filtered]
  );

  const paginated = useMemo(() => {
    const safePage = Math.min(page, lastPage);
    return filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  }, [filtered, page, lastPage]);

  const isGroupSelected = (group: ProductGroup) =>
    group.productIds.length > 0 &&
    group.productIds.every((id) => localSelected.includes(id));

  const isGroupPartial = (group: ProductGroup) => {
    const selectedCount = group.productIds.filter((id) =>
      localSelected.includes(id)
    ).length;
    return selectedCount > 0 && selectedCount < group.productIds.length;
  };

  const allSelectedOnPage =
    paginated.length > 0 && paginated.every((g) => isGroupSelected(g));

  const toggleGroup = (group: ProductGroup) => {
    if (isGroupSelected(group)) {
      setLocalSelected((prev) =>
        prev.filter((id) => !group.productIds.includes(id))
      );
    } else {
      setLocalSelected((prev) =>
        Array.from(new Set([...prev, ...group.productIds]))
      );
    }
  };

  const toggleAllOnPage = () => {
    const pageIds = paginated.flatMap((g) => g.productIds);
    if (allSelectedOnPage) {
      setLocalSelected((prev) =>
        prev.filter((id) => !pageIds.includes(id))
      );
    } else {
      setLocalSelected((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleConfirm = () => {
    onConfirm(localSelected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Selecionar produtos</DialogTitle>
          <DialogDescription>
            Escolha os produtos que poderão usar este cupom.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar produtos"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllOnPage}
              disabled={paginated.length === 0}
            >
              {allSelectedOnPage ? "Desmarcar todos" : "Marcar todos"}
            </Button>
          </div>

          <div className="max-h-[360px] overflow-y-auto rounded-lg border">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 w-full animate-pulse rounded-md bg-muted"
                  />
                ))}
              </div>
            ) : paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                <Package className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {filtered.length === 0
                    ? "Nenhum produto encontrado."
                    : "Nenhum produto na página."}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {paginated.map((group) => {
                  const selected = isGroupSelected(group);
                  const partial = isGroupPartial(group);
                  return (
                    <label
                      key={group.key}
                      className="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selected}
                        data-state={partial ? "indeterminate" : selected ? "checked" : "unchecked"}
                        onCheckedChange={() => toggleGroup(group)}
                      />
                      {group.imageUrl ? (
                        <img
                          src={group.imageUrl}
                          alt=""
                          className="h-12 w-12 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {group.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {group.shopifyProductId ?? `#${group.productIds[0]}`}{" "}
                          · {group.variantCount}{" "}
                          {group.variantCount === 1 ? "variante" : "variantes"}
                        </p>
                      </div>
                      <div className="text-sm font-medium">
                        {formatCurrency(group.minPrice)}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} de {lastPage}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {localSelected.length} produto
            {localSelected.length === 1 ? "" : "s"} selecionado
            {localSelected.length === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm}>Adicionar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ProductSelectorDialog;
