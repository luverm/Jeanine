import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bedankt voor je bericht",
  robots: { index: false },
};

export default function BedanktPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24">
      <h1 className="text-4xl font-semibold tracking-tight">
        Dankjewel — we nemen contact op
      </h1>
      <p className="mt-6 text-lg text-muted-foreground">
        Je aanvraag is binnen. We lezen alles rustig door en sturen binnen
        twee werkdagen een persoonlijk antwoord. Heb je inspiratiebeelden of
        een Pinterest-bord? Stuur ze gerust mee als reply op de bevestigings-
        e-mail die je net hebt gekregen.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/portfolio"
          className="inline-flex items-center justify-center rounded-full border px-5 py-2 text-sm hover:bg-accent"
        >
          Bekijk portfolio
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2 text-sm text-background hover:opacity-90"
        >
          Terug naar de site
        </Link>
      </div>
    </div>
  );
}
