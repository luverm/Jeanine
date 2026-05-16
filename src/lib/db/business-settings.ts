import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { business } from "@/content/business";

export type BusinessInfo = {
  name: string;
  ownerName: string;
  tagline: string;
  email: string;
  phone: string;
  address: { street: string; postcode: string; city: string };
  kvk: string;
  btw: string;
  socials: { instagram: string; instagramUrl: string; tiktok: string };
};

export type BusinessSettingsRow = {
  name: string | null;
  owner_name: string | null;
  tagline: string | null;
  email: string | null;
  phone: string | null;
  address_street: string | null;
  address_postcode: string | null;
  address_city: string | null;
  kvk: string | null;
  btw: string | null;
  instagram: string | null;
  instagram_url: string | null;
  tiktok: string | null;
};

function pick(dbValue: string | null | undefined, fallback: string): string {
  const v = dbValue?.trim();
  return v ? v : fallback;
}

/** Static defaults merged with any DB overrides. Never throws. */
export async function getBusiness(): Promise<BusinessInfo> {
  let row: BusinessSettingsRow | null = null;
  try {
    const svc = createSupabaseServiceClient();
    const { data } = await svc
      .from("business_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    row = (data as BusinessSettingsRow | null) ?? null;
  } catch {
    row = null;
  }

  return {
    name: pick(row?.name, business.name),
    ownerName: pick(row?.owner_name, business.ownerName),
    tagline: pick(row?.tagline, business.tagline),
    email: pick(row?.email, business.email),
    phone: pick(row?.phone, business.phone),
    address: {
      street: pick(row?.address_street, business.address.street),
      postcode: pick(row?.address_postcode, business.address.postcode),
      city: pick(row?.address_city, business.address.city),
    },
    kvk: pick(row?.kvk, business.kvk),
    btw: pick(row?.btw, business.btw),
    socials: {
      instagram: pick(row?.instagram, business.socials.instagram),
      instagramUrl: pick(row?.instagram_url, business.socials.instagramUrl),
      tiktok: pick(row?.tiktok, business.socials.tiktok),
    },
  };
}

export async function updateBusinessSettings(input: {
  name: string;
  ownerName: string;
  tagline: string;
  email: string;
  phone: string;
  street: string;
  postcode: string;
  city: string;
  kvk: string;
  btw: string;
  instagram: string;
  instagramUrl: string;
  tiktok: string;
}): Promise<void> {
  const svc = createSupabaseServiceClient();
  const { error } = await svc.from("business_settings").upsert({
    id: 1,
    name: input.name || null,
    owner_name: input.ownerName || null,
    tagline: input.tagline || null,
    email: input.email || null,
    phone: input.phone || null,
    address_street: input.street || null,
    address_postcode: input.postcode || null,
    address_city: input.city || null,
    kvk: input.kvk || null,
    btw: input.btw || null,
    instagram: input.instagram || null,
    instagram_url: input.instagramUrl || null,
    tiktok: input.tiktok || null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
