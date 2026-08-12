import { BarChart3, CreditCard } from "lucide-react";

import type {
  CheckoutFunnel,
  CheckoutFunnelStage,
  PaymentMethodShare,
} from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const EMPTY_FUNNEL: CheckoutFunnelStage[] = [
  { key: "entered", label: "Entraram", count: 0 },
  { key: "personal_data", label: "Dados pessoais", count: 0 },
  { key: "delivery", label: "Entrega", count: 0 },
  { key: "approved", label: "Aprovados", count: 0 },
];

const METHOD_COLORS: Record<string, string> = {
  credit_card: "#008A39",
  pix: "#00E55F",
  boleto: "#72A985",
};

interface DashboardInsightsProps {
  funnel?: CheckoutFunnel;
  paymentMethods?: PaymentMethodShare[];
  loading?: boolean;
}

export function DashboardInsights({
  funnel,
  paymentMethods = [],
  loading = false,
}: DashboardInsightsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
      <CheckoutConversionCard funnel={funnel} loading={loading} />
      <PaymentApprovalCard methods={paymentMethods} loading={loading} />
    </div>
  );
}

function CheckoutConversionCard({
  funnel,
  loading,
}: {
  funnel?: CheckoutFunnel;
  loading: boolean;
}) {
  const stages = funnel?.stages?.length ? funnel.stages : EMPTY_FUNNEL;
  const maximum = Math.max(...stages.map((stage) => stage.count), 1);

  return (
    <Card className="overflow-hidden border-border/80 bg-card shadow-[var(--panel-shadow)]">
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border/70 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#008A39]/12 text-[#008A39] dark:bg-[#008A39]/20 dark:text-[#00E55F]">
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Conversão do checkout</h2>
            <p className="mt-1 text-[11px] text-muted-foreground">Avanço por etapa</p>
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-7 w-14" />
        ) : (
          <p className="font-mono text-xl font-bold text-[#008A39] dark:text-[#00E55F]">
            {(funnel?.conversion ?? 0).toFixed(1)}%
          </p>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-5">
        {loading ? (
          <Skeleton className="h-[112px] w-full" />
        ) : (
          <div
            className="grid grid-cols-4 gap-2"
            role="img"
            aria-label={`Funil do checkout com conversão de ${(funnel?.conversion ?? 0).toFixed(1)}%`}
          >
            {stages.map((stage, index) => {
              const relativeHeight = (stage.count / maximum) * 100;
              const opacity = 0.42 + index * 0.18;

              return (
                <div key={stage.key} className="flex min-w-0 flex-col items-center">
                  <div className="flex h-20 w-full items-end justify-center border-b border-border/70 px-1">
                    <div
                      className="w-full max-w-10 rounded-t-md bg-[#008A39]"
                      style={{
                        height: stage.count > 0 ? `${Math.max(relativeHeight, 8)}%` : "2px",
                        opacity: stage.count > 0 ? opacity : 0.18,
                      }}
                    />
                  </div>
                  <p className="mt-2 font-mono text-sm font-bold">{stage.count}</p>
                  <p className="mt-1 min-h-8 text-center text-[10px] leading-4 text-muted-foreground">
                    {stage.label}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentApprovalCard({
  methods,
  loading,
}: {
  methods: PaymentMethodShare[];
  loading: boolean;
}) {
  const total = methods.reduce((sum, method) => sum + method.count, 0);

  return (
    <Card className="overflow-hidden border-border/80 bg-card shadow-[var(--panel-shadow)]">
      <CardHeader className="flex flex-row items-start gap-3 border-b border-border/70 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#008A39]/12 text-[#008A39] dark:bg-[#008A39]/20 dark:text-[#00E55F]">
          <CreditCard className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Pagamentos aprovados</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">Distribuição por meio</p>
        </div>
      </CardHeader>
      <CardContent className="px-5 py-5">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : total === 0 ? (
          <div className="flex min-h-[94px] flex-col items-center justify-center text-center">
            <p className="text-sm font-medium">Nenhum pagamento aprovado</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              A distribuição aparecerá após a primeira venda.
            </p>
          </div>
        ) : (
          <>
            <div
              className="flex h-3 overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label="Distribuição dos pagamentos aprovados por meio"
            >
              {methods.map((method) => (
                <div
                  key={method.method}
                  style={{
                    width: `${method.percentage}%`,
                    backgroundColor: METHOD_COLORS[method.method],
                  }}
                  title={`${method.label}: ${method.percentage.toFixed(1)}%`}
                />
              ))}
            </div>
            <div className="mt-4 space-y-2.5">
              {methods.map((method) => (
                <div key={method.method} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: METHOD_COLORS[method.method] }}
                    />
                    {method.label}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] text-muted-foreground">{method.count}</span>
                    <span className="min-w-12 text-right font-mono font-bold">
                      {method.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
