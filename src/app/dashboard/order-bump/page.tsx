"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { OrderBump, OrderBumpFormData } from "@/types";
import { Sparkles, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  OrderBumpFormDialog,
} from "@/components/order-bump-form-dialog";

export default function OrderBumpPage() {
  const { selectedStore } = useStore();
  const [bumps, setBumps] = useState<OrderBump[]>([]);
  const [loading, setLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<OrderBump | null>(null);

  const fetchBumps = async () => {
    if (!selectedStore) return;
    setLoading(true);
    try {
      const data = await api.get<OrderBump[]>(
        `/stores/${selectedStore.id}/order-bumps`
      );
      setBumps(data);
    } catch {
      toast.error("Erro ao carregar order bumps.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBumps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore]);

  const openCreate = () => {
    setEditing(null);
    setIsOpen(true);
  };

  const openEdit = (bump: OrderBump) => {
    setEditing(bump);
    setIsOpen(true);
  };

  const handleSave = async (form: OrderBumpFormData) => {
    if (!selectedStore) return;
    try {
      if (editing) {
        await api.put(
          `/stores/${selectedStore.id}/order-bumps/${editing.id}`,
          form
        );
        toast.success("Order bump atualizado!");
      } else {
        await api.post(`/stores/${selectedStore.id}/order-bumps`, form);
        toast.success("Order bump criado!");
      }
      fetchBumps();
    } catch {
      toast.error("Erro ao salvar order bump.");
      throw new Error("Erro ao salvar");
    }
  };

  const handleDelete = async (id: number) => {
    if (!selectedStore) return;
    if (!confirm("Remover este order bump?")) return;
    try {
      await api.delete(`/stores/${selectedStore.id}/order-bumps/${id}`);
      toast.success("Order bump removido!");
      fetchBumps();
    } catch {
      toast.error("Erro ao remover order bump.");
    }
  };

  const formatDiscount = (b: OrderBump) => {
    const value = Number(b.discount_value) || 0;
    return b.discount_type === "percent" ? `${value}%` : formatCurrency(value);
  };

  const formatPaymentMethods = (b: OrderBump) => {
    const parts: string[] = [];
    if (b.show_credit_card) parts.push("Cartão");
    if (b.show_pix) parts.push("Pix");
    if (b.show_boleto) parts.push("Boleto");
    return parts.length > 0 ? parts.join(", ") : "Nenhuma";
  };

  return (
    <>
      <PageHeader
        title="Order Bump"
        description="Crie ofertas adicionais exibidas no checkout para aumentar o ticket médio."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Novo order bump
          </Button>
        }
      />

      <div className="mt-6 rounded-xl border bg-card">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : bumps.length > 0 ? (
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
              {bumps.map((bump) => (
                <TableRow key={bump.id}>
                  <TableCell className="font-medium">{bump.name}</TableCell>
                  <TableCell>{bump.product?.name ?? `#${bump.product_id}`}</TableCell>
                  <TableCell>{formatDiscount(bump)}</TableCell>
                  <TableCell>
                    {bump.scope === "any" ? "Qualquer" : "Específico"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatPaymentMethods(bump)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={bump.is_active ? "success" : "secondary"}>
                      {bump.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(bump)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(bump.id)}
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
            icon={Sparkles}
            title="Nenhum order bump cadastrado"
            description="Crie ofertas adicionais que aparecem no checkout para aumentar o ticket médio."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Novo order bump
              </Button>
            }
            className="border-0"
          />
        )}
      </div>

      <OrderBumpFormDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        orderBump={editing}
        onSave={handleSave}
      />
    </>
  );
}