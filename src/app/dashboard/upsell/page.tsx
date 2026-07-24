"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Upsell, UpsellFormData } from "@/types";
import { Zap, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UpsellFormDialog } from "@/components/upsell-form-dialog";

export default function UpsellPage() {
  const { selectedStore } = useStore();
  const [upsells, setUpsells] = useState<Upsell[]>([]);
  const [loading, setLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Upsell | null>(null);

  const fetchUpsells = async () => {
    if (!selectedStore) return;
    setLoading(true);
    try {
      const data = await api.get<Upsell[]>(`/stores/${selectedStore.id}/upsells`);
      setUpsells(data);
    } catch {
      toast.error("Erro ao carregar upsells.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpsells();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore]);

  const openCreate = () => {
    setEditing(null);
    setIsOpen(true);
  };

  const openEdit = (upsell: Upsell) => {
    setEditing(upsell);
    setIsOpen(true);
  };

  const handleSave = async (form: UpsellFormData) => {
    if (!selectedStore) return;
    try {
      if (editing) {
        await api.put(`/stores/${selectedStore.id}/upsells/${editing.id}`, form);
        toast.success("Upsell atualizado!");
      } else {
        await api.post(`/stores/${selectedStore.id}/upsells`, form);
        toast.success("Upsell criado!");
      }
      fetchUpsells();
    } catch {
      toast.error("Erro ao salvar upsell.");
      throw new Error("Erro ao salvar");
    }
  };

  const handleDelete = async (id: number) => {
    if (!selectedStore) return;
    if (!confirm("Remover este upsell?")) return;
    try {
      await api.delete(`/stores/${selectedStore.id}/upsells/${id}`);
      toast.success("Upsell removido!");
      fetchUpsells();
    } catch {
      toast.error("Erro ao remover upsell.");
    }
  };

  const handleToggleActive = async (upsell: Upsell) => {
    if (!selectedStore) return;
    try {
      await api.put(`/stores/${selectedStore.id}/upsells/${upsell.id}`, {
        is_active: !upsell.is_active,
      });
      toast.success(!upsell.is_active ? "Upsell ativado!" : "Upsell desativado!");
      fetchUpsells();
    } catch {
      toast.error("Erro ao atualizar status.");
    }
  };

  const formatDiscount = (u: Upsell) => {
    const value = Number(u.discount_value) || 0;
    return u.discount_type === "percent" ? `${value}%` : formatCurrency(value);
  };

  const formatPaymentMethods = (u: Upsell) => {
    const parts: string[] = [];
    if (u.show_credit_card) parts.push("Cartão");
    if (u.show_pix) parts.push("Pix");
    if (u.show_boleto) parts.push("Boleto");
    return parts.length > 0 ? parts.join(", ") : "Nenhuma";
  };

  return (
    <>
      <PageHeader
        title="Upsell"
        description="Crie ofertas especiais exibidas após a aprovação do pagamento para aumentar o ticket médio."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Novo upsell
          </Button>
        }
      />

      <Card className="mt-6">
        <CardContent className="py-4">
          <div>
            <p className="text-sm font-semibold">Como funciona</p>
            <p className="text-xs text-muted-foreground">
              As ofertas aparecem automaticamente após o pagamento aprovado no
              cartão ou PIX. Se o cliente aceitar, o valor é adicionado ao mesmo
              pedido.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 rounded-xl border bg-card">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : upsells.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="uppercase tracking-wide">Nome</TableHead>
                <TableHead className="uppercase tracking-wide">Produto</TableHead>
                <TableHead className="uppercase tracking-wide">Desconto</TableHead>
                <TableHead className="uppercase tracking-wide">Escopo</TableHead>
                <TableHead className="uppercase tracking-wide">Pagamentos</TableHead>
                <TableHead className="uppercase tracking-wide">Status</TableHead>
                <TableHead className="w-24 text-right uppercase tracking-wide">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upsells.map((upsell) => (
                <TableRow key={upsell.id}>
                  <TableCell className="font-medium">{upsell.name}</TableCell>
                  <TableCell>{upsell.product?.name ?? `#${upsell.product_id}`}</TableCell>
                  <TableCell>{formatDiscount(upsell)}</TableCell>
                  <TableCell>
                    {upsell.scope === "any" ? "Qualquer" : "Específico"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatPaymentMethods(upsell)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={upsell.is_active}
                      onCheckedChange={() => handleToggleActive(upsell)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(upsell)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(upsell.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={Zap}
            title="Nenhum upsell cadastrado"
            description="Crie ofertas pós-pagamento para aumentar o ticket médio das suas vendas."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Novo upsell
              </Button>
            }
            className="border-0"
          />
        )}
      </div>

      <UpsellFormDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        upsell={editing}
        onSave={handleSave}
      />
    </>
  );
}
