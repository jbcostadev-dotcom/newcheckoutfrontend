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
  ShoppingCart,
  Globe,
  Truck,
  Users,
  Sparkles,
  TicketPercent,
  Zap,
  MessageCircle,
  LayoutGrid,
  Mail,
  ExternalLink,
  Megaphone,
  BadgePercent,
  ChevronDown,
  Monitor,
  Layers,
  Boxes,
  Webhook as WebhookIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useStore } from "@/contexts/StoreContext";
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

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: (path: string) => boolean;
  children?: NavItem[];
}

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
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
        href: "/dashboard/carrinhos-abandonados",
        label: "Carrinhos Abandonados",
        icon: ShoppingBag,
        match: (p) => p.startsWith("/dashboard/carrinhos-abandonados"),
      },
      {
        href: "/dashboard/products",
        label: "Produtos",
        icon: Package,
        match: (p) => p.startsWith("/dashboard/products"),
      },
      {
        href: "/dashboard/kits",
        label: "Kits",
        icon: Boxes,
        match: (p) => p.startsWith("/dashboard/kits"),
      },
      {
        href: "/dashboard/collections",
        label: "Coleções",
        icon: Layers,
        match: (p) => p.startsWith("/dashboard/collections"),
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
    section: "Marketing",
    items: [
      {
        href: "/dashboard/marketing",
        label: "Marketing",
        icon: Megaphone,
        match: (p) =>
          p === "/dashboard/marketing" ||
          p.startsWith("/dashboard/order-bump") ||
          p.startsWith("/dashboard/upsell") ||
          p.startsWith("/dashboard/cupons") ||
          p.startsWith("/dashboard/redirecionamento") ||
          p.startsWith("/dashboard/email") ||
          p.startsWith("/dashboard/whatsapp"),
        children: [
          {
            href: "/dashboard/order-bump",
            label: "Orderbump",
            icon: Sparkles,
            match: (p) => p.startsWith("/dashboard/order-bump"),
          },
          {
            href: "/dashboard/upsell",
            label: "Upssell",
            icon: Zap,
            match: (p) => p.startsWith("/dashboard/upsell"),
          },
          {
            href: "/dashboard/cupons",
            label: "Cupons",
            icon: TicketPercent,
            match: (p) => p.startsWith("/dashboard/cupons"),
          },
          {
            href: "/dashboard/marketing/descontos",
            label: "Descontos",
            icon: BadgePercent,
            match: (p) => p.startsWith("/dashboard/marketing/descontos"),
          },
          {
            href: "/dashboard/redirecionamento",
            label: "Página de redirecionamento",
            icon: ExternalLink,
            match: (p) => p.startsWith("/dashboard/redirecionamento"),
          },
          {
            href: "/dashboard/email",
            label: "Email",
            icon: Mail,
            match: (p) => p.startsWith("/dashboard/email"),
          },
          {
            href: "/dashboard/whatsapp",
            label: "WhatsApp",
            icon: MessageCircle,
            match: (p) => p.startsWith("/dashboard/whatsapp"),
          },
        ],
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
        href: "/dashboard/webhooks",
        label: "Webhooks",
        icon: WebhookIcon,
        match: (p) => p.startsWith("/dashboard/webhooks"),
      },
      {
        href: "/dashboard/apps",
        label: "Apps",
        icon: LayoutGrid,
        match: (p) => p.startsWith("/dashboard/apps"),
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

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { stores, selectedStore, setSelectedStoreById, addStore } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"Shopify" | "Landing Page">("Shopify");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

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

  const hasActiveChild = (item: NavItem) =>
    item.children?.some((child) => isActive(child)) ?? false;

  const toggleExpanded = (href: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(href)) {
        next.delete(href);
      } else {
        next.add(href);
      }
      return next;
    });
  };

  return (
    <>
      <aside className={cn("flex w-64 shrink-0 flex-col border-r bg-background", className)}>
        {/* Brand */}
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-tight">
              jCheckout
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
              <p className="px-3 pb-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.section}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item) || hasActiveChild(item);
                const isExpanded = expanded.has(item.href);
                const hasChildren = !!item.children?.length;

                return (
                  <div key={item.href}>
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(item.href)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    )}
                    {hasChildren && isExpanded && (
                      <div className="mt-1 space-y-1 border-l border-border pl-6 ml-3">
                        {item.children!.map((child) => {
                          const ChildIcon = child.icon;
                          const childActive = isActive(child);
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={onNavigate}
                              className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                childActive
                                  ? "bg-foreground text-background"
                                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
                              )}
                            >
                              <ChildIcon className="h-4 w-4" />
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Create store dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
          <DialogHeader>
            <DialogTitle>Criar nova loja</DialogTitle>
            <DialogDescription>
              Configure uma nova loja para começar a vender. Você poderá conectar
              Shopify ou usar como landing page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-7 px-6 py-6">
            <div className="space-y-2">
              <div className="space-y-0.5">
                <Label htmlFor="store-name" className="text-base font-semibold text-foreground">
                  Qual nome da sua loja?
                </Label>
                <p className="text-sm text-muted-foreground">
                  Esse será o nome exibido nos e-mails da sua loja.
                </p>
              </div>
              <Input
                id="store-name"
                placeholder="Ex: Minha Loja Incrível"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-3">
              <Label className="text-base font-semibold text-foreground">
                Qual formato da sua loja?
              </Label>
              <div
                className="grid gap-3 sm:grid-cols-2"
                role="radiogroup"
                aria-label="Formato da loja"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={type === "Shopify"}
                  onClick={() => setType("Shopify")}
                  className={cn(
                    "flex min-h-32 flex-col items-center justify-center gap-3 rounded-lg border-2 px-4 py-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    type === "Shopify"
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-accent/40"
                  )}
                >
                  <ShoppingBag className="h-8 w-8 text-primary" aria-hidden="true" />
                  <span>Shopify</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={type === "Landing Page"}
                  onClick={() => setType("Landing Page")}
                  className={cn(
                    "flex min-h-32 flex-col items-center justify-center gap-3 rounded-lg border-2 px-4 py-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    type === "Landing Page"
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-accent/40"
                  )}
                >
                  <Monitor className="h-8 w-8 text-primary" aria-hidden="true" />
                  <span>Landing Page</span>
                </button>
              </div>
            </div>
          </div>
          <DialogFooter className="border-t bg-muted/20 px-6 py-4 sm:justify-between">
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
