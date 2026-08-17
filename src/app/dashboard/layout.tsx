"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { RequireAuth } from "@/components/auth-guard";
import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { Toaster } from "@/components/ui/toaster";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isCheckoutBuilder = pathname === "/dashboard/checkout";
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <RequireAuth>
        <StoreProvider>
          {isCheckoutBuilder ? (
            <div className="min-h-screen bg-background">
              {children}
            </div>
          ) : (
            <div className="flex h-screen overflow-hidden bg-background">
              <Sidebar className="hidden md:flex" />
              {mobileSidebarOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Fechar menu"
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] md:hidden"
                    onClick={() => setMobileSidebarOpen(false)}
                  />
                  <Sidebar
                    className="fixed inset-y-0 left-0 z-50 flex md:hidden"
                    onNavigate={() => setMobileSidebarOpen(false)}
                  />
                </>
              )}
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden pt-16 md:pt-0">
                <DashboardHeader onMenuClick={() => setMobileSidebarOpen(true)} />
                <main className="min-w-0 flex-1 overflow-y-auto">
                  <div className="mx-auto min-w-0 max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
                </main>
              </div>
            </div>
          )}
          <Toaster />
        </StoreProvider>
      </RequireAuth>
    </AuthProvider>
  );
}
