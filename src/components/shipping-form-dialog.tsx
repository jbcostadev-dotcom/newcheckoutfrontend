"use client";

import { useEffect, useState } from "react";
import { Check, CircleCheck, CircleDashed, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShippingMethod, ShippingMethodIcon } from "@/types";
import { SHIPPING_METHOD_ICON_LABEL } from "@/types";
import {
  CorreiosIcon,
  SedexIcon,
  JadlogIcon,
  LoggiIcon,
  FullIcon,
} from "@/components/icons/carrier-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/currency-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ShippingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shippingMethod?: ShippingMethod | null;
  onSave: (data: ShippingMethodFormData) => Promise<void>;
}

export interface ShippingMethodFormData {
  name: string;
  price: number | null;
  min_value_free_shipping: number | null;
  min_delivery_days: number;
  max_delivery_days: number;
  icon: ShippingMethodIcon;
  is_active: boolean;
}

const EMPTY_FORM: ShippingMethodFormData = {
  name: "",
  price: null,
  min_value_free_shipping: null,
  min_delivery_days: 0,
  max_delivery_days: 0,
  icon: null,
  is_active: true,
};

const ICON_OPTIONS: { value: ShippingMethodIcon; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "correios", label: SHIPPING_METHOD_ICON_LABEL.correios, icon: CorreiosIcon },
  { value: "sedex", label: SHIPPING_METHOD_ICON_LABEL.sedex, icon: SedexIcon },
  { value: "jadlog", label: SHIPPING_METHOD_ICON_LABEL.jadlog, icon: JadlogIcon },
  { value: "loggi", label: SHIPPING_METHOD_ICON_LABEL.loggi, icon: LoggiIcon },
  { value: "full", label: SHIPPING_METHOD_ICON_LABEL.full, icon: FullIcon },
  { value: null, label: "Sem Ícone", icon: Package },
];

export function ShippingFormDialog({
  open,
  onOpenChange,
  shippingMethod,
  onSave,
}: ShippingFormDialogProps) {
  const [form, setForm] = useState<ShippingMethodFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(shippingMethod);

  useEffect(() => {
    if (open) {
      if (shippingMethod) {
        setForm({
          name: shippingMethod.name,
          price: shippingMethod.price,
          min_value_free_shipping: shippingMethod.min_value_free_shipping,
          min_delivery_days: shippingMethod.min_delivery_days,
          max_delivery_days: shippingMethod.max_delivery_days,
          icon: shippingMethod.icon,
          is_active: shippingMethod.is_active,
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [open, shippingMethod]);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Frete" : "Novo Frete"}
          </DialogTitle>
          <DialogDescription>
            Configure as opções de envio que serão exibidas no checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[1fr_280px]">
          <div className="space-y-5">
            {/* Nome do envio */}
            <div className="space-y-2">
              <Label htmlFor="shipping-name">Nome do envio</Label>
              <Input
                id="shipping-name"
                placeholder="Frete grátis"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                autoFocus
              />
            </div>

            {/* Preço e valor mínimo */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shipping-price">Preço do frete</Label>
                <CurrencyInput
                  id="shipping-price"
                  value={form.price}
                  onChange={(price) => setForm((f) => ({ ...f, price }))}
                  placeholder="0,00"
                />
                <p className="text-xs text-muted-foreground">
                  Deixe em branco caso seja grátis.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipping-min-value">
                  Valor mínimo para aplicar frete grátis
                </Label>
                <CurrencyInput
                  id="shipping-min-value"
                  value={form.min_value_free_shipping}
                  onChange={(min_value_free_shipping) =>
                    setForm((f) => ({ ...f, min_value_free_shipping }))
                  }
                  placeholder="0,00"
                />
                <p className="text-xs text-muted-foreground">
                  Deixe em branco caso não tenha valor mínimo.
                </p>
              </div>
            </div>

            {/* Prazos */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shipping-min-days">Prazo mínimo de entrega</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="shipping-min-days"
                    type="number"
                    min={0}
                    value={form.min_delivery_days}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        min_delivery_days: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-28"
                  />
                  <span className="text-sm text-muted-foreground">Dias</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Coloque 0 para não mostrar um prazo no checkout.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipping-max-days">Prazo máximo de entrega</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="shipping-max-days"
                    type="number"
                    min={0}
                    value={form.max_delivery_days}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        max_delivery_days: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-28"
                  />
                  <span className="text-sm text-muted-foreground">Dias</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Coloque 0 para não mostrar um prazo no checkout.
                </p>
              </div>
            </div>

            {/* Ícones */}
            <div className="space-y-2">
              <Label>Ícone do frete</Label>
              <div className="grid grid-cols-3 gap-3">
                {ICON_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const selected = form.icon === option.value;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, icon: option.value }))
                      }
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 rounded-lg border px-3 py-3 text-sm font-medium transition-colors",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:bg-accent"
                      )}
                    >
                      <Icon className={cn("h-5 w-5", selected ? "text-primary-foreground" : "text-muted-foreground")} />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="shipping-status">Status da Logística</Label>
            <Select
              value={form.is_active ? "active" : "inactive"}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, is_active: v === "active" }))
              }
            >
              <SelectTrigger id="shipping-status" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  <span className="flex items-center gap-2">
                    <CircleCheck className="h-4 w-4 text-emerald-500" />
                    Ativo
                  </span>
                </SelectItem>
                <SelectItem value="inactive">
                  <span className="flex items-center gap-2">
                    <CircleDashed className="h-4 w-4 text-muted-foreground" />
                    Inativo
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !form.name.trim()}
          >
            {saving ? "Salvando..." : isEditing ? "Salvar" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ShippingFormDialog;
