"use client";

import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Customer, Order, Paginated, OrderStatus } from "@/types";
import { ORDER_STATUS_LABEL } from "@/types";
import { Users, Search, Mail, Phone, ChevronLeft, ChevronRight } from "lucide-react";
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

function orderStatusVariant(status: OrderStatus | string) {
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

export default function CustomersPage() {
  const { selectedStore } = useStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchCustomers = useCallback(async () => {
    if (!selectedStore) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

      const data = await api.get<Paginated<Customer>>(
        `/stores/${selectedStore.id}/customers?${params}`
      );
      setCustomers(data.data);
      setLastPage(data.last_page);
    } catch {
      toast.error("Erro ao carregar clientes.");
    } finally {
      setLoading(false);
    }
  }, [selectedStore, page, statusFilter, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openCustomer = async (customer: Customer) => {
    if (!selectedStore) return;
    setSelectedCustomer(customer);
    setLoadingDetail(true);
    try {
      const detail = await api.get<Customer>(
        `/stores/${selectedStore.id}/customers/${customer.id}`
      );
      setSelectedCustomer(detail);
    } catch {
      toast.error("Erro ao carregar detalhes do cliente.");
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Clientes"
        description={`Clientes de ${selectedStore?.name ?? "sua loja"}.`}
      />

      {/* Filtros */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
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
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="paid">Pagos</SelectItem>
            <SelectItem value="unpaid">Não pagos</SelectItem>
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
        ) : customers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Pedidos</TableHead>
                <TableHead>Total pago</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Desde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="cursor-pointer"
                  onClick={() => openCustomer(customer)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      {customer.shopify_customer_id && (
                        <p className="text-[11px] text-muted-foreground">
                          Shopify #{customer.shopify_customer_id}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{customer.email}</span>
                      </p>
                      {customer.phone && (
                        <p className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>
                        <span className="font-medium">{customer.paid_orders_count ?? 0}</span>
                        <span className="text-muted-foreground">
                          {" "}/ {customer.orders_count ?? 0} pagos
                        </span>
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(Number(customer.paid_total ?? 0))}
                  </TableCell>
                  <TableCell>
                    {customer.paid ? (
                      <Badge variant="success">Pago</Badge>
                    ) : (
                      <Badge variant="warning">Não pago</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {customer.created_at ? formatDate(customer.created_at) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={Users}
            title="Nenhum cliente encontrado"
            description="Clientes que preencherem seus dados no checkout aparecerão aqui."
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

      {/* Dialog de detalhes do cliente */}
      <Dialog
        open={!!selectedCustomer}
        onOpenChange={() => setSelectedCustomer(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCustomer?.name}</DialogTitle>
            <DialogDescription>
              Histórico de pedidos do cliente.
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-4 text-sm">
              {/* Resumo */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Pedidos</p>
                  <p className="mt-1 text-lg font-semibold">
                    {selectedCustomer.orders_count ?? 0}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Pagos</p>
                  <p className="mt-1 text-lg font-semibold text-green-600 dark:text-green-500">
                    {selectedCustomer.paid_orders_count ?? 0}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total pago</p>
                  <p className="mt-1 text-lg font-semibold">
                    {formatCurrency(Number(selectedCustomer.paid_total ?? 0))}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="mt-1">
                    {selectedCustomer.paid ? (
                      <Badge variant="success">Pago</Badge>
                    ) : (
                      <Badge variant="warning">Não pago</Badge>
                    )}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Dados de contato */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Email</p>
                  <p className="text-foreground">{selectedCustomer.email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Telefone</p>
                  <p className="text-foreground">{selectedCustomer.phone ?? "—"}</p>
                </div>
                {selectedCustomer.document && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Documento</p>
                    <p className="text-foreground">{selectedCustomer.document}</p>
                  </div>
                )}
                {selectedCustomer.shopify_customer_id && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Shopify ID</p>
                    <p className="text-foreground">#{selectedCustomer.shopify_customer_id}</p>
                  </div>
                )}
              </div>

              {/* Endereço */}
              {selectedCustomer.street && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-1 font-semibold">Endereço</p>
                    <p className="text-muted-foreground">
                      {selectedCustomer.street}
                      {selectedCustomer.number ? `, ${selectedCustomer.number}` : ""}
                      {selectedCustomer.complement ? ` - ${selectedCustomer.complement}` : ""}
                      <br />
                      {selectedCustomer.district}
                      {selectedCustomer.city ? ` — ${selectedCustomer.city}` : ""}
                      {selectedCustomer.uf ? `/${selectedCustomer.uf}` : ""}
                      {selectedCustomer.zip ? ` · CEP ${selectedCustomer.zip}` : ""}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              {/* Pedidos */}
              <div>
                <p className="mb-2 font-semibold">Pedidos</p>
                {loadingDetail ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                  <div className="max-h-[260px] space-y-2 overflow-y-auto">
                    {selectedCustomer.orders.map((order: Order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-mono text-xs text-muted-foreground">
                            #{order.id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(order.created_at)} ·{" "}
                            {paymentMethodLabel(order.payment_method)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">
                            {formatCurrency(Number(order.amount))}
                          </span>
                          <Badge variant={orderStatusVariant(order.status)}>
                            {ORDER_STATUS_LABEL[order.status] ?? order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Nenhum pedido feito ainda.
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}