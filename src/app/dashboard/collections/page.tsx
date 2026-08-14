"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Layers,
  Package,
  Plug,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { ShopifyCollection } from "@/types";

const PAGE_SIZE = 25;

interface PaginatedCollectionsResponse {
  data: ShopifyCollection[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

const SORT_ORDER_LABELS: Record<string, string> = {
  MANUAL: "Manual",
  BEST_SELLING: "Mais vendidos",
  ALPHA_ASC: "Título (A–Z)",
  ALPHA_DESC: "Título (Z–A)",
  PRICE_ASC: "Menor preço",
  PRICE_DESC: "Maior preço",
  CREATED: "Mais antigos",
  CREATED_DESC: "Mais recentes",
};

function formatDate(value?: string | null): string {
  if (!value) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function CollectionsPage() {
  const { selectedStore } = useStore();
  const [collections, setCollections] = useState<ShopifyCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const loadedStoreIdRef = useRef<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!selectedStore) {
      return;
    }

    const controller = new AbortController();
    const storeId = String(selectedStore.id);
    const storeChanged = loadedStoreIdRef.current !== storeId;
    const requestedPage = storeChanged ? 1 : page;

    const loadCollections = async () => {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(requestedPage),
        per_page: String(PAGE_SIZE),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);

      try {
        const response = await api.get<PaginatedCollectionsResponse>(
          `/stores/${selectedStore.id}/shopify/collections?${params.toString()}`,
          { signal: controller.signal }
        );

        if (requestedPage > response.meta.last_page) {
          setPage(Math.max(1, response.meta.last_page));
          return;
        }

        if (storeChanged) {
          loadedStoreIdRef.current = storeId;
          setPage(1);
        }

        setCollections(response.data);
        setLastPage(Math.max(1, response.meta.last_page));
        setTotal(response.meta.total);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        toast.error("Erro ao carregar coleções.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadCollections();
    return () => controller.abort();
  }, [selectedStore, page, debouncedSearch, reloadKey]);

  const handleSync = async () => {
    if (!selectedStore) return;
    setSyncing(true);

    try {
      await api.post(`/stores/${selectedStore.id}/shopify/sync`);
      toast.success("Sincronização de produtos e coleções iniciada!");
      window.setTimeout(() => setReloadKey((key) => key + 1), 1500);
      window.setTimeout(() => setReloadKey((key) => key + 1), 5000);
    } catch {
      toast.error("Erro ao iniciar sincronização.");
    } finally {
      setSyncing(false);
    }
  };

  const connected = Boolean(selectedStore?.shopify_domain);

  return (
    <>
      <PageHeader
        title="Coleções"
        description={
          connected
            ? `${total} ${total === 1 ? "coleção sincronizada" : "coleções sincronizadas"} da Shopify.`
            : "Conecte sua loja Shopify para importar as coleções existentes."
        }
        actions={
          connected ? (
            <Button variant="outline" onClick={handleSync} disabled={syncing}>
              <RefreshCw className={syncing ? "animate-spin" : ""} />
              {syncing ? "Sincronizando..." : "Atualizar Shopify"}
            </Button>
          ) : (
            <Button asChild>
              <Link href="/dashboard/integrations">
                <Plug /> Conectar Shopify
              </Link>
            </Button>
          )
        }
      />

      {connected && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou identificador..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border bg-card">
        {!connected ? (
          <EmptyState
            icon={Plug}
            title="Shopify não conectado"
            description="Configure a integração para trazer automaticamente as coleções já criadas na sua loja."
            action={
              <Button asChild>
                <Link href="/dashboard/integrations">Abrir integrações</Link>
              </Button>
            }
            className="border-0"
          />
        ) : loading ? (
          <div className="space-y-4 p-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : collections.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Imagem</TableHead>
                <TableHead>Coleção</TableHead>
                <TableHead className="w-32">Produtos</TableHead>
                <TableHead className="w-44">Ordenação</TableHead>
                <TableHead className="w-44">Atualizada na Shopify</TableHead>
                <TableHead className="w-32">Origem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collections.map((collection) => (
                <TableRow key={collection.id}>
                  <TableCell>
                    {collection.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={collection.image_url}
                        alt=""
                        className="h-10 w-10 rounded-md border object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{collection.title}</div>
                    <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                      /collections/{collection.handle || collection.shopify_collection_id}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {collection.products_count}
                    </span>
                  </TableCell>
                  <TableCell>
                    {SORT_ORDER_LABELS[collection.sort_order || ""] ||
                      collection.sort_order ||
                      "—"}
                  </TableCell>
                  <TableCell>{formatDate(collection.shopify_updated_at)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Shopify</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={Layers}
            title={search ? "Nenhuma coleção encontrada" : "Nenhuma coleção sincronizada"}
            description={
              search
                ? "Tente buscar por outro nome ou identificador."
                : "Atualize a Shopify para importar as coleções existentes da loja."
            }
            action={
              !search ? (
                <Button onClick={handleSync} disabled={syncing}>
                  <RefreshCw className={syncing ? "animate-spin" : ""} />
                  Sincronizar coleções
                </Button>
              ) : undefined
            }
            className="border-0"
          />
        )}
      </div>

      {connected && !loading && total > 0 && (
        <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Exibindo {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft /> Anterior
            </Button>
            <span className="px-2">
              Página {page} de {lastPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.min(lastPage, current + 1))}
              disabled={page >= lastPage}
            >
              Próxima <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
