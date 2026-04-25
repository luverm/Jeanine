import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type CustomerListItem = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  created_at: string;
  bookings_count: number;
};

export async function listCustomers(q?: string): Promise<CustomerListItem[]> {
  const supabase = createSupabaseServiceClient();
  let query = supabase
    .from("customers")
    .select(
      `
      id,
      email,
      full_name,
      phone,
      created_at,
      bookings(count)
      `,
    )
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as Array<{
    id: string;
    email: string;
    full_name: string;
    phone: string | null;
    created_at: string;
    bookings: { count: number }[];
  }>).map((row) => ({
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    phone: row.phone,
    created_at: row.created_at,
    bookings_count: row.bookings[0]?.count ?? 0,
  }));
}
