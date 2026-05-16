"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/admin/sign-out-button";

type Item = { href: string; label: string };

export function AdminNav({
  items,
  email,
}: {
  items: Item[];
  email: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const renderLinks = (onNavigate?: () => void) =>
    items.map((item) => {
      const active = isActive(item.href);
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={
            "rounded px-2 py-1.5 text-sm transition " +
            (active
              ? "bg-accent font-medium text-accent-foreground"
              : "text-foreground hover:bg-accent")
          }
        >
          {item.label}
        </Link>
      );
    });

  return (
    <>
      <aside className="hidden w-56 shrink-0 border-r bg-muted/30 md:flex md:flex-col">
        <div className="px-4 py-5">
          <p className="text-sm font-semibold tracking-tight">Admin</p>
          {email && (
            <p
              className="mt-1 truncate text-xs text-muted-foreground"
              title={email}
            >
              {email}
            </p>
          )}
        </div>
        <nav className="flex flex-col gap-0.5 px-2">{renderLinks()}</nav>
        <div className="mt-auto p-4">
          <SignOutButton />
        </div>
      </aside>

      <header className="border-b bg-muted/30 md:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <p className="text-sm font-semibold">Admin</p>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="admin-mobile-nav"
            aria-label="Menu"
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-base leading-none"
          >
            <span aria-hidden>{open ? "✕" : "☰"}</span>
          </button>
        </div>
        {open && (
          <nav
            id="admin-mobile-nav"
            className="flex flex-col gap-0.5 border-t px-2 py-2"
          >
            {renderLinks(() => setOpen(false))}
            <div className="mt-2 border-t px-2 pt-3">
              <SignOutButton />
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
