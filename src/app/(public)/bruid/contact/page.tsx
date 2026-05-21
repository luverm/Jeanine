import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { LeadForm } from "@/components/public/lead-form";
import { getResolvedContent } from "@/lib/db/site-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vraag je trouwdatum aan",
  description:
    "Vraag je trouwdatum aan voor je bruidsstyling — ik neem persoonlijk contact met je op.",
};

export default async function BruidContactPage() {
  const content = await getResolvedContent();
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-[1fr_320px]">
      <div>
        <header className="mb-10">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Bruidsstyling
          </p>
          <h1 className="mt-4 text-pretty text-4xl tracking-tight sm:text-5xl">
            {content["bruidcontact.title"]}
          </h1>
          <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
            {content["bruidcontact.intro"]}
          </p>
        </header>

        <LeadForm />
      </div>

      <aside className="md:sticky md:top-24 md:self-start">
        <div className="rounded-lg border border-border bg-accent/30 p-6">
          <h2 className="text-xl tracking-tight">Wat te verwachten</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span aria-hidden className="mt-2 h-1 w-1 rounded-full bg-primary" />
              <span>Er wordt contact met je opgenomen</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="mt-2 h-1 w-1 rounded-full bg-primary" />
              <span>Persoonlijk antwoord — geen geautomatiseerde reply</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="mt-2 h-1 w-1 rounded-full bg-primary" />
              <span>Inspiratiebeelden mag je meesturen na de bevestiging</span>
            </li>
          </ul>
        </div>
      </aside>

      <Toaster richColors position="top-right" />
    </div>
  );
}
