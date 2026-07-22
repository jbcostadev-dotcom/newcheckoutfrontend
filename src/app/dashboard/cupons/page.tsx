"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Coupon, CouponFormData } from "@/types";
import { TicketPercent, Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { CouponFormDialog } from "@/components/coupon-form-dialog";

export default function CouponsPage() {
  const { selectedStore } = useStore();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  const fetchCoupons = async () => {
    if (!selectedStore) return;
    setLoading(true);
    try {
      const data = await api.get<Coupon[]>(
        `/stores/${selectedStore.id}/coupons`
      );
      setCoupons(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar cupons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore]);

  const filteredCoupons = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return coupons;
    return coupons.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.code.toLowerCase().includes(term)
    );
  }, [coupons, search]);

  const openCreate = () => {
    setEditing(null);
    setIsOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setIsOpen(true);
  };

  const handleSave = async (form: CouponFormData) => {
    if (!selectedStore) return;
    try {
      if (editing) {
        await api.put(
          `/stores/${selectedStore.id}/coupons/${editing.id}`,
          form
        );
        toast.success("Cupom atualizado!");
      } else {
        await api.post(`/stores/${selectedStore.id}/coupons`, form);
        toast.success("Cupom criado!");
      }
      fetchCoupons();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao salvar cupom.";
      toast.error(message);
      throw err;
    }
  };

  const handleDelete = async (id: number) => {
    if (!selectedStore || !confirm("Remover este cupom?")) return;
    try {
      await api.delete(`/stores/${selectedStore.id}/coupons/${id}`);
      toast.success("Cupom removido!");
      fetchCoupons();
    } catch {
      toast.error("Erro ao remover cupom.");
    }
  };

  const formatDiscount = (coupon: Coupon) => {
    const value = Number(coupon.discount_value) || 0;
    return coupon.discount_type === "percent"
      ? `${value}%`
      : formatCurrency(value);
  };

  const formatPeriod = (coupon: Coupon) => {
    const start = new Date(coupon.starts_at);
    const end = new Date(coupon.expires_at);
    return `${start.toLocaleDateString("pt-BR")} até ${end.toLocaleDateString(
      "pt-BR"
    )}`;
  };

  return (
    <>
      <PageHeader
        title="Cupons"
        description="Crie e gerencie cupons de desconto para sua loja."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Novo cupom
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-card">
        {loading ? (
          <div className="space-y-4 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : filteredCoupons.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="uppercase tracking-wide">Código</TableHead>
                <TableHead className="uppercase tracking-wide">Nome</TableHead>
                <TableHead className="uppercase tracking-wide">Desconto</TableHead>
                <TableHead className="uppercase tracking-wide">Vigência</TableHead>
                <TableHead className="uppercase tracking-wide">Usos</TableHead>
                <TableHead className="uppercase tracking-wide">Status</TableHead>
                <TableHead className="w-24 text-right uppercase tracking-wide">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono font-medium">
                    {coupon.code}
                  </TableCell>
                  <TableCell>{coupon.name}</TableCell>
                  <TableCell>{formatDiscount(coupon)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatPeriod(coupon)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {coupon.max_uses > 0
                      ? `${coupon.used_count} / ${coupon.max_uses}`
                      : `${coupon.used_count} / ∞`}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={coupon.status === "active" ? "success" : "secondary"}
                    >
                      {coupon.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(coupon)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(coupon.id)}
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
            icon={TicketPercent}
            title="Nenhum cupom cadastrado"
            description="Crie cupons de desconto para atrair mais clientes."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Criar primeiro cupom
              </Button>
            }
            className="border-0"
          />
        )}
      </div>

      <CouponFormDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        coupon={editing}
        onSave={handleSave}
      />
    </>
  );
}
