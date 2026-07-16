"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

function formatCents(value: number): string {
  return (value / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseCurrency(value: string): number | null {
  const cleaned = value.replace(/\D/g, "");
  const numeric = Number(cleaned);
  if (cleaned === "" || Number.isNaN(numeric)) return null;
  return numeric / 100;
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = "R$ 0,00",
  className,
  id,
}: CurrencyInputProps) {
  const displayValue = useMemo(() => {
    if (value === null || value === undefined || Number.isNaN(value)) return "";
    return formatCents(Math.round(value * 100));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!raw) {
      onChange(null);
      return;
    }
    const parsed = parseCurrency(raw);
    onChange(parsed);
  };

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        R$
      </span>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        className={cn("pl-9", className)}
      />
    </div>
  );
}
