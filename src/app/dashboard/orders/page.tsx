"use client";

import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order, Paginated, OrderStatus } from "@/types";
import { ORDER_STATUS_LABEL } from "@/types";
import {
  ShoppingCart,
  Search,
  Mail,
  ChevronLeft,
  ChevronRight,
  Download,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  appendDateFilterParams,
  DateFilterControls,
  type DateFilterValue,
} from "@/components/date-filter-controls";

function statusVariant(status: OrderStatus | string) {
  switch (status) {
    case "paid":
    case "authorized":
      return "success" as const;
    case "pending":
    case "processing":
    case "waiting_payment":
    case "in_analysis":
      return "warning" as const;
    case "failed":
    case "refused":
    case "canceled":
      return "destructive" as const;
    case "refunded":
    case "chargedback":
    case "in_protest":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

function paymentMethodLabel(method: string): string {
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

export default function OrdersPage() {
  const { selectedStore } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({
    preset: "all",
    from: "",
    to: "",
  });
  const [exporting, setExporting] = useState(false);

  // Dialog de detalhes
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!selectedStore) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());
      appendDateFilterParams(params, dateFilter);

      const data = await api.get<Paginated<Order>>(
        `/stores/${selectedStore.id}/orders?${params}`
      );
      setOrders(data.data);
      setLastPage(data.last_page);
    } catch {
      toast.error("Erro ao carregar pedidos.");
    } finally {
      setLoading(false);
    }
  }, [selectedStore, page, statusFilter, search, dateFilter]);

  useEffect(() => {
    // The request owns the loading lifecycle for this client-side table.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);

  const handleNotify = async (orderId: number) => {
    try {
      await api.post(`/orders/${orderId}/notify`);
      toast.success("Notificação reenviada com sucesso!");
    } catch {
      toast.error("Erro ao reenviar notificação.");
    }
  };

  const handleExport = async () => {
    if (!selectedStore) return;

    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());
      appendDateFilterParams(params, dateFilter);

      const { blob, filename } = await api.download(
        `/stores/${selectedStore.id}/orders/export?${params}`
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename ?? `pedidos-${selectedStore.id}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      toast.success("CSV baixado com sucesso.");
    } catch {
      toast.error("Erro ao baixar o CSV de pedidos.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Pedidos"
        description={`Gerencie os pedidos de ${selectedStore?.name ?? "sua loja"}.`}
      />

      {/* Filtros */}
      <div className="-mx-1 mt-6 overflow-x-auto px-1 pb-2">
        <div className="flex min-w-max items-center gap-2">
          <div className="relative w-[240px] shrink-0">
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
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="processing">Processando</SelectItem>
              <SelectItem value="waiting_payment">Aguardando Pagamento</SelectItem>
              <SelectItem value="in_analysis">Em Análise</SelectItem>
              <SelectItem value="authorized">Autorizado</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="failed">Recusado</SelectItem>
              <SelectItem value="refunded">Reembolsado</SelectItem>
              <SelectItem value="chargedback">Chargeback</SelectItem>
              <SelectItem value="canceled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <DateFilterControls
            value={dateFilter}
            onChange={(value) => {
              setDateFilter(value);
              setPage(1);
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            disabled={exporting}
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            {exporting ? "Baixando..." : "Baixar CSV"}
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="mt-6 rounded-xl border">
        {loading ? (
          <div className="space-y-4 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : orders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <TableCell className="font-mono text-xs">
                    #{order.id}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.customer_email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    {order.items && order.items.length > 0 ? (
                      <div className="space-y-0.5">
                        {order.items.slice(0, 2).map((item) => (
                          <div
                            key={item.id}
                            className="truncate text-xs"
                            title={item.name}
                          >
                            {item.qty > 1 ? `${item.qty}× ` : ""}
                            {item.name}
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{order.items.length - 2} outro(s)
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(Number(order.amount))}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs">
                      {paymentMethodLabel(order.payment_method)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(order.status)}>
                      {ORDER_STATUS_LABEL[order.status] ?? order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(order.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={ShoppingCart}
            title="Nenhum pedido encontrado"
            description="Os pedidos realizados através do checkout aparecerão aqui."
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

      {/* Dialog detalhes do pedido */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pedido #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Detalhes completos do pedido.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 text-sm">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={statusVariant(selectedOrder.status)}>
                  {ORDER_STATUS_LABEL[selectedOrder.status] ?? selectedOrder.status}
                </Badge>
              </div>

              <Separator />

              {/* Cliente */}
              <div>
                <p className="mb-2 font-semibold">Dados do Cliente</p>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>
                    <span className="block text-xs uppercase">Nome</span>
                    {selectedOrder.customer_name}
                  </div>
                  <div>
                    <span className="block text-xs uppercase">Email</span>
                    {selectedOrder.customer_email}
                  </div>
                  {selectedOrder.customer_phone && (
                    <div>
                      <span className="block text-xs uppercase">Telefone</span>
                      {selectedOrder.customer_phone}
                    </div>
                  )}
                  {selectedOrder.customer_document && (
                    <div>
                      <span className="block text-xs uppercase">Documento</span>
                      {selectedOrder.customer_document}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Itens / Pagamento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-2 font-semibold">Itens</p>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    <div className="space-y-2">
                      {selectedOrder.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 text-muted-foreground"
                        >
                          {item.product?.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt=""
                              className="h-8 w-8 rounded object-cover"
                            />
                          ) : null}
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
                    <p className="text-muted-foreground">-</p>
                  )}
                </div>
                <div>
                  <p className="mb-1 font-semibold">Pagamento</p>
                  <div className="space-y-1 text-muted-foreground">
                    <p>
                      Método:{" "}
                      <span className="text-foreground">
                        {paymentMethodLabel(selectedOrder.payment_method)}
                      </span>
                    </p>
                    <p>
                      Valor:{" "}
                      <span className="font-medium text-foreground">
                        {formatCurrency(Number(selectedOrder.amount))}
                      </span>
                    </p>
                    {selectedOrder.payment_method === "credit_card" && (
                      <>
                        <p>
                          Bandeira:{" "}
                          <span className="text-foreground">
                            {selectedOrder.card_brand ?? "-"}
                          </span>
                        </p>
                        <p>
                          Final:{" "}
                          <span className="text-foreground font-mono">
                            {selectedOrder.card_last4 ?? "-"}
                          </span>
                        </p>
                        <p>
                          Parcelas:{" "}
                          <span className="text-foreground">
                            {selectedOrder.installments ?? 1}x
                          </span>
                        </p>
                      </>
                    )}
                    {selectedOrder.gateway_transaction_id && (
                      <p className="text-xs">
                        ID gateway:{" "}
                        <span className="font-mono">
                          {selectedOrder.gateway_transaction_id}
                        </span>
                      </p>
                    )}
                    <p className="text-xs">
                      {formatDate(selectedOrder.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* PIX */}
              {selectedOrder.payment_method === "pix" &&
                selectedOrder.pix_copia_cola && (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-2 font-semibold">PIX Copia e Cola</p>
                      <div className="rounded-lg bg-muted p-3 text-xs font-mono break-all">
                        {selectedOrder.pix_copia_cola}
                      </div>
                    </div>
                  </>
                )}

              {/* Boleto */}
              {selectedOrder.payment_method === "boleto" &&
                selectedOrder.boleto_digitable_line && (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-2 font-semibold">Boleto</p>
                      <div className="rounded-lg bg-muted p-3 text-xs font-mono break-all">
                        {selectedOrder.boleto_digitable_line}
                      </div>
                      {selectedOrder.boleto_url && (
                        <a
                          href={selectedOrder.boleto_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-xs text-primary underline"
                        >
                          Abrir boleto (HTML)
                        </a>
                      )}
                    </div>
                  </>
                )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                selectedOrder && handleNotify(selectedOrder.id)
              }
              disabled={!selectedOrder}
            >
              <Mail className="h-4 w-4" /> Reenviar notificação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
