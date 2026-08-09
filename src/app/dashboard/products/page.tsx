"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
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
  Eye,
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
import { ProductDetailsDialog } from "@/components/product-details-dialog";

const PAGE_SIZE = 25;

interface CheckoutUrlStore {
  id: string | number;
  custom_domain?: string | null;
  subdomain?: string | null;
}

type ProductSummary = Product & {
  description_excerpt?: string | null;
};

type ApiGroupedItem =
  | { kind: "plain"; group_key: string; product: ProductSummary }
  | {
      kind: "shopify";
      group_key: string;
      shopify_product_id: string;
      parent_title: string;
      image_url: string | null;
      variants: ProductSummary[];
    };

interface PaginatedProductsResponse {
  data: ApiGroupedItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

type GroupedItem =
  | { kind: "plain"; product: ProductSummary }
  | {
      kind: "shopify";
      shopifyProductId: string;
      parentTitle: string;
      imageUrl: string | null;
      variants: ProductSummary[];
    };

function buildCheckoutUrl(store: CheckoutUrlStore, productIds: (string | number)[]): string {
  const customDomain = store.custom_domain;
  const checkoutAppDomain =
    process.env.NEXT_PUBLIC_CHECKOUT_APP_DOMAIN ||
    `checkout.${process.env.NEXT_PUBLIC_CHECKOUT_BASE_DOMAIN || "bersenker.shop"}`;

  const ids = productIds.map(String).join(",");

  if (customDomain) {
    return `https://${customDomain}/checkout?products=${ids}`;
  }

  return `https://${checkoutAppDomain}/store/${store.id}/checkout?products=${ids}`;
}

export default function ProductsPage() {
  const { selectedStore } = useStore();
  const router = useRouter();
  const [groups, setGroups] = useState<GroupedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const detailsRequestRef = useRef(0);
  const loadedStoreIdRef = useRef<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search]);

  // A API pagina por produto-pai e mantem as variantes Shopify na mesma pagina.
  useEffect(() => {
    if (!selectedStore) return;

    const controller = new AbortController();
    const storeId = String(selectedStore.id);
    const storeChanged = loadedStoreIdRef.current !== storeId;
    const requestedPage = storeChanged ? 1 : page;

    const loadProducts = async () => {
      setLoading(true);
      const params = new URLSearchParams({
        view: "grouped",
        page: String(requestedPage),
        per_page: String(PAGE_SIZE),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);

      try {
        const response = await api.get<PaginatedProductsResponse>(
          `/stores/${selectedStore.id}/products?${params.toString()}`,
          { signal: controller.signal }
        );

        if (requestedPage > response.meta.last_page) {
          setPage(Math.max(1, response.meta.last_page));
          return;
        }

        if (storeChanged) {
          loadedStoreIdRef.current = storeId;
          setPage(1);
          setSelectedIds([]);
          setExpandedGroups(new Set());
        }

        setGroups(
          response.data.map((group) =>
            group.kind === "plain"
              ? { kind: "plain", product: group.product }
              : {
                  kind: "shopify",
                  shopifyProductId: group.shopify_product_id,
                  parentTitle: group.parent_title,
                  imageUrl: group.image_url,
                  variants: group.variants,
                }
          )
        );
        setLastPage(Math.max(1, response.meta.last_page));
        setTotal(response.meta.total);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        toast.error("Erro ao carregar produtos.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadProducts();
    return () => controller.abort();
  }, [selectedStore, page, debouncedSearch, reloadKey]);

  const paginatedGroups = useMemo(
    () => (selectedStore ? groups : []),
    [selectedStore, groups]
  );

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
    if (!selectedStore) {
      toast.error("Selecione uma loja para copiar o link.");
      return;
    }
    const url = buildCheckoutUrl(selectedStore, [product.id]);
    copyUrl(url);
  };

  const handleCopyCartLink = () => {
    if (selectedIds.length === 0) return;
    if (!selectedStore) {
      toast.error("Selecione uma loja para copiar o link.");
      return;
    }

    const url = buildCheckoutUrl(selectedStore, selectedIds);
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
        setReloadKey((key) => key + 1);
      }, 1500);
    } catch {
      toast.error("Erro ao iniciar sincronização.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (productId: number) => {
    if (!selectedStore || !confirm("Remover este produto?")) return;
    try {
      await api.delete(`/stores/${selectedStore.id}/products/${productId}`);
      toast.success("Produto removido!");
      setSelectedIds((prev) => prev.filter((id) => id !== productId));
      setReloadKey((key) => key + 1);
    } catch {
      toast.error("Erro ao remover produto.");
    }
  };

  const openDetails = async (product: ProductSummary) => {
    if (!selectedStore) return;

    const requestId = ++detailsRequestRef.current;
    setSelectedProduct(product);
    setDetailsOpen(true);
    setDetailsLoading(true);

    try {
      const details = await api.get<Product>(
        `/stores/${selectedStore.id}/products/${product.id}`
      );
      if (requestId === detailsRequestRef.current) {
        setSelectedProduct(details);
      }
    } catch {
      if (requestId === detailsRequestRef.current) {
        toast.error("Não foi possível carregar os detalhes completos.");
      }
    } finally {
      if (requestId === detailsRequestRef.current) {
        setDetailsLoading(false);
      }
    }
  };

  const handleDetailsOpenChange = (open: boolean) => {
    if (!open) {
      detailsRequestRef.current += 1;
      setDetailsLoading(false);
    }
    setDetailsOpen(open);
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
                <TableHead className="w-24">Link</TableHead>
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
                    onClick={() => openDetails(product)}
                    style={{ cursor: "pointer" }}
                    className="hover:bg-muted/40"
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
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
                            {product.description_excerpt || "Sem descrição"}
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
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopyProductLink(product)}
                          title="Copiar link direto"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openDetails(product)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
                      onClick={() => {
                        const representative =
                          g.variants.find((v) => v.is_active) || g.variants[0];
                        if (representative) openDetails(representative);
                      }}
                      style={{ cursor: "pointer" }}
                      className="hover:bg-muted/40"
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleGroup(g.shopifyProductId)}
                          title="Expandir/recolher variantes"
                        >
                          <ChevronRight
                            className={`h-4 w-4 transition-transform ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          />
                        </Button>
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
                            className="bg-muted/20 hover:bg-muted/30"
                            onClick={() => openDetails(variant)}
                            style={{ cursor: "pointer" }}
                          >
                            <TableCell className="pl-8" onClick={(e) => e.stopPropagation()}>
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
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleCopyProductLink(variant)}
                                  title="Copiar link direto"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openDetails(variant)}
                                  title="Ver detalhes"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
        ) : paginatedGroups.length === 0 && !debouncedSearch ? (
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

      <ProductDetailsDialog
        product={selectedProduct}
        open={detailsOpen}
        loading={detailsLoading}
        onOpenChange={handleDetailsOpenChange}
      />

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
            {page} de {lastPage} · {total} produtos
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
