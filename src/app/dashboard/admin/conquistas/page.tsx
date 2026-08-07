"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, ImagePlus, Plus, RefreshCw, ShieldAlert, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import type { Achievement, AchievementMetric, AchievementType } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type FormState = {
  type: AchievementType;
  metric: AchievementMetric;
  target: string;
  title: string;
  subtitle: string;
  description: string;
  active: boolean;
  sort_order: string;
};

const METRICS: { value: AchievementMetric; label: string; monetary: boolean }[] = [
  { value: "revenue_total", label: "Faturamento acumulado", monetary: true },
  { value: "orders_paid", label: "Vendas aprovadas", monetary: false },
  { value: "revenue_24h", label: "Faturamento em 24 horas", monetary: true },
  { value: "orders_paid_24h", label: "Vendas em 24 horas", monetary: false },
];

const emptyForm = (): FormState => ({ type: "badge", metric: "revenue_total", target: "10000", title: "", subtitle: "", description: "", active: true, sort_order: "0" });

export default function AdminAchievementsPage() {
  const { user, loading: authLoading } = useAuth();
  const { selectedStore } = useStore();
  const router = useRouter();
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = useCallback(async () => {
    try { setItems(await api.get<Achievement[]>("/admin/achievements")); }
    catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!authLoading && user?.role !== "super_admin") router.replace("/dashboard");
  }, [authLoading, user, router]);
  useEffect(() => { if (user?.role === "super_admin") load(); }, [user, load]);

  const isMonetary = useMemo(() => METRICS.find((m) => m.value === form.metric)?.monetary ?? false, [form.metric]);
  const set = (key: keyof FormState, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));

  const beginCreate = () => { setEditing(null); setForm(emptyForm()); setOpen(true); };
  const beginEdit = (item: Achievement) => {
    setEditing(item);
    setForm({ type: item.type, metric: item.metric, target: String(item.target), title: item.title, subtitle: item.subtitle ?? "", description: item.description ?? "", active: item.active, sort_order: String(item.sort_order) });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !Number(form.target)) return;
    setSaving(true);
    try {
      const body = { ...form, target: Number(form.target), sort_order: Number(form.sort_order || 0), title: form.title.trim(), subtitle: form.subtitle.trim() || null, description: form.description.trim() || null };
      if (editing) await api.put(`/admin/achievements/${editing.id}`, body);
      else await api.post("/admin/achievements", body);
      setOpen(false); await load();
    } finally { setSaving(false); }
  };

  const upload = async (item: Achievement, file?: File) => {
    if (!file) return;
    const data = new FormData(); data.append("image", file);
    await api.post(`/admin/achievements/${item.id}/image`, data);
    await load();
  };
  const deactivate = async (item: Achievement) => {
    if (!confirm(`Desativar “${item.title}”? O histórico de quem já conquistou será mantido.`)) return;
    await api.delete(`/admin/achievements/${item.id}`); await load();
  };
  const recalculate = async () => {
    if (!selectedStore) return;
    await api.post(`/admin/stores/${selectedStore.id}/achievements/recalculate`);
    alert("Conquistas da loja selecionada foram recalculadas.");
  };

  if (authLoading || user?.role !== "super_admin") return <div className="p-8 text-sm text-muted-foreground">Verificando permissão…</div>;

  return (
    <div className="space-y-7 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><p className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><ShieldAlert className="h-4 w-4" /> Administração da plataforma</p><h1 className="text-3xl font-bold">Conquistas jCheckout</h1><p className="mt-1 text-muted-foreground">Crie, publique e ajuste metas globais de placas e emblemas.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={recalculate} disabled={!selectedStore}><RefreshCw className="mr-2 h-4 w-4" /> Recalcular loja</Button><Button onClick={beginCreate}><Plus className="mr-2 h-4 w-4" /> Adicionar conquista</Button></div>
      </div>
      <Card><CardHeader><CardTitle>Catálogo publicado</CardTitle></CardHeader><CardContent>
        {loading ? <p className="text-sm text-muted-foreground">Carregando catálogo…</p> : <div className="divide-y">{items.map((item) => <div key={item.id} className="flex flex-col gap-4 py-4 md:flex-row md:items-center"><div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">{item.image_url ? <img src={item.image_url} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-5 w-5 text-muted-foreground" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{item.title}</h2><span className={`rounded-full px-2 py-0.5 text-xs ${item.active ? "bg-emerald-500/15 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{item.active ? "Publicada" : "Desativada"}</span></div><p className="text-sm text-muted-foreground">{item.type === "plate" ? "Placa" : "Emblema"} · {METRICS.find((m) => m.value === item.metric)?.label} · Meta: {item.is_monetary ? formatCurrency(item.target) : `${item.target} vendas`}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" asChild><label className="cursor-pointer"><ImagePlus className="mr-1 h-4 w-4" /> Arte<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => upload(item, e.target.files?.[0])} /></label></Button><Button variant="outline" size="sm" onClick={() => beginEdit(item)}><Edit3 className="mr-1 h-4 w-4" /> Editar</Button>{item.active && <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deactivate(item)}><Trash2 className="h-4 w-4" /></Button>}</div></div>)}</div>}
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{editing ? "Editar conquista" : "Nova conquista"}</DialogTitle><DialogDescription>As metas são avaliadas somente com pedidos pagos. Faturamento usa reais; vendas usa unidades.</DialogDescription></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2"><Field label="Tipo"><Select value={form.type} onValueChange={(v) => set("type", v as AchievementType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="badge">Emblema</SelectItem><SelectItem value="plate">Placa</SelectItem></SelectContent></Select></Field><Field label="Regra"><Select value={form.metric} onValueChange={(v) => set("metric", v as AchievementMetric)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{METRICS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select></Field><Field label={isMonetary ? "Meta (R$)" : "Meta (vendas)"}><Input type="number" min="1" step={isMonetary ? "0.01" : "1"} value={form.target} onChange={(e) => set("target", e.target.value)} /></Field><Field label="Ordem"><Input type="number" min="0" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} /></Field><div className="sm:col-span-2"><Field label="Título"><Input maxLength={255} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex.: Primeira Venda" /></Field></div><div className="sm:col-span-2"><Field label="Subtítulo"><Input maxLength={255} value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="Ex.: 1 pagamento aprovado" /></Field></div><div className="sm:col-span-2"><Field label="Descrição"><Textarea maxLength={2000} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field></div><div className="flex items-center gap-3 sm:col-span-2"><Switch checked={form.active} onCheckedChange={(v) => set("active", v)} /><Label>Publicar esta conquista</Label></div></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button><Button onClick={save} disabled={saving || !form.title.trim() || Number(form.target) <= 0}>{saving ? "Salvando…" : "Salvar conquista"}</Button></div></DialogContent></Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
