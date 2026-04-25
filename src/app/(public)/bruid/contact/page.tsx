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
    <div className="mx-auto max-w-3xl px-4 py-16">
      <header className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight">
          Plan een vrijblijvend consult
        </h1>
        <p className="mt-3 text-muted-foreground">
          Vertel ons kort over je trouwdag. We nemen binnen 2 werkdagen
          persoonlijk contact op.
        </p>
      </header>

      <LeadForm turnstileSiteKey={turnstileSiteKey} />

      <Toaster richColors position="top-right" />
    </div>
  );
}
