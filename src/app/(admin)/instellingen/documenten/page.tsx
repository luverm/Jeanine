import Link from "next/link";
import type { Metadata } from "next";
import { getSiteValue } from "@/lib/db/site-content";
import { BRUID_BROCHURE_KEY, BRUID_PROEFKAPSEL_KEY } from "@/lib/portfolio";
import { DocumentsAdmin } from "@/components/admin/documents-admin";

export const metadata: Metadata = {
  title: "Documenten",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function DocumentenPage() {
  const [brochureUrl, proefkapselUrl] = await Promise.all([
    getSiteValue(BRUID_BROCHURE_KEY),
    getSiteValue(BRUID_PROEFKAPSEL_KEY),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/instellingen"
        className="text-xs text-muted-foreground underline underline-offset-4"
      >
        ← Instellingen
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        Documenten
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        De PDF&apos;s die als download op de bruidspagina staan. Upload een
        nieuwe versie om de oude te vervangen.
      </p>

      <div className="mt-6">
        <DocumentsAdmin
          brochureUrl={brochureUrl ?? ""}
          proefkapselUrl={proefkapselUrl ?? ""}
        />
      </div>
    </div>
  );
}
