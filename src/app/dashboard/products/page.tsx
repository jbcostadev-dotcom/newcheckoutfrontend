"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";
import { Package, Plus, Copy, Pencil, Trash2 } from "lucide-react";
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

export default function ProductsPage() {
  const { selectedStore } = useStore();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleCopyLink = (productId: number) => {
    const subdomain = selectedStore?.subdomain;
    const customDomain = selectedStore?.custom_domain;
    const checkoutAppDomain =
      process.env.NEXT_PUBLIC_CHECKOUT_APP_DOMAIN ||
      `checkout.${process.env.NEXT_PUBLIC_CHECKOUT_BASE_DOMAIN || "bersenker.shop"}`;

    let url: string;
    if (customDomain) {
      url = `https://${customDomain}/checkout/${productId}`;
    } else if (subdomain) {
      url = `https://${checkoutAppDomain}/${subdomain}/checkout/${productId}`;
    } else {
      url = `${window.location.origin}/checkout/${productId}`;
    }

    navigator.clipboard.writeText(url);
    toast.success("Link copiado para a área de transferência!");
  };

  const handleDelete = async (productId: number) => {
    if (!selectedStore || !confirm("Remover este produto?")) return; // eslint-disable-line no-alert
    try {
      await api.delete(`/stores/${selectedStore.id}/products/${productId}`);
      toast.success("Produto removido!");
      fetchProducts();
    } catch {
      toast.error("Erro ao remover produto.");
    }
  };

  return (
    <>
      <PageHeader
        title="Produtos"
        description={`Gerencie os produtos de ${selectedStore?.name ?? "sua loja"}.`}
        actions={
          <Button onClick={() => router.push("/dashboard/products/create")}>
            <Plus className="h-4 w-4" /> Novo Produto
          </Button>
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
                <TableHead className="w-12">Img</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
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
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground max-w-[300px] truncate">
                        {product.description || "Sem descrição"}
                      </p>
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
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopyLink(product.id)}
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
              ))}
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
