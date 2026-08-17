"use client";

import { useEffect, useState } from "react";
import { Gift as GiftIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { GiftFormDialog } from "@/components/gift-form-dialog";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Gift, GiftFormData } from "@/types";

const RULE_LABELS = {
  always: "Sempre mostrar",
  min_quantity: "Quantidade mínima",
  min_value: "Valor mínimo",
};

const formatDate = (value: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value));

export default function GiftsPage() {
  const { selectedStore } = useStore();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Gift | null>(null);

  const fetchGifts = async () => {
    if (!selectedStore) return;
    setLoading(true);
    try {
      setGifts(await api.get<Gift[]>(`/stores/${selectedStore.id}/gifts`));
    } catch {
      toast.error("Erro ao carregar brindes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Keep the list synchronized with the store selected in the dashboard shell.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchGifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore]);

  const save = async (form: GiftFormData) => {
    if (!selectedStore) return;
    try {
      if (editing) {
        await api.put(`/stores/${selectedStore.id}/gifts/${editing.id}`, form);
        toast.success("Brinde atualizado.");
      } else {
        await api.post(`/stores/${selectedStore.id}/gifts`, form);
        toast.success("Brinde criado.");
      }
      await fetchGifts();
    } catch {
      toast.error("Erro ao salvar brinde.");
      throw new Error("Erro ao salvar brinde");
    }
  };

  const remove = async (gift: Gift) => {
    if (!selectedStore || !confirm(`Remover o brinde ${gift.name}?`)) return;
    try {
      await api.delete(`/stores/${selectedStore.id}/gifts/${gift.id}`);
      toast.success("Brinde removido.");
      await fetchGifts();
    } catch {
      toast.error("Erro ao remover brinde.");
    }
  };

  const ruleDescription = (gift: Gift) => {
    if (gift.rule_type === "min_quantity") return `${gift.min_quantity ?? 0} itens`;
    if (gift.rule_type === "min_value") return formatCurrency(Number(gift.min_value ?? 0));
    return "Todos os carrinhos";
  };

  return (
    <>
      <PageHeader
        title="Brindes"
        description="Ofereça produtos gratuitos quando o carrinho atender às regras da campanha."
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4" /> Novo brinde
          </Button>
        }
      />

      <div className="mt-6 overflow-hidden rounded-xl border bg-card">
        {loading ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : gifts.length === 0 ? (
          <EmptyState
            icon={GiftIcon}
            title="Nenhum brinde cadastrado"
            description="Crie uma campanha e escolha as variantes que serão exibidas no resumo do checkout."
            action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Novo brinde</Button>}
            className="border-0"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Regra</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Escopo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gifts.map((gift) => (
                <TableRow key={gift.id}>
                  <TableCell className="font-medium">{gift.name}</TableCell>
                  <TableCell>
                    <div className="max-w-52">
                      <p className="truncate text-sm">{gift.products[0]?.parent_title || gift.products[0]?.name || "Produto removido"}</p>
                      <p className="text-xs text-muted-foreground">{gift.products.length} variante{gift.products.length === 1 ? "" : "s"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{RULE_LABELS[gift.rule_type]}</p>
                    <p className="text-xs text-muted-foreground">{ruleDescription(gift)}</p>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(gift.starts_at)} a {formatDate(gift.expires_at)}</TableCell>
                  <TableCell>{gift.scope === "any" ? "Qualquer produto" : "Produto específico"}</TableCell>
                  <TableCell><Badge variant={gift.is_active ? "success" : "secondary"}>{gift.is_active ? "Ativo" : "Inativo"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(gift); setOpen(true); }} aria-label="Editar brinde"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => remove(gift)} aria-label="Remover brinde"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <GiftFormDialog open={open} onOpenChange={setOpen} gift={editing} onSave={save} />
    </>
  );
}
