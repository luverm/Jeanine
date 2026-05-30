import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type LeadStatus = "new" | "contacted" | "quoted" | "won" | "lost";

export type LeadRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  wedding_date: string | null;
  location: string | null;
  party_size: number | null;
  services_wanted: string[] | null;
  budget_cents: number | null;
  message: string | null;
  notes: string | null;
  attachment_paths: string[] | null;
  /** Admin-only post-trial result photos (object paths in bridal-results). */
  result_paths: string[] | null;
  /** When the trial session is/was scheduled, if at all. */
  trial_session_at: string | null;
  agreed_price_cents: number | null;
  deposit_cents: number | null;
  deposit_paid: boolean | null;
  status: LeadStatus;
  assigned_staff: string | null;
  created_at: string;
  updated_at: string;
};

export async function updateLeadFinance(
  id: string,
  input: {
    agreedPriceCents: number | null;
    depositCents: number | null;
    depositPaid: boolean;
  },
): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("bridal_leads")
    .update({
      agreed_price_cents: input.agreedPriceCents,
      deposit_cents: input.depositCents,
      deposit_paid: input.depositPaid,
    })
    .eq("id", id);
  if (error) throw error;
}

/** Sets only the agreed price (preserves deposit fields). */
export async function setLeadAgreedPrice(
  id: string,
  agreedPriceCents: number,
): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("bridal_leads")
    .update({ agreed_price_cents: agreedPriceCents })
    .eq("id", id);
  if (error) throw error;
}

export type LeadInsert = {
  fullName: string;
  email: string;
  phone: string;
  weddingDate: string;
  location: string;
  partySize: number;
  servicesWanted: string[];
  budgetCents?: number | null;
  message?: string;
};

export async function insertLead(input: LeadInsert): Promise<LeadRow> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("bridal_leads")
    .insert({
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      wedding_date: input.weddingDate,
      location: input.location,
      party_size: input.partySize,
      services_wanted: input.servicesWanted,
      budget_cents: input.budgetCents ?? null,
      message: input.message ?? null,
      status: "new",
    })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to insert lead");
  return data as LeadRow;
}

export async function listLeads(
  status?: LeadStatus,
): Promise<LeadRow[]> {
  const supabase = createSupabaseServiceClient();
  let query = supabase
    .from("bridal_leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as LeadRow[];
}

export async function getLead(id: string): Promise<LeadRow | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("bridal_leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as LeadRow | null) ?? null;
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("bridal_leads")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export async function updateLeadNotes(
  id: string,
  notes: string,
): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("bridal_leads")
    .update({ notes: notes || null })
    .eq("id", id);
  if (error) throw error;
}

export type LeadContactUpdate = {
  fullName: string;
  email: string;
  phone: string | null;
  location: string | null;
};

/** Updates the editable contact fields on a bridal lead. */
export async function updateLeadContact(
  id: string,
  fields: LeadContactUpdate,
): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("bridal_leads")
    .update({
      full_name: fields.fullName,
      email: fields.email,
      phone: fields.phone,
      location: fields.location,
    })
    .eq("id", id);
  if (error) throw error;
}

/** Sets (or clears, when null) the scheduled trial-session date/time. */
export async function setLeadTrialSession(
  id: string,
  at: string | null,
): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("bridal_leads")
    .update({ trial_session_at: at })
    .eq("id", id);
  if (error) throw error;
}

/** Adds the given object paths to the lead's result_paths array. */
export async function appendLeadResultPaths(
  id: string,
  paths: string[],
): Promise<void> {
  if (paths.length === 0) return;
  const supabase = createSupabaseServiceClient();
  const { data: row } = await supabase
    .from("bridal_leads")
    .select("result_paths")
    .eq("id", id)
    .maybeSingle();
  const existing =
    (row as { result_paths: string[] | null } | null)?.result_paths ?? [];
  const next = [...existing, ...paths];
  const { error } = await supabase
    .from("bridal_leads")
    .update({ result_paths: next })
    .eq("id", id);
  if (error) throw error;
}

/** Removes a single object path from the lead's result_paths array. */
export async function removeLeadResultPath(
  id: string,
  path: string,
): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { data: row } = await supabase
    .from("bridal_leads")
    .select("result_paths")
    .eq("id", id)
    .maybeSingle();
  const existing =
    (row as { result_paths: string[] | null } | null)?.result_paths ?? [];
  const next = existing.filter((p) => p !== path);
  const { error } = await supabase
    .from("bridal_leads")
    .update({ result_paths: next })
    .eq("id", id);
  if (error) throw error;
}

/** Deletes the lead and returns its attachment paths for cleanup. */
export async function deleteLead(id: string): Promise<string[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("bridal_leads")
    .delete()
    .eq("id", id)
    .select("attachment_paths")
    .maybeSingle();
  if (error) throw error;
  const paths = (data as { attachment_paths: string[] | null } | null)
    ?.attachment_paths;
  return paths ?? [];
}
