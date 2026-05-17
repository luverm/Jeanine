import Link from "next/link";
import type { Metadata } from "next";
import {
  Scissors,
  Clock,
  CalendarOff,
  CalendarClock,
  RefreshCw,
  Mail,
  ListChecks,
  Image as ImageIcon,
  Star,
  Wallet,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { getBusiness } from "@/lib/db/business-settings";
import { BusinessSettingsForm } from "@/components/admin/business-settings-form";

export const metadata: Metadata = {
  title: "Instellingen",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

type HubItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const GROUPS: { title: string; items: HubItem[] }[] = [
  {
    title: "Agenda & boeken",
    items: [
      {
        href: "/instellingen/diensten",
        label: "Diensten",
        description: "Behandelingen, prijzen en duur",
        icon: Scissors,
      },
      {
        href: "/instellingen/openingstijden",
        label: "Openingstijden",
        description: "Werktijden per weekdag",
        icon: Clock,
      },
      {
        href: "/instellingen/vrije-dagen",
        label: "Vrije dagen / blokkades",
        description: "Vakantie, vrije dagen en pauzes",
        icon: CalendarOff,
      },
      {
        href: "/instellingen/agenda",
        label: "Agenda in je telefoon",
        description: "Boekingen automatisch in je telefoonagenda",
        icon: CalendarClock,
      },
    ],
  },
  {
    title: "Klantcontact",
    items: [
      {
        href: "/instellingen/terugkommail",
        label: "Terugkom-mail",
        description: "Automatische ‘tijd voor een nieuwe afspraak’",
        icon: RefreshCw,
      },
      {
        href: "/instellingen/e-mails",
        label: "E-maillog",
        description: "Verzonden mails bekijken en opnieuw sturen",
        icon: Mail,
      },
      {
        href: "/instellingen/wachtlijst",
        label: "Wachtlijst",
        description: "Klanten die op een vrij plekje wachten",
        icon: ListChecks,
      },
    ],
  },
  {
    title: "Website & content",
    items: [
      {
        href: "/instellingen/portfolio",
        label: "Portfolio",
        description: "Foto’s op de website",
        icon: ImageIcon,
      },
      {
        href: "/instellingen/reviews",
        label: "Reviews",
        description: "Klantbeoordelingen beheren",
        icon: Star,
      },
    ],
  },
  {
    title: "Financieel",
    items: [
      {
        href: "/instellingen/financien",
        label: "Financieel & BTW",
        description: "Omzet, BTW en boekhoud-export",
        icon: Wallet,
      },
    ],
  },
];

function HubRow({ item }: { item: HubItem }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="group flex items-center gap-4 rounded-lg border p-4 transition hover:border-foreground/20 hover:bg-accent"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{item.label}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {item.description}
        </span>
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}

export default async function InstellingenPage() {
  const b = await getBusiness();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Instellingen</h1>
      </header>

      <Card className="p-6">
        <h2 className="text-base font-semibold">Bedrijfsgegevens</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Wijzigingen verschijnen direct op de website (kop, footer,
          contact).
        </p>
        <div className="mt-5">
          <BusinessSettingsForm
            initial={{
              name: b.name,
              ownerName: b.ownerName,
              tagline: b.tagline,
              email: b.email,
              phone: b.phone,
              street: b.address.street,
              postcode: b.address.postcode,
              city: b.address.city,
              kvk: b.kvk,
              btw: b.btw,
              iban: b.iban,
              vatRate: b.vatRate,
              invoicePrefix: b.invoicePrefix,
              instagram: b.socials.instagram,
              instagramUrl: b.socials.instagramUrl,
              tiktok: b.socials.tiktok,
            }}
          />
        </div>
      </Card>

      {GROUPS.map((group) => (
        <section key={group.title} className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.title}
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {group.items.map((item) => (
              <HubRow key={item.href} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
