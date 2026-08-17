"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Boxes,
  Copy,
  ExternalLink,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Kit } from "@/types";

function productSummary(kit: Kit): string {
  if (kit.products.length === 0) return "Sem produtos";

  const names = kit.products
    .slice(0, 2)
    .map((product) => product.parent_title || product.name);
  const remaining = kit.products.length - names.length;

  return remaining > 0 ? `${names.join(", ")} e mais ${remaining}` : names.join(", ");
}

export default function KitsPage() {
  const { selectedStore } = useStore();
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const loadKits = useCallback(
    async (signal?: AbortSignal) => {
      if (!selectedStore) {
        setKits([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(false);
      try {
        const data = await api.get<Kit[]>(`/stores/${selectedStore.id}/kits`, {
          signal,
        });
        setKits(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(true);
        toast.error("Não foi possível carregar os kits.");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [selectedStore]
  );

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadKits(controller.signal));
    return () => controller.abort();
  }, [loadKits, reloadKey]);

  const handleCopy = async (kit: Kit) => {
    if (!kit.checkout_url) return;
    try {
      await navigator.clipboard.writeText(kit.checkout_url);
      toast.success("Link do kit copiado.");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  const handleDelete = async (kit: Kit) => {
    if (!selectedStore) return;
    if (!window.confirm(`Remover o kit "${kit.name}"?`)) return;

    try {
      await api.delete(`/stores/${selectedStore.id}/kits/${kit.id}`);
      setKits((current) => current.filter((item) => item.id !== kit.id));
      toast.success("Kit removido.");
    } catch {
      toast.error("Não foi possível remover o kit.");
    }
  };

  return (
    <>
      <PageHeader
        title="Kits"
        description="Crie carrinhos prontos com vários produtos e compartilhe um único link de checkout."
        actions={
          <Button asChild>
            <Link href="/dashboard/kits/create">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Criar kit
            </Link>
          </Button>
        }
      />

      <div className="mt-6 overflow-hidden rounded-xl border bg-card">
        {loading ? (
          <div className="space-y-4 p-6" aria-label="Carregando kits">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : loadError ? (
          <EmptyState
            icon={RefreshCw}
            title="Não foi possível carregar os kits"
            description="Verifique sua conexão e tente novamente."
            action={
              <Button onClick={() => setReloadKey((key) => key + 1)}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Tentar novamente
              </Button>
            }
            className="border-0"
          />
        ) : kits.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="Nenhum kit criado"
            description="Monte um carrinho com vários produtos para divulgar em campanhas, páginas ou atendimento."
            action={
              <Button asChild>
                <Link href="/dashboard/kits/create">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Criar primeiro kit
                </Link>
              </Button>
            }
            className="border-0"
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kit</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead className="w-24">Itens</TableHead>
                  <TableHead className="w-36">Valor</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-36">Checkout</TableHead>
                  <TableHead className="w-28 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kits.map((kit) => (
                  <TableRow key={kit.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/kits/${kit.id}`}
                        className="font-semibold hover:underline"
                      >
                        {kit.name}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <span className="block truncate text-sm text-muted-foreground">
                        {productSummary(kit)}
                      </span>
                    </TableCell>
                    <TableCell>{kit.items_count}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(Number(kit.subtotal))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={kit.is_active ? "success" : "secondary"}>
                        {kit.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(kit)}
                          disabled={!kit.checkout_url}
                        >
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          Copiar
                        </Button>
                        {kit.checkout_url && (
                          <Button variant="ghost" size="icon" asChild>
                            <a
                              href={kit.checkout_url}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Abrir checkout do kit ${kit.name}`}
                              title="Abrir checkout"
                            >
                              <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/dashboard/kits/${kit.id}`}
                            aria-label={`Editar ${kit.name}`}
                            title="Editar kit"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(kit)}
                          aria-label={`Remover ${kit.name}`}
                          title="Remover kit"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}
