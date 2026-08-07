"use client";

import { useCallback, useEffect, useState } from "react";
import { Award, LockKeyhole, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import { useStore } from "@/contexts/StoreContext";
import type { Achievement, AchievementsResponse } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AchievementsPage() {
  const { selectedStore } = useStore();
  const [data, setData] = useState<AchievementsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!selectedStore) return;
    setLoading(true);
    try {
      setData(await api.get<AchievementsResponse>(`/stores/${selectedStore.id}/achievements`));
    } finally {
      setLoading(false);
    }
  }, [selectedStore]);

  useEffect(() => { load(); }, [load]);

  if (!selectedStore) {
    return <Empty text="Selecione ou crie uma loja para acompanhar suas conquistas." />;
  }

  return (
    <div className="space-y-10 pb-10">
      <section className="rounded-2xl border bg-gradient-to-r from-primary/15 via-card to-card p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><Trophy className="h-4 w-4" /> jCheckout Conquistas</p>
            <h1 className="text-3xl font-bold tracking-tight">Seu próximo marco começa agora.</h1>
            <p className="mt-2 text-muted-foreground">Acompanhe os resultados de {selectedStore.name} e desbloqueie placas e emblemas.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-background/80 p-4"><p className="text-2xl font-bold">{data?.summary.unlocked_count ?? 0}</p><p className="text-xs text-muted-foreground">desbloqueadas</p></div>
            <div className="rounded-xl bg-background/80 p-4"><p className="text-2xl font-bold">{formatCurrency(data?.summary.revenue_total ?? 0)}</p><p className="text-xs text-muted-foreground">faturamento elegível</p></div>
          </div>
        </div>
      </section>

      <AchievementSection title="Placas jCheckout" subtitle="A materialização dos principais marcos da sua jornada." items={data?.plates ?? []} loading={loading} />
      <AchievementSection title="Emblemas jCheckout" subtitle="Conquistas que marcam o ritmo da sua operação." items={data?.badges ?? []} loading={loading} />
    </div>
  );
}

function AchievementSection({ title, subtitle, items, loading }: { title: string; subtitle: string; items: Achievement[]; loading: boolean }) {
  return (
    <section>
      <div className="mb-5"><h2 className="text-2xl font-bold">{title}</h2><p className="mt-1 text-muted-foreground">{subtitle}</p></div>
      {loading ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[360px] rounded-2xl" />)}</div> : items.length === 0 ? <Empty text="Ainda não há itens publicados nesta categoria." /> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{items.map((item) => <AchievementCard key={item.id} item={item} />)}</div>}
    </section>
  );
}

function AchievementCard({ item }: { item: Achievement }) {
  const current = item.is_monetary ? formatCurrency(item.current) : `${item.current} vendas`;
  const target = item.is_monetary ? formatCurrency(item.target) : `${item.target} vendas`;
  return (
    <Card className={cn("overflow-hidden border-primary/35 transition-shadow hover:shadow-lg", item.unlocked && "ring-1 ring-primary/50")}>
      <CardContent className="p-0">
        <div className={cn("relative flex h-48 items-center justify-center bg-muted/35 p-5", !item.unlocked && "grayscale opacity-70")}>
          {item.image_url ? <img src={item.image_url} alt={item.title} className="h-full max-w-full object-contain" /> : <Award className="h-24 w-24 text-primary/70" />}
          {!item.unlocked && <span className="absolute right-3 top-3 rounded-full bg-background/90 p-2 text-muted-foreground"><LockKeyhole className="h-4 w-4" /></span>}
        </div>
        <div className="space-y-4 p-5">
          <div><h3 className="font-bold">{item.title}</h3><p className="mt-1 min-h-5 text-sm text-muted-foreground">{item.subtitle}</p></div>
          <div className="space-y-2"><div className="flex justify-between text-xs"><span>{item.unlocked ? "Conquista desbloqueada" : `${current} / ${target}`}</span><span className="font-semibold text-primary">{item.unlocked ? "100" : item.progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${item.progress}%` }} /></div></div>
        </div>
      </CardContent>
    </Card>
  );
}

function Empty({ text }: { text: string }) { return <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{text}</div>; }
