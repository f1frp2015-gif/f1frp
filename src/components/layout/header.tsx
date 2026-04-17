"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
import { clerkEnabled } from "@/lib/auth";

const navItems = [
  { href: "/materials", label: "材料库" },
  { href: "/formulas", label: "配方库" },
  { href: "/standards", label: "标准库" },
  { href: "/trade", label: "交易市场" },
  { href: "/tech", label: "技术中心" },
  { href: "/news", label: "资讯" },
  { href: "/ai", label: "AI" },
];

function AuthButtons() {
  const { useAuth, UserButton } = require("@clerk/nextjs");
  const { isSignedIn } = useAuth();
  if (isSignedIn) {
    return (
      <>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">控制台</Button>
        </Link>
        <UserButton />
      </>
    );
  }
  return (
    <>
      <Link href="/sign-in">
        <Button variant="ghost" size="sm">登录</Button>
      </Link>
      <Link href="/sign-up">
        <Button size="sm">注册</Button>
      </Link>
    </>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                item.label === "AI"
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {clerkEnabled ? (
            <AuthButtons />
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="text-xs">登录</Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="text-xs">注册</Button>
              </Link>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted md:hidden">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 p-0">
            <nav className="flex flex-col p-4 pt-12">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="border-b py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-6 flex flex-col gap-2">
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full text-xs">控制台</Button>
                </Link>
                <Link href="/sign-in" onClick={() => setOpen(false)}>
                  <Button className="w-full text-xs">登录 / 注册</Button>
                </Link>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
