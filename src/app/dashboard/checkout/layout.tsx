"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { Toaster } from "@/components/ui/toaster";

export default function CheckoutBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <StoreProvider>
        <div className="min-h-screen bg-background">
          {children}
        </div>
        <Toaster />
      </StoreProvider>
    </AuthProvider>
  );
}
