"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Clock,
  DollarSign,
  Package,
  ShoppingCart,
} from "lucide-react";

import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Metrics, OrderStatus } from "@/types";
import { ORDER_STATUS_LABEL } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import LiveCheckoutCard from "@/components/live-checkout-card";
import { DashboardInsights } from "@/components/dashboard-insights";
import { DashboardLocationAndConversion } from "@/components/dashboard-location-and-conversion";
import { SalesPeakChart } from "@/components/sales-peak-chart";

type DashboardPeriod = "today" | "week" | "month" | "year";

const PERIOD_OPTIONS: Array<{ value: DashboardPeriod; label: string }> = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "year", label: "Ano" },
];

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

export default function DashboardOverview() {
  const { selectedStore } = useStore();
  const [period, setPeriod] = useState<DashboardPeriod>("week");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!selectedStore) {
      setMetrics(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await api.get<Metrics>(
        `/stores/${selectedStore.id}/metrics?period=${period}`,
      );
      setMetrics(data);
    } catch {
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [period, selectedStore]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const periodLabel =
    PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? "Semana";

  return (
    <div className="space-y-6 pb-4">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[1.7rem]">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe suas vendas e métricas em tempo real
            {selectedStore ? ` na ${selectedStore.name}` : ""}.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-[var(--panel-shadow)]">
          <CalendarDays className="ml-2 mr-1 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={period === option.value}
              onClick={() => setPeriod(option.value)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors active:translate-y-px ${
                period === option.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Métricas do período">
        <MetricCard
          title="Total de vendas"
          icon={ShoppingCart}
          value={String(metrics?.orders_paid ?? 0)}
          note={`Vendas aprovadas em ${periodLabel.toLowerCase()}`}
          loading={loading}
          className="bg-gradient-to-br from-[#007f35] to-[#00ad49]"
        />
        <MetricCard
          title="Receita total"
          icon={DollarSign}
          value={formatCurrency(metrics?.revenue_total ?? metrics?.revenue_today ?? 0)}
          note={`Receita aprovada em ${periodLabel.toLowerCase()}`}
          loading={loading}
          className="bg-gradient-to-br from-[#008a39] to-[#00c957]"
        />
        <MetricCard
          title="Vendas pendentes"
          icon={Clock}
          value={String(metrics?.orders_pending ?? 0)}
          note="Aguardando confirmação de pagamento"
          loading={loading}
          className="bg-gradient-to-br from-[#c56f00] to-[#f3a82d]"
        />
        <MetricCard
          title="Vendas falhadas"
          icon={AlertCircle}
          value={String(metrics?.orders_failed ?? 0)}
          note={`Falhas registradas em ${periodLabel.toLowerCase()}`}
          loading={loading}
          className="bg-gradient-to-br from-[#cf303c] to-[#ef5b67]"
        />
      </section>

      <section className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
        <SalesPeakChart
          data={metrics?.sales_series ?? []}
          periodLabel={periodLabel}
          loading={loading}
        />
        <DashboardInsights
          funnel={metrics?.checkout_funnel}
          paymentMethods={metrics?.payment_methods}
          loading={loading}
        />
      </section>

      <LiveCheckoutCard />

      <DashboardLocationAndConversion
        salesByState={metrics?.sales_by_state}
        paymentConversions={metrics?.payment_conversions}
        loading={loading}
      />

      <Card className="border-border/80 bg-card shadow-[var(--panel-shadow)]">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6">
          <div>
            <CardTitle className="text-base">Pedidos recentes</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Últimas movimentações da sua loja
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/orders">
              Ver todos <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="px-5 py-2 sm:px-6">
          {loading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : metrics?.recent_orders && metrics.recent_orders.length > 0 ? (
            <div className="divide-y divide-border/70">
              {metrics.recent_orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {order.items?.[0]?.product?.image_url ? (
                      <img
                        src={order.items[0].product.image_url}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {order.items && order.items.length > 0
                          ? order.items.length > 1
                            ? `${order.items[0].name} +${order.items.length - 1}`
                            : order.items[0].name
                          : `Pedido #${order.id}`}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {order.customer_name} - {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="font-mono text-sm font-semibold">
                      {formatCurrency(Number(order.amount))}
                    </span>
                    <Badge variant={statusVariant(order.status)}>
                      {ORDER_STATUS_LABEL[order.status] ?? order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Nenhum pedido ainda</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Os pedidos realizados pelo checkout aparecerão aqui.
              </p>
            </div>
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
  note,
  loading,
  className,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  note: string;
  loading: boolean;
  className: string;
}) {
  return (
    <article
      className={`relative min-h-36 overflow-hidden rounded-[var(--radius)] p-5 text-white shadow-[0_18px_45px_rgb(0_0_0/14%)] ${className}`}
    >
      <div className="absolute -bottom-14 -right-7 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 right-5 h-24 w-24 rounded-full bg-white/5" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-white/85">{title}</p>
          {loading ? (
            <Skeleton className="mt-3 h-8 w-28 bg-white/20" />
          ) : (
            <p className="mt-2 font-mono text-2xl font-bold tracking-tight sm:text-[1.65rem]">
              {value}
            </p>
          )}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/16 ring-1 ring-white/15">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      <p className="relative mt-4 max-w-[85%] text-[11px] leading-relaxed text-white/75">
        {note}
      </p>
    </article>
  );
}
