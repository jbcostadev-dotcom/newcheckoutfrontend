"use client";

import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { LiveCheckoutSession, LiveCheckoutResponse } from "@/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Radio, MapPin, User, CreditCard } from "lucide-react";

const STEP_LABEL: Record<LiveCheckoutSession["step"], string> = {
  dados: "Identificação",
  entrega: "Endereço",
  pagamento: "Pagamento",
};

const PAYMENT_LABEL: Record<string, string> = {
  pix: "PIX",
  credit_card: "Cartão",
  boleto: "Boleto",
};

function stepNumber(step: LiveCheckoutSession["step"]): number {
  return { dados: 1, entrega: 2, pagamento: 3 }[step] ?? 1;
}

export function LiveCheckoutCard() {
  const { selectedStore } = useStore();
  const [sessions, setSessions] = useState<LiveCheckoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!selectedStore) {
      setSessions([]);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<LiveCheckoutResponse>(
        `/stores/${selectedStore.id}/live-checkout`
      );
      setSessions(res.sessions ?? []);
    } catch {
      // ignore: não quebra o dashboard se o endpoint falhar
    } finally {
      setLoading(false);
    }
  }, [selectedStore]);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 3000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  return (
    <Card className="overflow-hidden border-border/80 bg-card shadow-[var(--panel-shadow)]">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#008A39]/10 text-[#008A39] dark:bg-[#008A39]/20 dark:text-[#00E55F]">
              <Radio className="h-4 w-4" aria-hidden="true" />
            </span>
            Checkout ao vivo
            {!loading && sessions.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {sessions.length}
              </Badge>
            )}
          </CardTitle>
          <p className="ml-10 mt-0.5 text-xs text-muted-foreground">
            Clientes que estão preenchendo o checkout agora
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          Ao vivo
        </div>
      </CardHeader>
      <CardContent className="px-5 py-4 sm:px-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center py-7 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Radio className="h-4 w-4" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium">Nenhum checkout ativo</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Novos clientes aparecerão aqui em tempo real.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-2 text-left font-medium">Etapa</th>
                  <th className="pb-2 text-left font-medium">Cliente</th>
                  <th className="pb-2 text-left font-medium">Localização</th>
                  <th className="pb-2 text-left font-medium">Pagamento</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sessions.map((session) => (
                  <tr key={session.session_id} className="group">
                    <td className="py-3 align-top">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {stepNumber(session.step)}
                        </div>
                        <span className="font-medium">
                          {STEP_LABEL[session.step]}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 align-top">
                      {session.customer_name ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-medium">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            {session.customer_name}
                          </div>
                          {session.customer_email && (
                            <div className="text-xs text-muted-foreground">
                              {session.customer_email}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          Anônimo
                        </span>
                      )}
                    </td>
                    <td className="py-3 align-top">
                      {session.cep ? (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{session.cep}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 align-top">
                      {session.payment_method ? (
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{PAYMENT_LABEL[session.payment_method]}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 align-top text-right">
                      <div className="font-semibold">
                        {formatCurrency(session.total)}
                      </div>
                      {session.items.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {session.items.reduce((sum, item) => sum + item.qty, 0)} item
                          {session.items.reduce((sum, item) => sum + item.qty, 0) > 1 ? "s" : ""}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LiveCheckoutCard;
