import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Toaster } from "@/components/ui/sonner";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/boekingen", label: "Boekingen" },
  { href: "/leads", label: "Leads" },
  { href: "/klanten", label: "Klanten" },
  { href: "/instellingen", label: "Instellingen" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // /login is the only (admin) route reachable without a session — render it
  // bare so the user doesn't see an empty admin shell.
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r bg-muted/30 md:flex md:flex-col">
        <div className="px-4 py-5">
          <p className="text-sm font-semibold tracking-tight">Admin</p>
          <p className="mt-1 truncate text-xs text-muted-foreground" title={user.email ?? undefined}>
            {user.email}
          </p>
        </div>
        <nav className="flex flex-col gap-0.5 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-2 py-1.5 text-sm hover:bg-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto p-4">
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b px-4 py-3 md:hidden">
          <p className="text-sm font-semibold">Admin</p>
          <div className="ml-auto">
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <Toaster richColors position="top-right" />
      </div>
    </div>
  );
}
