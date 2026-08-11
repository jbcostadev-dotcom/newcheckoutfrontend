import { BarChart3, TrendingUp } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import type { SalesSeriesPoint } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const WIDTH = 960;
const HEIGHT = 300;
const MARGIN = { top: 30, right: 24, bottom: 42, left: 62 };

function compactCurrency(value: number) {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)} mi`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1)} mil`;
  return `R$ ${Math.round(value)}`;
}

function roundedChartMax(value: number) {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil((value * 1.16) / magnitude) * magnitude;
}

function smoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";

  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const middleX = (previous.x + point.x) / 2;
    return `${path} C ${middleX} ${previous.y}, ${middleX} ${point.y}, ${point.x} ${point.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
}

interface SalesPeakChartProps {
  data: SalesSeriesPoint[];
  periodLabel: string;
  conversion: number;
  loading?: boolean;
}

export function SalesPeakChart({
  data,
  periodLabel,
  conversion,
  loading = false,
}: SalesPeakChartProps) {
  const chartWidth = WIDTH - MARGIN.left - MARGIN.right;
  const chartHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const highestValue = Math.max(...data.map((point) => point.value), 0);
  const hasSales = highestValue > 0;
  const chartMax = roundedChartMax(highestValue);
  const denominator = Math.max(data.length - 1, 1);
  const points = data.map((point, index) => ({
    x: MARGIN.left + (index / denominator) * chartWidth,
    y: MARGIN.top + chartHeight - (point.value / chartMax) * chartHeight,
  }));
  const linePath = smoothPath(points);
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${MARGIN.top + chartHeight} L ${points[0].x} ${MARGIN.top + chartHeight} Z`
    : "";
  const peakIndex = data.reduce(
    (bestIndex, point, index) =>
      point.value > (data[bestIndex]?.value ?? -1) ? index : bestIndex,
    0,
  );
  const peak = data[peakIndex];
  const peakPoint = points[peakIndex];
  const total = data.reduce((sum, point) => sum + point.value, 0);
  const tooltipX = peakPoint
    ? Math.min(Math.max(peakPoint.x - 58, MARGIN.left), WIDTH - 146)
    : MARGIN.left;

  return (
    <Card className="overflow-hidden border-border/80 bg-card shadow-[var(--panel-shadow)]">
      <CardHeader className="flex flex-col gap-5 border-b border-border/70 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#008A39]/12 text-[#00b94d] dark:bg-[#008A39]/20 dark:text-[#00E55F]">
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Pico de vendas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Receita aprovada no período de {periodLabel.toLowerCase()}.
            </p>
          </div>
        </div>
        <div className="flex items-end gap-5 sm:text-right">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Receita</p>
            <p className="font-mono text-xl font-bold tracking-tight">
              {formatCurrency(total)}
            </p>
          </div>
          <div className="rounded-lg bg-[#008A39]/10 px-3 py-2 text-left dark:bg-[#008A39]/18">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#007a33] dark:text-[#72f29f]">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              {conversion.toFixed(1)}%
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">conversão</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="h-[340px] animate-pulse bg-gradient-to-b from-muted/35 to-transparent" />
        ) : (
          <div className="overflow-x-auto px-2 pb-2 pt-4 sm:px-4">
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="h-auto min-w-[720px] w-full"
              role="img"
              aria-labelledby="sales-chart-title sales-chart-description"
            >
              <title id="sales-chart-title">Pico de vendas em {periodLabel}</title>
              <desc id="sales-chart-description">
                Gráfico de área com a receita aprovada em cada intervalo do período selecionado.
              </desc>
              <defs>
                <linearGradient id="sales-area-green" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#008A39" stopOpacity="0.34" />
                  <stop offset="100%" stopColor="#008A39" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {[0, 1, 2, 3, 4].map((step) => {
                const y = MARGIN.top + (step / 4) * chartHeight;
                const value = hasSales ? chartMax - (step / 4) * chartMax : 0;
                return (
                  <g key={step}>
                    <line
                      x1={MARGIN.left}
                      x2={WIDTH - MARGIN.right}
                      y1={y}
                      y2={y}
                      stroke="currentColor"
                      className="text-border/70"
                      strokeDasharray={step === 4 ? undefined : "3 7"}
                    />
                    {(hasSales || step === 4) && (
                      <text
                        x={MARGIN.left - 12}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-muted-foreground text-[10px]"
                      >
                        {compactCurrency(value)}
                      </text>
                    )}
                  </g>
                );
              })}

              {areaPath && <path d={areaPath} fill="url(#sales-area-green)" />}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#008A39"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {!hasSales && (
                <text
                  x={MARGIN.left + chartWidth / 2}
                  y={MARGIN.top + chartHeight / 2}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[12px]"
                >
                  Sem vendas aprovadas no período
                </text>
              )}

              {data.map((point, index) => (
                <text
                  key={`${point.label}-${index}`}
                  x={points[index].x}
                  y={HEIGHT - 14}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {point.label}
                </text>
              ))}

              {peak && peak.value > 0 && peakPoint && (
                <g>
                  <line
                    x1={peakPoint.x}
                    x2={peakPoint.x}
                    y1={peakPoint.y + 8}
                    y2={MARGIN.top + chartHeight}
                    stroke="#008A39"
                    strokeWidth="1"
                    strokeDasharray="4 5"
                    opacity="0.8"
                  />
                  <circle cx={peakPoint.x} cy={peakPoint.y} r="7" fill="#0e0e11" stroke="#00E55F" strokeWidth="3" />
                  <rect
                    x={tooltipX}
                    y={Math.max(peakPoint.y - 58, 4)}
                    width="122"
                    height="45"
                    rx="10"
                    fill="#151519"
                    stroke="#2f2f36"
                  />
                  <text
                    x={tooltipX + 12}
                    y={Math.max(peakPoint.y - 34, 28)}
                    fill="#f7f7f8"
                    className="text-[11px] font-semibold"
                  >
                    {compactCurrency(peak.value)}
                  </text>
                  <text
                    x={tooltipX + 12}
                    y={Math.max(peakPoint.y - 18, 44)}
                    fill="#a1a1aa"
                    className="text-[9px]"
                  >
                    {peak.orders} {peak.orders === 1 ? "venda" : "vendas"} em {peak.label}
                  </text>
                </g>
              )}
            </svg>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
