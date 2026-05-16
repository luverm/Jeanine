import Link from "next/link";
import type { Metadata } from "next";
import { listEmailLog } from "@/lib/db/email-log";
import { Badge } from "@/components/ui/badge";
import { EmailResend } from "@/components/admin/email-resend";
import { formatHumanDateTime } from "@/lib/time";

export const metadata: Metadata = {
  title: "E-maillog",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

function variant(status: string): "default" | "secondary" | "destructive" {
  if (status === "sent") return "default";
  if (status === "failed") return "destructive";
  return "secondary";
}

export default async function EmailLogPage() {
  let rows;
  try {
    rows = await listEmailLog(100);
  } catch {
    rows = null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/instellingen"
        className="text-xs text-muted-foreground underline underline-offset-4"
      >
        ← Instellingen
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">E-maillog</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Laatste 100 verzonden, mislukte en overgeslagen e-mails.
      </p>

      {rows === null ? (
        <p className="mt-6 rounded-lg border p-6 text-sm text-muted-foreground">
          Nog geen e-maillog beschikbaar. Draai migratie 0005 in Supabase om
          dit te activeren.
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-6 rounded-lg border p-6 text-sm text-muted-foreground">
          Nog geen e-mails verstuurd.
        </p>
      ) : (
        <div className="mt-6 grid gap-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={variant(r.status)}>{r.status}</Badge>
                  <span className="text-sm font-medium">{r.subject}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatHumanDateTime(new Date(r.created_at))}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground break-all">
                {r.to_email}
                {r.context ? ` · ${r.context}` : ""}
              </p>
              {r.error && (
                <p className="mt-1 text-xs text-red-600 break-all">
                  {r.error}
                </p>
              )}
              <div className="mt-3">
                <EmailResend id={r.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
