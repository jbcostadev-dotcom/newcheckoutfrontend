"use client";

import { useMemo, useState } from "react";
import { CreditCard, Info, MapPinned, ReceiptText } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import type { PaymentConversion, StateSales } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const BRAZIL_STATES = [
  { uf: "RR", name: "Roraima", column: 3, row: 1 },
  { uf: "AP", name: "Amapá", column: 7, row: 1 },
  { uf: "AM", name: "Amazonas", column: 2, row: 2 },
  { uf: "PA", name: "Pará", column: 4, row: 2 },
  { uf: "MA", name: "Maranhão", column: 6, row: 2 },
  { uf: "CE", name: "Ceará", column: 7, row: 2 },
  { uf: "RN", name: "Rio Grande do Norte", column: 8, row: 2 },
  { uf: "AC", name: "Acre", column: 1, row: 3 },
  { uf: "RO", name: "Rondônia", column: 2, row: 3 },
  { uf: "MT", name: "Mato Grosso", column: 3, row: 3 },
  { uf: "TO", name: "Tocantins", column: 5, row: 3 },
  { uf: "PI", name: "Piauí", column: 6, row: 3 },
  { uf: "PB", name: "Paraíba", column: 8, row: 3 },
  { uf: "PE", name: "Pernambuco", column: 7, row: 4 },
  { uf: "AL", name: "Alagoas", column: 8, row: 4 },
  { uf: "SE", name: "Sergipe", column: 8, row: 5 },
  { uf: "BA", name: "Bahia", column: 6, row: 4 },
  { uf: "GO", name: "Goiás", column: 4, row: 4 },
  { uf: "DF", name: "Distrito Federal", column: 5, row: 4 },
  { uf: "MG", name: "Minas Gerais", column: 5, row: 5 },
  { uf: "ES", name: "Espírito Santo", column: 7, row: 6 },
  { uf: "MS", name: "Mato Grosso do Sul", column: 3, row: 5 },
  { uf: "SP", name: "São Paulo", column: 4, row: 6 },
  { uf: "RJ", name: "Rio de Janeiro", column: 6, row: 6 },
  { uf: "PR", name: "Paraná", column: 4, row: 7 },
  { uf: "SC", name: "Santa Catarina", column: 4, row: 8 },
  { uf: "RS", name: "Rio Grande do Sul", column: 3, row: 9 },
] as const;

const PAYMENT_ORDER = ["credit_card", "pix", "boleto"] as const;

interface DashboardLocationAndConversionProps {
  salesByState?: StateSales[];
  paymentConversions?: PaymentConversion[];
  loading?: boolean;
}

export function DashboardLocationAndConversion({
  salesByState = [],
  paymentConversions = [],
  loading = false,
}: DashboardLocationAndConversionProps) {
  return (
    <section className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
      <SalesByStateCard data={salesByState} loading={loading} />
      <PaymentConversionCard data={paymentConversions} loading={loading} />
    </section>
  );
}

function SalesByStateCard({ data, loading }: { data: StateSales[]; loading: boolean }) {
  const [view, setView] = useState<"map" | "list">("map");
  const stateData = useMemo(
    () => new Map(data.map((item) => [item.state.toUpperCase(), item])),
    [data],
  );
  const sortedStates = useMemo(
    () => [...data].sort((a, b) => b.sales - a.sales || b.revenue - a.revenue),
    [data],
  );
  const maxSales = Math.max(...data.map((item) => item.sales), 0);
  const leader = sortedStates[0];

  return (
    <Card className="flex min-h-[450px] flex-col overflow-hidden border-border/80 bg-card shadow-[var(--panel-shadow)]">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#008A39]/10 text-[#008A39] dark:bg-[#008A39]/20 dark:text-[#00E55F]">
              <MapPinned className="h-4 w-4" aria-hidden="true" />
            </span>
            Vendas por estado
          </CardTitle>
          <p className="ml-10 mt-0.5 text-xs text-muted-foreground">
            Pedidos aprovados por destino
          </p>
        </div>
        <span title="Considera o estado de entrega das vendas pagas no período selecionado.">
          <Info className="h-4 w-4 text-muted-foreground" aria-label="Sobre vendas por estado" />
        </span>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col px-5 py-5 sm:px-6">
        <div className="mb-4 inline-flex w-fit rounded-lg bg-muted/60 p-1">
          {(["map", "list"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={view === option}
              onClick={() => setView(option)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                view === option
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option === "map" ? "Mapa" : "Lista"}
            </button>
          ))}
        </div>

        {loading ? (
          <Skeleton className="min-h-[290px] flex-1" />
        ) : view === "map" ? (
          <div className="flex flex-1 flex-col">
            <div
              className="mx-auto grid w-full max-w-[430px] flex-1 grid-cols-8 grid-rows-9 gap-1.5"
              role="img"
              aria-label="Mapa do Brasil com vendas aprovadas por estado"
            >
              {BRAZIL_STATES.map((state) => {
                const sales = stateData.get(state.uf);
                const intensity = sales && maxSales > 0
                  ? 0.22 + (sales.sales / maxSales) * 0.72
                  : 0;

                return (
                  <div
                    key={state.uf}
                    title={`${state.name}: ${sales?.sales ?? 0} vendas, ${formatCurrency(sales?.revenue ?? 0)}`}
                    aria-label={`${state.name}: ${sales?.sales ?? 0} vendas aprovadas`}
                    className="flex min-h-7 items-center justify-center rounded-md border border-border/70 font-mono text-[9px] font-bold transition-colors"
                    style={{
                      gridColumn: state.column,
                      gridRow: state.row,
                      backgroundColor: sales
                        ? `rgb(0 185 77 / ${intensity})`
                        : "rgb(255 255 255 / 0.025)",
                      color: sales ? "#f4fff7" : undefined,
                    }}
                  >
                    {state.uf}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 border-t border-border/70 pt-4 text-center">
              {leader ? (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{leader.state}</span> lidera com{" "}
                  <span className="font-mono font-semibold text-[#00b94d] dark:text-[#00E55F]">
                    {leader.sales} {leader.sales === 1 ? "venda" : "vendas"}
                  </span>
                  {" "}aprovadas
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium">Sem dados de localização</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    O estado aparecerá após a primeira venda aprovada.
                  </p>
                </>
              )}
            </div>
          </div>
        ) : sortedStates.length > 0 ? (
          <div className="space-y-2">
            {sortedStates.map((state, index) => (
              <div
                key={state.state}
                className="grid grid-cols-[28px_1fr_auto] items-center gap-3 rounded-lg border border-border/70 px-3 py-2.5"
              >
                <span className="font-mono text-xs text-muted-foreground">{index + 1}</span>
                <div>
                  <p className="text-sm font-semibold">{state.state}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(state.revenue)}</p>
                </div>
                <span className="font-mono text-sm font-bold text-[#00b94d] dark:text-[#00E55F]">
                  {state.sales}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <MapPinned className="mb-3 h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">Nenhuma venda localizada</p>
            <p className="mt-1 text-xs text-muted-foreground">
              A lista será preenchida com vendas aprovadas.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentConversionCard({
  data,
  loading,
}: {
  data: PaymentConversion[];
  loading: boolean;
}) {
  const conversions = PAYMENT_ORDER.map((method) =>
    data.find((item) => item.method === method) ?? {
      method,
      label: method === "credit_card" ? "Cartão" : method === "pix" ? "Pix" : "Boleto",
      basis: method === "credit_card" ? "decided" as const : "generated" as const,
      approved: 0,
      generated: 0,
      refused: 0,
      conversion: 0,
    },
  );

  return (
    <Card className="overflow-hidden border-border/80 bg-card shadow-[var(--panel-shadow)]">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6">
        <div>
          <CardTitle className="text-base">Conversão de pagamentos</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">Eficiência por método</p>
        </div>
        <span title="Pix e Boleto consideram cobranças geradas. Cartão considera apenas pagamentos aprovados ou recusados.">
          <Info className="h-4 w-4 text-muted-foreground" aria-label="Sobre conversão de pagamentos" />
        </span>
      </CardHeader>
      <CardContent className="space-y-3 px-5 py-5 sm:px-6">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-[102px] w-full rounded-xl" />
            ))
          : conversions.map((item) => (
              <article
                key={item.method}
                className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#007f35] via-[#008A39] to-[#00b94d] px-5 py-4 text-white"
              >
                <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10" />
                <div className="relative flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white/85">Conversão no {item.label}</p>
                    <p className="mt-1 font-mono text-3xl font-bold tracking-tight">
                      {item.conversion.toFixed(1)}%
                    </p>
                    <p className="mt-2 text-xs text-white/75">
                      {item.approved} aprovados de {item.generated}{" "}
                      {item.basis === "decided" ? "decisões" : "gerados"}
                      {item.basis === "decided" && item.refused > 0
                        ? `, ${item.refused} recusados`
                        : ""}
                    </p>
                  </div>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/15">
                    {item.method === "credit_card" ? (
                      <CreditCard className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <ReceiptText className="h-5 w-5" aria-hidden="true" />
                    )}
                  </span>
                </div>
              </article>
            ))}
      </CardContent>
    </Card>
  );
}
