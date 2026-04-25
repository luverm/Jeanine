import type { Metadata } from "next";
import { listTimeOff } from "@/lib/db/admin-schedule";
import { getDefaultStaffId } from "@/lib/db/staff";
import { TimeOffManager } from "@/components/admin/time-off-form";

export const metadata: Metadata = {
  title: "Vrije dagen",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function VrijeDagenPage() {
  const staffId = await getDefaultStaffId();
  const rows = await listTimeOff(staffId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Vrije dagen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vakantie, ziekte of priveblokkades. Tijden in Europe/Amsterdam.
        </p>
      </header>
      <TimeOffManager staffId={staffId} rows={rows} />
    </div>
  );
}
