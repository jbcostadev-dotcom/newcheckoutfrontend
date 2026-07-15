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

function statusVariant(status: OrderStatus) {
  switch (status) {
    case "paid":
      return "success" as const;
    case "pending":
      return "warning" as const;
    case "failed":
      return "destructive" as const;
    case "refunded":
      return "secondary" as const;
    default:
      return "outline" as const;
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

  // Dialog de detalhes
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!selectedStore) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

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
  }, [selectedStore, page, statusFilter, search]);

  useEffect(() => {
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

  return (
    <>
      <PageHeader
        title="Pedidos"
        description={`Gerencie os pedidos de ${selectedStore?.name ?? "sua loja"}.`}
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
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="failed">Recusado</SelectItem>
            <SelectItem value="refunded">Reembolsado</SelectItem>
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
        ) : orders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Produto</TableHead>
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
                  <TableCell className="max-w-[200px] truncate">
                    {order.product?.name ?? `#${order.product_id}`}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(Number(order.amount))}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs capitalize">
                      {order.payment_method === "pix" ? "PIX" : "Cartão"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(order.status)}>
                      {ORDER_STATUS_LABEL[order.status]}
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
                  {ORDER_STATUS_LABEL[selectedOrder.status]}
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

              {/* Produto / Pagamento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 font-semibold">Produto</p>
                  <p className="text-muted-foreground">
                    {selectedOrder.product?.name ?? `#${selectedOrder.product_id}`}
                  </p>
                  {selectedOrder.product?.image_url && (
                    <img
                      src={selectedOrder.product.image_url}
                      alt=""
                      className="mt-2 h-16 w-16 rounded-lg object-cover"
                    />
                  )}
                </div>
                <div>
                  <p className="mb-1 font-semibold">Pagamento</p>
                  <div className="space-y-1 text-muted-foreground">
                    <p>
                      Método:{" "}
                      <span className="text-foreground">
                        {selectedOrder.payment_method === "pix"
                          ? "PIX"
                          : "Cartão de Crédito"}
                      </span>
                    </p>
                    <p>
                      Valor:{" "}
                      <span className="font-medium text-foreground">
                        {formatCurrency(Number(selectedOrder.amount))}
                      </span>
                    </p>
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
