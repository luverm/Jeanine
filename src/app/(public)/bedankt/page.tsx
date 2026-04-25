import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bedankt voor je bericht",
  robots: { index: false },
};

import { CheckCircle2 } from "lucide-react";

export default function BedanktPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24">
      <div className="flex items-center gap-3 text-primary">
        <CheckCircle2 className="h-7 w-7" aria-hidden />
        <p className="text-xs font-medium uppercase tracking-[0.2em]">
          Verzonden
        </p>
      </div>
      <h1 className="mt-4 text-5xl tracking-tight">
        Dankjewel — we nemen contact op
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
        Je aanvraag is binnen. We lezen alles rustig door en sturen binnen twee
        werkdagen een persoonlijk antwoord. Heb je inspiratiebeelden of een
        Pinterest-bord? Stuur ze gerust mee als reply op de bevestigings-e-mail
        die je net hebt gekregen.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/portfolio"
          className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
        >
          Bekijk portfolio
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Terug naar de site
        </Link>
      </div>
    </div>
  );
}
