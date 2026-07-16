"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { ShippingMethod } from "@/types";
import { Plus, Pencil, Trash2, Truck } from "lucide-react";
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
  ShippingFormDialog,
  type ShippingMethodFormData,
} from "@/components/shipping-form-dialog";

function formatDeliveryDays(min: number, max: number): string {
  if (!min && !max) return "—";
  if (min === max) return `${min} dias`;
  if (!min) return `até ${max} dias`;
  if (!max) return `${min} dias`;
  return `${min}-${max} dias`;
}

export default function FretesPage() {
  const { selectedStore } = useStore();
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingMethod | null>(null);

  const fetchShippingMethods = async () => {
    if (!selectedStore) return;
    setLoading(true);
    try {
      const data = await api.get<ShippingMethod[]>(
        `/stores/${selectedStore.id}/shipping-methods`
      );
      setShippingMethods(data);
    } catch {
      toast.error("Erro ao carregar fretes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShippingMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore]);

  const openCreate = () => {
    setEditing(null);
    setIsOpen(true);
  };

  const openEdit = (sm: ShippingMethod) => {
    setEditing(sm);
    setIsOpen(true);
  };

  const handleSave = async (form: ShippingMethodFormData) => {
    if (!selectedStore) return;
    try {
      if (editing) {
        await api.put(
          `/stores/${selectedStore.id}/shipping-methods/${editing.id}`,
          form
        );
        toast.success("Frete atualizado!");
      } else {
        await api.post(`/stores/${selectedStore.id}/shipping-methods`, form);
        toast.success("Frete adicionado!");
      }
      fetchShippingMethods();
    } catch {
      toast.error("Erro ao salvar frete.");
      throw new Error("Erro ao salvar");
    }
  };

  const handleDelete = async (id: number) => {
    if (!selectedStore) return;
    if (!confirm("Remover este frete?")) return; // eslint-disable-line no-alert
    try {
      await api.delete(`/stores/${selectedStore.id}/shipping-methods/${id}`);
      toast.success("Frete removido!");
      fetchShippingMethods();
    } catch {
      toast.error("Erro ao remover frete.");
    }
  };

  return (
    <>
      <PageHeader
        title="Logísticas"
        description="Gerencie as formas de frete exibidas no checkout."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Novo frete
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
        ) : shippingMethods.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="uppercase tracking-wide">
                  Nome do Frete
                </TableHead>
                <TableHead className="uppercase tracking-wide">Valor</TableHead>
                <TableHead className="uppercase tracking-wide">Prazo</TableHead>
                <TableHead className="uppercase tracking-wide">Status</TableHead>
                <TableHead className="w-24 text-right uppercase tracking-wide">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shippingMethods.map((sm) => (
                <TableRow key={sm.id}>
                  <TableCell className="font-medium">{sm.name}</TableCell>
                  <TableCell>
                    {sm.price === null || sm.price === undefined
                      ? "Grátis"
                      : formatCurrency(sm.price)}
                  </TableCell>
                  <TableCell>
                    {formatDeliveryDays(sm.min_delivery_days, sm.max_delivery_days)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={sm.is_active ? "success" : "secondary"}>
                      {sm.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(sm)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(sm.id)}
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
            icon={Truck}
            title="Nenhum frete cadastrado"
            description="Adicione uma forma de envio para exibir no checkout."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Novo frete
              </Button>
            }
            className="border-0"
          />
        )}
      </div>

      <ShippingFormDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        shippingMethod={editing}
        onSave={handleSave}
      />
    </>
  );
}
