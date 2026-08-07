"use client";

import Link from "next/link";
import { Boxes } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AuthShellProps = { activePage: "login" | "register"; children: ReactNode; className?: string };

export function AuthShell({ activePage, children, className }: AuthShellProps) {
  return <main className="auth-page"><div className="auth-page__pattern" aria-hidden="true" /><div className="auth-page__content"><Link href="/" className="auth-brand" aria-label="jCheckout - início"><span className="auth-brand__icon"><Boxes aria-hidden="true" /></span><span>j<span>Checkout</span></span></Link><section className={cn("auth-card", className)}><nav className="auth-tabs" aria-label="Acesso à conta"><Link href="/" className={cn("auth-tab", activePage === "login" && "auth-tab--active")}>Login</Link><Link href="/register" className={cn("auth-tab", activePage === "register" && "auth-tab--active")}>Nova conta</Link></nav><div className="auth-card__body">{children}</div></section></div></main>;
}
