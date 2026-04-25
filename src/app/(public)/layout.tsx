import Link from "next/link";
import { business } from "@/content/business";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="font-semibold tracking-tight">
            {business.name}
          </Link>
          <ul className="flex gap-6 text-sm">
            <li><Link href="/diensten">Diensten</Link></li>
            <li><Link href="/portfolio">Portfolio</Link></li>
            <li><Link href="/bruid">Bruid</Link></li>
            <li>
              <Link
                href="/boeken"
                className="rounded-full bg-foreground px-4 py-2 text-background"
              >
                Boek afspraak
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground">
          <p>{business.name} — {business.address.city}</p>
          <p>KvK {business.kvk}</p>
        </div>
      </footer>
    </div>
  );
}
