"use client";

import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type {
  AbandonedCart,
  Paginated,
  AbandonedCartStatus,
  AbandonedCartStep,
  AbandonedCartReason,
} from "@/types";
import {
  ABANDONED_CART_STATUS_LABEL,
  ABANDONED_CART_STEP_LABEL,
  ABANDONED_CART_REASON_LABEL,
} from "@/types";
import {
  ShoppingBag,
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  CreditCard,
  Eye,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function statusVariant(status: AbandonedCartStatus) {
  switch (status) {
    case "converted":
      return "success" as const;
    case "recovered":
      return "default" as const;
    case "expired":
      return "secondary" as const;
    case "open":
    default:
      return "warning" as const;
  }
}

function paymentMethodLabel(method?: string | null): string {
  if (!method) return "—";
  switch (method) {
    case "pix":
      return "PIX";
    case "credit_card":
      return "Cartão";
    case "boleto":
      return "Boleto";
    default:
      return method;
  }
}

export default function AbandonedCartsPage() {
  const { selectedStore } = useStore();
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stepFilter, setStepFilter] = useState<string>("all");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);

  const fetchCarts = useCallback(async () => {
    if (!selectedStore) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (stepFilter !== "all") params.set("step", stepFilter);
      if (reasonFilter !== "all") params.set("reason", reasonFilter);
      if (search.trim()) params.set("search", search.trim());

      const data = await api.get<Paginated<AbandonedCart>>(
        `/stores/${selectedStore.id}/abandoned-carts?${params}`
      );
      setCarts(data.data);
      setLastPage(data.last_page);
    } catch {
      toast.error("Erro ao carregar carrinhos abandonados.");
    } finally {
      setLoading(false);
    }
  }, [selectedStore, page, statusFilter, stepFilter, reasonFilter, search]);

  useEffect(() => {
    fetchCarts();
  }, [fetchCarts]);

  const handleMarkStatus = async (cartId: number, status: AbandonedCartStatus) => {
    try {
      await api.patch(`/stores/${selectedStore?.id}/abandoned-carts/${cartId}/status`, {
        status,
      });
      toast.success("Status atualizado.");
      fetchCarts();
      setSelectedCart(null);
    } catch {
      toast.error("Erro ao atualizar status.");
    }
  };

  return (
    <>
      <PageHeader
        title="Carrinhos Abandonados"
        description={`Rastreie e recupere carrinhos abandonados de ${selectedStore?.name ?? "sua loja"}.`}
      />

      {/* Filtros */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="open">Aberto</SelectItem>
            <SelectItem value="recovered">Recuperado</SelectItem>
            <SelectItem value="converted">Convertido</SelectItem>
            <SelectItem value="expired">Expirado</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={stepFilter}
          onValueChange={(v) => {
            setStepFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas etapas</SelectItem>
            <SelectItem value="dados">Identificação</SelectItem>
            <SelectItem value="entrega">Entrega</SelectItem>
            <SelectItem value="pagamento">Pagamento</SelectItem>
            <SelectItem value="pagamento_tentado">Tentou pagar</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={reasonFilter}
          onValueChange={(v) => {
            setReasonFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Motivo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos motivos</SelectItem>
            <SelectItem value="left_dados">Saiu na identificação</SelectItem>
            <SelectItem value="left_entrega">Saiu na entrega</SelectItem>
            <SelectItem value="left_pagamento">Saiu no pagamento</SelectItem>
            <SelectItem value="card_refused">Cartão recusado</SelectItem>
            <SelectItem value="pix_expired">PIX expirou</SelectItem>
            <SelectItem value="boleto_expired">Boleto expirou</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="mt-6 rounded-xl border">
        {loading ? (
          <div className="space-y-4 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : carts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última atividade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carts.map((cart) => (
                <TableRow
                  key={cart.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedCart(cart)}
                >
                  <TableCell className="font-mono text-xs">
                    #{cart.id}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{cart.customer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {cart.customer_email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {ABANDONED_CART_STEP_LABEL[cart.step_reached]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs">
                      {cart.items_count ?? 0} item(s)
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(Number(cart.total))}
                  </TableCell>
                  <TableCell>
                    {cart.abandoned_reason ? (
                      <span className="text-xs">
                        {ABANDONED_CART_REASON_LABEL[cart.abandoned_reason]}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(cart.status)}>
                      {ABANDONED_CART_STATUS_LABEL[cart.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {cart.last_activity_at
                      ? formatDate(cart.last_activity_at)
                      : formatDate(cart.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={ShoppingBag}
            title="Nenhum carrinho abandonado"
            description="Os carrinhos abandonados aparecerão aqui assim que os clientes iniciarem o checkout."
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

      {/* Dialog de detalhes */}
      <Dialog
        open={!!selectedCart}
        onOpenChange={() => setSelectedCart(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Carrinho Abandonado #{selectedCart?.id}</DialogTitle>
            <DialogDescription>
              Detalhes completos do abandono e dados de remarketing.
            </DialogDescription>
          </DialogHeader>

          {selectedCart && (
            <div className="space-y-4 text-sm">
              {/* Status e etapa */}
              <div className="flex items-center justify-between gap-2">
                <Badge variant={statusVariant(selectedCart.status)}>
                  {ABANDONED_CART_STATUS_LABEL[selectedCart.status]}
                </Badge>
                <Badge variant="outline">
                  {ABANDONED_CART_STEP_LABEL[selectedCart.step_reached]}
                </Badge>
              </div>

              <Separator />

              {/* Cliente */}
              <div>
                <p className="mb-2 font-semibold">Dados do Cliente</p>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>
                    <span className="block text-xs uppercase">Nome</span>
                    {selectedCart.customer_name}
                  </div>
                  <div>
                    <span className="block text-xs uppercase">Email</span>
                    {selectedCart.customer_email}
                  </div>
                  {selectedCart.customer_phone && (
                    <div>
                      <span className="block text-xs uppercase">Telefone</span>
                      {selectedCart.customer_phone}
                    </div>
                  )}
                  {selectedCart.customer_document && (
                    <div>
                      <span className="block text-xs uppercase">Documento</span>
                      {selectedCart.customer_document}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Endereço */}
              {selectedCart.shipping_address && (
                <>
                  <div>
                    <p className="mb-2 flex items-center gap-2 font-semibold">
                      <MapPin className="h-4 w-4" /> Endereço de entrega
                    </p>
                    <div className="text-muted-foreground">
                      <p>
                        {selectedCart.shipping_address.logradouro},{" "}
                        {selectedCart.shipping_address.numero}
                        {selectedCart.shipping_address.complemento
                          ? ` - ${selectedCart.shipping_address.complemento}`
                          : ""}
                      </p>
                      <p>
                        {selectedCart.shipping_address.bairro},{" "}
                        {selectedCart.shipping_address.cidade}/{" "}
                        {selectedCart.shipping_address.uf} -{" "}
                        {selectedCart.shipping_address.cep}
                      </p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Itens / Pagamento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-2 font-semibold">Itens</p>
                  {selectedCart.items && selectedCart.items.length > 0 ? (
                    <div className="space-y-2">
                      {selectedCart.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-muted-foreground"
                        >
                          <div className="flex-1">
                            <p className="text-foreground">{item.name}</p>
                            <p className="text-xs">
                              {item.qty}× {formatCurrency(Number(item.unit_price))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">—</p>
                  )}
                </div>
                <div>
                  <p className="mb-1 font-semibold">Pagamento</p>
                  <div className="space-y-1 text-muted-foreground">
                    <p>
                      Método:{" "}
                      <span className="text-foreground">
                        {paymentMethodLabel(selectedCart.payment_method)}
                      </span>
                    </p>
                    <p>
                      Valor:{" "}
                      <span className="font-medium text-foreground">
                        {formatCurrency(Number(selectedCart.total))}
                      </span>
                    </p>
                    {selectedCart.payment_method === "credit_card" && (
                      <>
                        <p>
                          Bandeira:{" "}
                          <span className="text-foreground">
                            {selectedCart.card_brand ?? "—"}
                          </span>
                        </p>
                        <p>
                          Final:{" "}
                          <span className="font-mono text-foreground">
                            {selectedCart.card_last4 ?? "—"}
                          </span>
                        </p>
                      </>
                    )}
                    {selectedCart.abandoned_reason && (
                      <p>
                        Motivo:{" "}
                        <span className="text-foreground">
                          {ABANDONED_CART_REASON_LABEL[selectedCart.abandoned_reason]}
                        </span>
                      </p>
                    )}
                    {selectedCart.order_id && (
                      <p className="text-xs">
                        Pedido:{" "}
                        <span className="font-mono">#{selectedCart.order_id}</span>
                      </p>
                    )}
                    <p className="text-xs">
                      {formatDate(selectedCart.last_activity_at ?? selectedCart.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rastreamento */}
              <Separator />
              <div>
                <p className="mb-2 font-semibold">Rastreamento</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <span className="block uppercase">Dispositivo</span>
                    {selectedCart.device_type ?? "—"}
                  </div>
                  <div>
                    <span className="block uppercase">IP</span>
                    {selectedCart.ip_address ?? "—"}
                  </div>
                  <div>
                    <span className="block uppercase">UTM Source</span>
                    {selectedCart.utm_source ?? "—"}
                  </div>
                  <div>
                    <span className="block uppercase">UTM Medium</span>
                    {selectedCart.utm_medium ?? "—"}
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedCart.status === "open" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkStatus(selectedCart.id, "recovered")}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" /> Marcar recuperado
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedCart.recovery_url) {
                      window.open(selectedCart.recovery_url, "_blank");
                    }
                  }}
                  disabled={!selectedCart.recovery_url}
                >
                  <Eye className="mr-2 h-4 w-4" /> Ver link de recuperação
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedCart.customer_email) {
                      window.location.href = `mailto:${selectedCart.customer_email}`;
                    }
                  }}
                >
                  <Mail className="mr-2 h-4 w-4" /> Enviar e-mail
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
