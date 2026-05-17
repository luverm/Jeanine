import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { formatIsoDate, formatHumanDateTime } from "@/lib/time";

type RealisedRow = {
  starts_at: string;
  status: string;
  service: { name: string; price_cents: number } | null;
  customer: { full_name: string; email: string } | null;
  paid: boolean | null;
  paid_method: string | null;
};

function splitVat(inclCents: number, vatRate: number) {
  if (vatRate <= 0) return { excl: inclCents, vat: 0 };
  const excl = Math.round(inclCents / (1 + vatRate / 100));
  return { excl, vat: inclCents - excl };
}

async function fetchRealised(
  fromIso: string,
  toIso: string,
): Promise<RealisedRow[]> {
  const svc = createSupabaseServiceClient();
  const nowIso = new Date().toISOString();
  // Realised revenue: completed, or a past confirmed appointment.
  const { data, error } = await svc
    .from("bookings")
    .select(
      `starts_at, status, paid, paid_method,
       service:services(name, price_cents),
       customer:customers(full_name, email)`,
    )
    .gte("starts_at", fromIso)
    .lte("starts_at", toIso)
    .in("status", ["completed", "confirmed"])
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown as RealisedRow[]).filter(
    (r) => r.status === "completed" || r.starts_at < nowIso,
  );
}

export type PeriodTotals = {
  label: string;
  inclCents: number;
  exclCents: number;
  vatCents: number;
  count: number;
};

export type FinanceSummary = {
  vatRate: number;
  years: Array<{
    year: number;
    quarters: PeriodTotals[];
    total: PeriodTotals;
  }>;
};

/** Per-quarter and per-year realised revenue for the last 2 calendar years. */
export async function loadFinanceSummary(
  vatRate: number,
): Promise<FinanceSummary> {
  const thisYear = Number(formatIsoDate(new Date()).slice(0, 4));
  const fromIso = new Date(Date.UTC(thisYear - 1, 0, 1)).toISOString();
  const toIso = new Date(Date.UTC(thisYear, 11, 31, 23, 59, 59)).toISOString();
  const rows = await fetchRealised(fromIso, toIso);

  const acc = new Map<string, { incl: number; count: number }>();
  for (const r of rows) {
    const localDay = formatIsoDate(new Date(r.starts_at)); // YYYY-MM-DD (NL)
    const year = Number(localDay.slice(0, 4));
    const month = Number(localDay.slice(5, 7));
    const q = Math.floor((month - 1) / 3) + 1;
    const key = `${year}-Q${q}`;
    const cur = acc.get(key) ?? { incl: 0, count: 0 };
    cur.incl += r.service?.price_cents ?? 0;
    cur.count += 1;
    acc.set(key, cur);
  }

  const years = [thisYear - 1, thisYear].map((year) => {
    const quarters: PeriodTotals[] = [1, 2, 3, 4].map((q) => {
      const { incl = 0, count = 0 } = acc.get(`${year}-Q${q}`) ?? {};
      const { excl, vat } = splitVat(incl, vatRate);
      return {
        label: `Q${q}`,
        inclCents: incl,
        exclCents: excl,
        vatCents: vat,
        count,
      };
    });
    const incl = quarters.reduce((s, x) => s + x.inclCents, 0);
    const count = quarters.reduce((s, x) => s + x.count, 0);
    const { excl, vat } = splitVat(incl, vatRate);
    return {
      year,
      quarters,
      total: {
        label: String(year),
        inclCents: incl,
        exclCents: excl,
        vatCents: vat,
        count,
      },
    };
  });

  return { vatRate, years };
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Bookkeeping CSV for a date range, with BTW split per row. */
export async function buildBookingsCsv(
  fromDate: string,
  toDate: string,
  vatRate: number,
): Promise<string> {
  const rows = await fetchRealised(
    `${fromDate}T00:00:00Z`,
    `${toDate}T23:59:59Z`,
  );
  const header = [
    "Datum",
    "Dienst",
    "Klant",
    "E-mail",
    "Status",
    "Betaald",
    "Methode",
    "Bedrag incl",
    "Bedrag excl",
    "BTW",
  ];
  const lines = [header.join(";")];
  for (const r of rows) {
    const incl = r.service?.price_cents ?? 0;
    const { excl, vat } = splitVat(incl, vatRate);
    lines.push(
      [
        formatHumanDateTime(new Date(r.starts_at)),
        r.service?.name ?? "",
        r.customer?.full_name ?? "",
        r.customer?.email ?? "",
        r.status,
        r.paid ? "ja" : "nee",
        r.paid_method ?? "",
        (incl / 100).toFixed(2),
        (excl / 100).toFixed(2),
        (vat / 100).toFixed(2),
      ]
        .map(csvCell)
        .join(";"),
    );
  }
  return lines.join("\r\n");
}
