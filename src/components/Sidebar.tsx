"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Palette,
  CreditCard,
  Plug,
  Settings,
  Store as StoreIcon,
  Plus,
  Moon,
  Sun,
  LogOut,
  ShoppingCart,
  Globe,
  Truck,
  Users,
  Sparkles,
} from "lucide-react";

import { cn, initials } from "@/lib/utils";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: (path: string) => boolean;
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Loja",
    items: [
      {
        href: "/dashboard",
        label: "Visão Geral",
        icon: LayoutDashboard,
        match: (p) => p === "/dashboard",
      },
      {
        href: "/dashboard/orders",
        label: "Pedidos",
        icon: ShoppingCart,
        match: (p) => p.startsWith("/dashboard/orders"),
      },
      {
        href: "/dashboard/products",
        label: "Produtos",
        icon: Package,
        match: (p) => p.startsWith("/dashboard/products"),
      },
      {
        href: "/dashboard/clientes",
        label: "Clientes",
        icon: Users,
        match: (p) => p.startsWith("/dashboard/clientes"),
      },
    ],
  },
  {
    section: "Configurar",
    items: [
      {
        href: "/dashboard/checkout",
        label: "Checkout",
        icon: Palette,
        match: (p) => p.startsWith("/dashboard/checkout"),
      },
      {
        href: "/dashboard/order-bump",
        label: "Order Bump",
        icon: Sparkles,
        match: (p) => p.startsWith("/dashboard/order-bump"),
      },
      {
        href: "/dashboard/fretes",
        label: "Fretes",
        icon: Truck,
        match: (p) => p.startsWith("/dashboard/fretes"),
      },
      {
        href: "/dashboard/gateways",
        label: "Gateways",
        icon: CreditCard,
        match: (p) => p.startsWith("/dashboard/gateways"),
      },
      {
        href: "/dashboard/integrations",
        label: "Integrações",
        icon: Plug,
        match: (p) => p.startsWith("/dashboard/integrations"),
      },
      {
        href: "/dashboard/domains",
        label: "Domínios",
        icon: Globe,
        match: (p) => p.startsWith("/dashboard/domains"),
      },
    ],
  },
  {
    section: "Sistema",
    items: [
      {
        href: "/dashboard/settings",
        label: "Configurações",
        icon: Settings,
        match: (p) => p.startsWith("/dashboard/settings"),
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { stores, selectedStore, setSelectedStoreById, addStore } = useStore();
  const { user, logout } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"Shopify" | "Landing Page">("Shopify");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const ok = await addStore({ name: name.trim(), type });
    setSaving(false);
    if (ok) {
      setName("");
      setType("Shopify");
      setIsOpen(false);
    }
  };

  const isActive = (item: NavItem) =>
    item.match ? item.match(pathname) : pathname.startsWith(item.href);

  return (
    <>
      <aside className="flex w-64 shrink-0 flex-col border-r bg-card">
        {/* Brand */}
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-tight">
              Checkout PRO
            </span>
            <span className="text-[11px] text-muted-foreground">Painel</span>
          </div>
        </div>

        {/* Store selector + create */}
        <div className="space-y-2 border-b p-4">
          <Label className="text-xs font-medium text-muted-foreground">
            Loja selecionada
          </Label>
          {selectedStore ? (
            <Select
              value={selectedStore.id}
              onValueChange={setSelectedStoreById}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stores.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <StoreIcon className="h-3.5 w-3.5 opacity-60" />
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma loja</p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setIsOpen(true)}
          >
            <Plus className="h-4 w-4" /> Nova loja
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-6 overflow-y-auto p-3">
          {NAV.map((group) => (
            <div key={group.section} className="space-y-1">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.section}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="flex items-center gap-2 border-t p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex-1 justify-start gap-2 px-2"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  {initials(user?.name)}
                </span>
                <span className="flex flex-col items-start leading-none">
                  <span className="max-w-[120px] truncate text-xs font-medium">
                    {user?.name ?? "Usuário"}
                  </span>
                  <span className="max-w-[120px] truncate text-[10px] text-muted-foreground">
                    {user?.email}
                  </span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
        </div>
      </aside>

      {/* Create store dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar nova loja</DialogTitle>
            <DialogDescription>
              Configure uma nova loja para começar a vender. Você poderá conectar
              Shopify ou usar como landing page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store-name">Nome da loja</Label>
              <Input
                id="store-name"
                placeholder="Ex: Minha Loja Incrível"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-type">Tipo</Label>
              <Select
                value={type}
                onValueChange={(v) =>
                  setType(v as "Shopify" | "Landing Page")
                }
              >
                <SelectTrigger id="store-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Shopify">Shopify</SelectItem>
                  <SelectItem value="Landing Page">Landing Page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={saving || !name.trim()}>
              {saving ? "Criando..." : "Criar loja"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
