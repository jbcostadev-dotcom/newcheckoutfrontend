"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, User, ChevronDown } from "lucide-react";

import { cn, initials } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";

interface DashboardHeaderProps {
  className?: string;
}

export function DashboardHeader({ className }: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-64 z-30 flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          Painel
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-10 items-center gap-3 px-2 hover:bg-accent"
            >
              <Avatar className="h-8 w-8 border">
                <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                  {initials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start text-left md:flex">
                <span className="max-w-[140px] truncate text-sm font-medium">
                  {user?.name ?? "Usuário"}
                </span>
                <span className="max-w-[140px] truncate text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{user?.name ?? "Usuário"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/account" className="cursor-pointer">
                <User className="h-4 w-4" />
                Minha Conta
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/account" className="cursor-pointer">
                <Settings className="h-4 w-4" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
