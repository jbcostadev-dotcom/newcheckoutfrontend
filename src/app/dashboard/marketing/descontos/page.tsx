"use client";

import { useEffect, useState } from "react";
import { BadgePercent, CreditCard, Landmark, QrCode, Save } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import type { CheckoutSettings } from "@/types";

type DiscountField = "pix_discount_percentage" | "boleto_discount_percentage" | "card_discount_percentage";

const DEFAULT_DISCOUNTS: Record<DiscountField, number> = {
  pix_discount_percentage: 1,
  boleto_discount_percentage: 0,
  card_discount_percentage: 5,
};

const PAYMENT_METHODS: Array<{
  field: DiscountField;
  title: string;
  description: string;
  icon: typeof QrCode;
}> = [
  {
    field: "pix_discount_percentage",
    title: "PIX",
    description: "Exibido no card de pagamento e aplicado ao valor final no PIX.",
    icon: QrCode,
  },
  {
    field: "boleto_discount_percentage",
    title: "Boleto",
    description: "Exibido no card de pagamento e aplicado ao valor final no boleto.",
    icon: Landmark,
  },
  {
    field: "card_discount_percentage",
    title: "Cartão de crédito",
    description: "Exibido no card de pagamento e aplicado antes dos juros das parcelas.",
    icon: CreditCard,
  },
];

export default function PaymentDiscountsPage() {
  const { selectedStore } = useStore();
  const [discounts, setDiscounts] = useState(DEFAULT_DISCOUNTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedStore) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .get<CheckoutSettings>(`/stores/${selectedStore.id}/settings`)
      .then((settings) => {
        setDiscounts({
          pix_discount_percentage: Number(settings.pix_discount_percentage ?? 1),
          boleto_discount_percentage: Number(settings.boleto_discount_percentage ?? 0),
          card_discount_percentage: Number(settings.card_discount_percentage ?? 5),
        });
      })
      .catch(() => toast.error("Erro ao carregar os descontos."))
      .finally(() => setLoading(false));
  }, [selectedStore]);

  const updateDiscount = (field: DiscountField, value: string) => {
    const parsed = Number(value);
    setDiscounts((current) => ({
      ...current,
      [field]: Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 0,
    }));
  };

  const handleSave = async () => {
    if (!selectedStore) return;
    setSaving(true);
    try {
      await api.put(`/stores/${selectedStore.id}/settings`, discounts);
      toast.success("Descontos salvos com sucesso!");
    } catch {
      toast.error("Erro ao salvar os descontos.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Descontos"
        description="Defina descontos percentuais por forma de pagamento. Use 0% para não oferecer desconto."
        actions={
          <Button onClick={handleSave} disabled={!selectedStore || loading || saving}>
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar descontos"}
          </Button>
        }
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {PAYMENT_METHODS.map(({ field, title, description, icon: Icon }) => (
          <Card key={field}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="h-4 w-4" /> {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor={field}>Desconto (%)</Label>
              <div className="relative mt-2 max-w-44">
                <Input
                  id={field}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  inputMode="decimal"
                  value={discounts[field]}
                  disabled={loading || !selectedStore}
                  onChange={(event) => updateDiscount(field, event.target.value)}
                  className="pr-8"
                />
                <BadgePercent className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
