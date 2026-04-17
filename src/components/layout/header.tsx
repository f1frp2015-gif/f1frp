"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
import { clerkEnabled } from "@/lib/auth";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/news", label: "资讯中心" },
  { href: "/materials", label: "材料数据库" },
  { href: "/formulas", label: "配方数据库" },
  { href: "/trade", label: "交易市场" },
  { href: "/tech", label: "技术中心" },
  { href: "/standards", label: "标准库" },
  { href: "/ai", label: "复材AI" },
];

function AuthButtons() {
  const { useAuth, UserButton } = require("@clerk/nextjs");
  const { isSignedIn } = useAuth();
  if (isSignedIn) {
    return (
      <>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">用户中心</Button>
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
        <Button size="sm">免费注册</Button>
      </Link>
    </>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
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
                <Button variant="ghost" size="sm">登录</Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm">免费注册</Button>
              </Link>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="inline-flex h-8 items-center justify-center rounded-lg border border-transparent px-2 text-muted-foreground hover:bg-muted md:hidden"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <nav className="mt-8 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-4 flex flex-col gap-2 border-t pt-4">
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full">用户中心</Button>
                </Link>
                <Link href="/sign-in" onClick={() => setOpen(false)}>
                  <Button className="w-full">登录 / 注册</Button>
                </Link>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
