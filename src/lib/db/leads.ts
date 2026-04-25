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
  status: LeadStatus;
  assigned_staff: string | null;
  created_at: string;
  updated_at: string;
};

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
