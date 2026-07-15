"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
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

export default function ProductsPage() {
  const { selectedStore } = useStore();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [syncing, setSyncing] = useState(false);

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

  const activeProducts = useMemo(
    () => products.filter((p) => p.is_active),
    [products]
  );

  const allSelected =
    activeProducts.length > 0 &&
    selectedIds.length === activeProducts.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activeProducts.map((p) => p.id));
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

  const openCheckout = (product: Product) => {
    if (!product.checkout_url) {
      toast.error("Este produto ainda não possui link gerado.");
      return;
    }
    window.open(product.checkout_url, "_blank", "noopener,noreferrer");
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

  const truncateUrl = (url?: string | null) => {
    if (!url) return "—";
    return url.length > 48 ? url.slice(0, 45) + "…" : url;
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

      <div className="mt-6 rounded-xl border">
        {loading ? (
          <div className="space-y-4 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : products.length > 0 ? (
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
                <TableHead>Link</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
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
                        {product.shopify_product_id && (
                          <Badge
                            variant="outline"
                            className="border-[#95bf47]/40 text-[#95bf47]"
                            title="Vem do Shopify"
                          >
                            Shopify
                          </Badge>
                        )}
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
                      <button
                        type="button"
                        onClick={() => openCheckout(product)}
                        className="max-w-[180px] truncate text-xs text-primary underline-offset-2 hover:underline"
                        title={product.checkout_url ?? "Sem link"}
                      >
                        {truncateUrl(product.checkout_url)}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
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
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(product.id)}
                          title="Remover"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
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
        )}
      </div>
    </>
  );
}