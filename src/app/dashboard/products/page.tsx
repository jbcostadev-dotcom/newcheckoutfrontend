"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";
import {
  Package,
  Plus,
  Copy,
  Trash2,
  ShoppingCart,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";

const PAGE_SIZE = 50;

export default function ProductsPage() {
  const { selectedStore } = useStore();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchProducts = async () => {
    if (!selectedStore) return;
    setLoading(true);
    try {
      const data = await api.get<Product[]>(
        `/stores/${selectedStore.id}/products`
      );
      setProducts(data);
    } catch {
      toast.error("Erro ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  // Agrupa variantes do mesmo produto Shopify. Produtos criados manualmente
  // (sem shopify_product_id) ficam como item próprio.
  type GroupedItem =
    | { kind: "plain"; product: Product }
    | {
        kind: "shopify";
        shopifyProductId: string;
        parentTitle: string;
        imageUrl: string | null;
        variants: Product[];
      };

  const groups: GroupedItem[] = useMemo(() => {
    const map = new Map<string, GroupedItem>();
    const order: GroupedItem[] = [];

    for (const p of products) {
      if (p.shopify_product_id) {
        const key = `s:${p.shopify_product_id}`;
        let g = map.get(key) as
          | Extract<GroupedItem, { kind: "shopify" }>
          | undefined;
        if (!g) {
          g = {
            kind: "shopify",
            shopifyProductId: p.shopify_product_id,
            parentTitle: p.parent_title || p.name,
            imageUrl: p.image_url ?? null,
            variants: [],
          };
          map.set(key, g);
          order.push(g);
        }
        g.variants.push(p);
      } else {
        order.push({ kind: "plain", product: p });
      }
    }
    return order;
  }, [products]);

  const groupMatchesSearch = (g: GroupedItem, term: string): boolean => {
    if (!term.trim()) return true;
    const t = term.toLowerCase();

    if (g.kind === "plain") {
      const p = g.product;
      if (p.name.toLowerCase().includes(t)) return true;
      if (p.parent_title?.toLowerCase().includes(t)) return true;
      return (
        p.attributes?.some(
          (a) =>
            a.name.toLowerCase().includes(t) ||
            a.value.toLowerCase().includes(t)
        ) ?? false
      );
    }

    if (g.parentTitle.toLowerCase().includes(t)) return true;
    return g.variants.some((v) => {
      if (v.name.toLowerCase().includes(t)) return true;
      if (v.parent_title?.toLowerCase().includes(t)) return true;
      return (
        v.attributes?.some(
          (a) =>
            a.name.toLowerCase().includes(t) ||
            a.value.toLowerCase().includes(t)
        ) ?? false
      );
    });
  };

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => groupMatchesSearch(g, search));
  }, [groups, search]);

  const lastPage = useMemo(
    () => Math.max(1, Math.ceil(filteredGroups.length / PAGE_SIZE)),
    [filteredGroups]
  );

  useEffect(() => {
    setPage((p) => Math.min(p, lastPage));
  }, [lastPage]);

  const paginatedGroups = useMemo(() => {
    const safePage = Math.min(page, lastPage);
    return filteredGroups.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  }, [filteredGroups, page, lastPage]);

  const activeInPage = useMemo(() => {
    const ids: number[] = [];
    for (const g of paginatedGroups) {
      if (g.kind === "plain") {
        if (g.product.is_active) ids.push(g.product.id);
      } else {
        for (const v of g.variants) {
          if (v.is_active) ids.push(v.id);
        }
      }
    }
    return ids;
  }, [paginatedGroups]);

  const allSelected =
    activeInPage.length > 0 &&
    activeInPage.every((id) => selectedIds.includes(id));

  const toggleGroup = (shopifyProductId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(shopifyProductId)) {
        next.delete(shopifyProductId);
      } else {
        next.add(shopifyProductId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !activeInPage.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...activeInPage])));
    }
  };

  const toggleOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const copyUrl = (url: string) => {
    if (!url) {
      toast.error("Este produto ainda não possui link gerado.");
      return;
    }
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  const handleCopyProductLink = (product: Product) => {
    copyUrl(product.checkout_url ?? "");
  };

  const handleCopyCartLink = () => {
    if (selectedIds.length === 0) return;
    const base = selectedIds[0];
    let url: string | null = null;

    const product = products.find((p) => p.id === base);
    if (product?.checkout_url) {
      url = product.checkout_url.replace(
        /products=\d+/,
        `products=${selectedIds.join(",")}`
      );
    }

    // Fallback: monta manualmente a partir do domínio da loja (raro — backend gerou).
    if (!url) {
      const subdomain = selectedStore?.subdomain;
      const customDomain = selectedStore?.custom_domain;
      const checkoutAppDomain =
        process.env.NEXT_PUBLIC_CHECKOUT_APP_DOMAIN ||
        `checkout.${process.env.NEXT_PUBLIC_CHECKOUT_BASE_DOMAIN || "bersenker.shop"}`;
      if (customDomain) {
        url = `https://${customDomain}/checkout?products=${selectedIds.join(",")}`;
      } else if (subdomain) {
        url = `https://${checkoutAppDomain}/${subdomain}/checkout?products=${selectedIds.join(",")}`;
      }
    }

    if (!url) {
      toast.error("Não foi possível montar o link do carrinho.");
      return;
    }
    navigator.clipboard.writeText(url);
    toast.success(`Link do carrinho (${selectedIds.length}) copiado!`);
  };

  const handleSyncShopify = async () => {
    if (!selectedStore) return;
    setSyncing(true);
    try {
      await api.post(`/stores/${selectedStore.id}/shopify/sync`);
      toast.success("Sincronização de produtos Shopify iniciada!");
      // Recarrega lista após 2s para dar tempo do job processar (queue sync).
      setTimeout(() => {
        fetchProducts();
      }, 1500);
    } catch {
      toast.error("Erro ao iniciar sincronização.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (productId: number) => {
    if (!selectedStore || !confirm("Remover este produto?")) return; // eslint-disable-line no-alert
    try {
      await api.delete(`/stores/${selectedStore.id}/products/${productId}`);
      toast.success("Produto removido!");
      setSelectedIds((prev) => prev.filter((id) => id !== productId));
      fetchProducts();
    } catch {
      toast.error("Erro ao remover produto.");
    }
  };

  const getAttributeNames = (attributes?: Product["attributes"]) => {
    if (!attributes || attributes.length === 0) return null;
    return attributes.map((a) => a.name).join(" / ");
  };

  const getGroupAttributeNames = (variants: Product[]) => {
    for (const v of variants) {
      const names = getAttributeNames(v.attributes);
      if (names) return names;
    }
    return null;
  };

  const formatStock = (quantity?: number | null) => {
    if (quantity === null || quantity === undefined) return "—";
    return quantity;
  };

  const getGroupStock = (variants: Product[]) => {
    let total = 0;
    let hasStock = false;
    for (const v of variants) {
      if (v.stock_quantity !== null && v.stock_quantity !== undefined) {
        total += v.stock_quantity;
        hasStock = true;
      }
    }
    return hasStock ? total : null;
  };

  return (
    <>
      <PageHeader
        title="Produtos"
        description={`Gerencie os produtos de ${selectedStore?.name ?? "sua loja"}.`}
        actions={
          <div className="flex items-center gap-2">
            {selectedStore?.shopify_domain && (
              <Button
                variant="outline"
                onClick={handleSyncShopify}
                disabled={syncing}
                title="Importar/atualizar produtos do Shopify"
              >
                <RefreshCw
                  className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
                />
                {syncing ? "Importando..." : "Atualizar Shopify"}
              </Button>
            )}
            {selectedIds.length > 0 && (
              <Button
                variant="secondary"
                onClick={handleCopyCartLink}
                title="Copia link do checkout com os produtos selecionados"
              >
                <ShoppingCart className="h-4 w-4" />
                Copiar Carrinho ({selectedIds.length})
              </Button>
            )}
            <Button onClick={() => router.push("/dashboard/products/create")}>
              <Plus className="h-4 w-4" /> Novo Produto
            </Button>
          </div>
        }
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="mt-6 rounded-xl border">
        {loading ? (
          <div className="space-y-4 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : paginatedGroups.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
                <TableHead className="w-12">Img</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-40">Atributos</TableHead>
                <TableHead className="w-24">Estoque</TableHead>
                <TableHead className="w-12">Link</TableHead>
                <TableHead className="w-12 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedGroups.flatMap((g) => {
                if (g.kind === "plain") {
                  const product = g.product;
                  const selected = selectedIds.includes(product.id);
                  return (
                    <TableRow
                      key={product.id}
                      data-state={selected ? "selected" : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => {
                            if (product.is_active) toggleOne(product.id);
                          }}
                          disabled={!product.is_active}
                          aria-label={`Selecionar ${product.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt=""
                            className="h-9 w-9 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground max-w-[280px] truncate">
                              {product.description || "Sem descrição"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(Number(product.price))}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={product.is_active ? "success" : "secondary"}
                        >
                          {product.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {getAttributeNames(product.attributes) ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {formatStock(product.stock_quantity)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopyProductLink(product)}
                          title="Copiar link direto"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(product.id)}
                          title="Remover"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                }

                // Grupo Shopify com várias variantes.
                const isExpanded = expandedGroups.has(g.shopifyProductId);
                const activeVariants = g.variants.filter((v) => v.is_active);
                const groupActive = activeVariants.length > 0;

                return (
                  <Fragment key={`group-${g.shopifyProductId}`}>
                    <TableRow
                      data-state={isExpanded ? "selected" : undefined}
                      onClick={() => toggleGroup(g.shopifyProductId)}
                      style={{ cursor: "pointer" }}
                      className="hover:bg-muted/40"
                    >
                      <TableCell>
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        />
                      </TableCell>
                      <TableCell>
                        {g.imageUrl ? (
                          <img
                            src={g.imageUrl}
                            alt=""
                            className="h-9 w-9 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium">{g.parentTitle}</p>
                            <p className="text-xs text-muted-foreground">
                              {g.variants.length}{" "}
                              {g.variants.length === 1
                                ? "variante"
                                : "variantes"}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="border-[#95bf47]/40 text-[#95bf47]"
                            title="Vem do Shopify"
                          >
                            Shopify
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        —
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={groupActive ? "success" : "secondary"}
                        >
                          {groupActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {getGroupAttributeNames(g.variants) ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {formatStock(getGroupStock(g.variants))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">—</span>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        Grupo
                      </TableCell>
                    </TableRow>

                    {isExpanded &&
                      g.variants.map((variant) => {
                        const selected = selectedIds.includes(variant.id);
                        return (
                          <TableRow
                            key={variant.id}
                            data-state={selected ? "selected" : undefined}
                            className="bg-muted/20"
                          >
                            <TableCell className="pl-8">
                              <Checkbox
                                checked={selected}
                                onCheckedChange={() => {
                                  if (variant.is_active) toggleOne(variant.id);
                                }}
                                disabled={!variant.is_active}
                                aria-label={`Selecionar ${variant.name}`}
                              />
                            </TableCell>
                            <TableCell />
                            <TableCell>
                              <div className="flex flex-wrap items-center gap-1.5 pl-4">
                                {variant.attributes &&
                                variant.attributes.length > 0 ? (
                                  variant.attributes.map((attr, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center rounded-md border bg-background px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                                    >
                                      {attr.name}: {attr.value}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs italic text-muted-foreground">
                                    Variante única
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(Number(variant.price))}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  variant.is_active ? "success" : "secondary"
                                }
                              >
                                {variant.is_active ? "Ativo" : "Inativo"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground">
                                {getAttributeNames(variant.attributes) ?? "—"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground">
                                {formatStock(variant.stock_quantity)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleCopyProductLink(variant)}
                                title="Copiar link direto"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(variant.id)}
                                title="Remover"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhum produto cadastrado"
            description={`Comece adicionando um produto à ${selectedStore?.name ?? "sua loja"}.`}
            action={
              <Button onClick={() => router.push("/dashboard/products/create")}>
                <Plus className="h-4 w-4" /> Criar primeiro produto
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Package}
            title="Nenhum produto encontrado"
            description="Tente ajustar o termo de busca."
          />
        )}
      </div>

      {/* Paginação */}
      {lastPage > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} de {lastPage}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Próximo <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
}
