"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
}

function formatBrazilianPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value = "", onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatBrazilianPhone(e.target.value);
      onChange?.(formatted);
    };

    return (
      <div
        className={cn(
          "flex h-10 items-center overflow-hidden rounded-md border border-input bg-input ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          className
        )}
      >
        <div className="flex h-full shrink-0 items-center gap-2 border-r border-input bg-muted/30 px-3 text-sm text-muted-foreground">
          <span className="text-base">🇧🇷</span>
          <span>+55</span>
        </div>
        <input
          ref={ref}
          type="tel"
          inputMode="tel"
          className="h-full flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          value={value}
          onChange={handleChange}
          placeholder="(00) 00000-0000"
          {...props}
        />
      </div>
    );
  }
);
PhoneInput.displayName = "PhoneInput";
