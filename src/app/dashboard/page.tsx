"use client";

import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Metrics, Order, ORDER_STATUS_LABEL, OrderStatus } from "@/types";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendente",
  paid: "Pago",
  failed: "Recusado",
  refunded: "Reembolsado",
};

export default function DashboardOverview() {
  const { selectedStore } = useStore();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!selectedStore) return;
    try {
      const data = await api.get<Metrics>(
        `/stores/${selectedStore.id}/metrics`
      );
      setMetrics(data);
    } catch {
      /* ignore — cards show zeros */
    } finally {
      setLoading(false);
    }
  }, [selectedStore]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Visão Geral
          {selectedStore ? ` — ${selectedStore.name}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe o desempenho da sua loja.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Faturamento (Hoje)"
          icon={DollarSign}
          value={formatCurrency(metrics?.revenue_today ?? 0)}
          loading={loading}
          accent="text-success"
        />
        <MetricCard
          title="Pedidos Pagos"
          icon={ShoppingCart}
          value={String(metrics?.orders_paid ?? 0)}
          loading={loading}
          accent="text-primary"
        />
        <MetricCard
          title="Conversão"
          icon={TrendingUp}
          value={`${metrics?.conversion ?? 0}%`}
          loading={loading}
          accent="text-warning"
        />
        <MetricCard
          title="Total de Pedidos"
          icon={Package}
          value={String(metrics?.orders_total ?? 0)}
          loading={loading}
          accent="text-foreground"
        />
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Pedidos Recentes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/orders">
              Ver todos <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : metrics?.recent_orders && metrics.recent_orders.length > 0 ? (
            <div className="divide-y">
              {metrics.recent_orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    {order.items?.[0]?.product?.image_url ? (
                      <img
                        src={order.items[0].product.image_url}
                        alt=""
                        className="h-9 w-9 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {order.items && order.items.length > 0
                          ? order.items.length > 1
                            ? `${order.items[0].name} +${order.items.length - 1}`
                            : order.items[0].name
                          : `#${order.id}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.customer_name} — {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {formatCurrency(Number(order.amount))}
                    </span>
                    <Badge variant={statusVariant(order.status)}>
                      {STATUS_LABEL[order.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum pedido ainda. Os pedidos realizados via checkout
              aparecerão aqui.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  icon: Icon,
  value,
  loading,
  accent,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  loading: boolean;
  accent: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className={`text-2xl font-bold ${accent}`}>{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
