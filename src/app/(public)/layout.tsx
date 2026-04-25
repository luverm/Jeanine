import Link from "next/link";
import { business } from "@/content/business";
import { MobileNav } from "@/components/public/mobile-nav";

const navLinks = [
  { href: "/diensten", label: "Diensten" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/bruid", label: "Bruid" },
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            {business.name}
          </Link>

          <ul className="hidden items-center gap-6 text-sm md:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-foreground/70">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/boeken"
                className="rounded-full bg-foreground px-4 py-2 text-background hover:opacity-90"
              >
                Boek afspraak
              </Link>
            </li>
          </ul>

          <div className="md:hidden">
            <MobileNav />
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-16 border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <p className="text-base font-semibold">{business.name}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {business.tagline}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">Contact</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>{business.email}</li>
                <li>{business.phone}</li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-medium">Adres</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>{business.address.street}</li>
                <li>
                  {business.address.postcode} {business.address.city}
                </li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-medium">Volg</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Instagram: {business.socials.instagram}</li>
                <li>TikTok: {business.socials.tiktok}</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t pt-6 text-xs text-muted-foreground md:flex-row">
            <p>
              KvK {business.kvk} · BTW {business.btw}
            </p>
            <p>© {new Date().getFullYear()} {business.name}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
