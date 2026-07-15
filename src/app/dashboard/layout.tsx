"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { Sidebar } from "@/components/Sidebar";
import { Toaster } from "@/components/ui/toaster";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <StoreProvider>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl p-6 lg:p-8">{children}</div>
          </main>
        </div>
        <Toaster />
      </StoreProvider>
    </AuthProvider>
  );
}
