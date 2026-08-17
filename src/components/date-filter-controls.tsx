"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export type DatePreset = "today" | "yesterday" | "week" | "month" | "all" | "custom";

export interface DateFilterValue {
  preset: DatePreset;
  from: string;
  to: string;
}

interface DateFilterControlsProps {
  value: DateFilterValue;
  onChange: (value: DateFilterValue) => void;
}

const PRESETS: Array<{ value: Exclude<DatePreset, "custom">; label: string }> = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "all", label: "Todos" },
];

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function rangeForPreset(preset: Exclude<DatePreset, "custom">): DateFilterValue {
  if (preset === "all") {
    return { preset, from: "", to: "" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = new Date(today);

  if (preset === "yesterday") {
    from.setDate(from.getDate() - 1);
    return { preset, from: toDateInputValue(from), to: toDateInputValue(from) };
  }

  if (preset === "week") {
    from.setDate(from.getDate() - 6);
  }

  if (preset === "month") {
    from.setDate(1);
  }

  return { preset, from: toDateInputValue(from), to: toDateInputValue(today) };
}

function formatShortDate(value: string): string {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year.slice(-2)}`;
}

export function appendDateFilterParams(params: URLSearchParams, value: DateFilterValue) {
  if (!value.from || !value.to) return;

  const start = new Date(`${value.from}T00:00:00`);
  const endExclusive = new Date(`${value.to}T00:00:00`);
  endExclusive.setDate(endExclusive.getDate() + 1);

  params.set("start_at", start.toISOString());
  params.set("end_at", endExclusive.toISOString());
}

export function DateFilterControls({ value, onChange }: DateFilterControlsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(value.from || toDateInputValue(new Date()));
  const [draftTo, setDraftTo] = useState(value.to || toDateInputValue(new Date()));
  const invalidRange = !draftFrom || !draftTo || draftFrom > draftTo;

  const openCustomRange = () => {
    const today = toDateInputValue(new Date());
    setDraftFrom(value.from || today);
    setDraftTo(value.to || today);
    setDialogOpen(true);
  };

  const applyCustomRange = () => {
    if (invalidRange) return;
    onChange({ preset: "custom", from: draftFrom, to: draftTo });
    setDialogOpen(false);
  };

  return (
    <>
      <div className="flex shrink-0 items-center gap-1 rounded-md border border-input bg-background p-1">
        {PRESETS.map((preset) => (
          <Button
            key={preset.value}
            type="button"
            size="sm"
            variant={value.preset === preset.value ? "default" : "ghost"}
            className="h-8 px-3"
            aria-pressed={value.preset === preset.value}
            onClick={() => onChange(rangeForPreset(preset.value))}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <Button
        type="button"
        variant={value.preset === "custom" ? "default" : "outline"}
        className="shrink-0"
        aria-haspopup="dialog"
        onClick={openCustomRange}
      >
        <CalendarDays className="h-4 w-4" />
        {value.preset === "custom"
          ? `${formatShortDate(value.from)} - ${formatShortDate(value.to)}`
          : "Selecionar período"}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Selecionar período</DialogTitle>
            <DialogDescription>
              Escolha a data inicial e a data final para filtrar os registros.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Data inicial
              <Input
                type="date"
                value={draftFrom}
                max={draftTo || undefined}
                onChange={(event) => setDraftFrom(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Data final
              <Input
                type="date"
                value={draftTo}
                min={draftFrom || undefined}
                onChange={(event) => setDraftTo(event.target.value)}
              />
            </label>
          </div>

          {invalidRange && (
            <p className="text-sm text-destructive" role="alert">
              A data final deve ser igual ou posterior à data inicial.
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={invalidRange} onClick={applyCustomRange}>
              Aplicar período
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
