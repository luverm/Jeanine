import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { LeadForm } from "@/components/public/lead-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Plan een bruids-consult",
  description:
    "Vraag een vrijblijvend consult aan voor je bruidsstyling — we nemen binnen 2 werkdagen contact op.",
};

export default function BruidContactPage() {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!turnstileSiteKey) {
    throw new Error(
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY is missing — set it in .env.local",
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-[1fr_320px]">
      <div>
        <header className="mb-10">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Bruidsstyling
          </p>
          <h1 className="mt-4 text-5xl tracking-tight">
            Plan een vrijblijvend consult
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Vertel kort over je trouwdag. We nemen binnen twee werkdagen
            persoonlijk contact op.
          </p>
        </header>

        <LeadForm turnstileSiteKey={turnstileSiteKey} />
      </div>

      <aside className="md:sticky md:top-24 md:self-start">
        <div className="rounded-lg border border-border bg-accent/30 p-6">
          <h2 className="text-xl tracking-tight">Wat te verwachten</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span aria-hidden className="mt-2 h-1 w-1 rounded-full bg-primary" />
              <span>
                Reactie binnen <strong className="text-foreground">2 werkdagen</strong>
              </span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="mt-2 h-1 w-1 rounded-full bg-primary" />
              <span>Persoonlijk antwoord — geen geautomatiseerde reply</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="mt-2 h-1 w-1 rounded-full bg-primary" />
              <span>Inspiratiebeelden mag je meesturen na de bevestiging</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="mt-2 h-1 w-1 rounded-full bg-primary" />
              <span>Vrijblijvend — geen verplichtingen tot na het consult</span>
            </li>
          </ul>
        </div>
      </aside>

      <Toaster richColors position="top-right" />
    </div>
  );
}
