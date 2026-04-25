import type { Metadata } from "next";
import { listLeads } from "@/lib/db/leads";
import { LeadsKanban } from "@/components/admin/leads-kanban";

export const metadata: Metadata = {
  title: "Leads",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await listLeads();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Bruidsleads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sleep een kaart naar een andere kolom om de status bij te werken.
        </p>
      </header>
      <LeadsKanban initial={leads} />
    </div>
  );
}
