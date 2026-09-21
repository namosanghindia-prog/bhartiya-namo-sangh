import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { Branch } from "@/lib/supabase/types";
import { CONTACT_PHONES } from "@/lib/about-content";

export type ContactOffice = { label: string; address: string };

export type PublicContactInfo = {
  primary_email: string | null;
  phone_primary: string | null;
  phone_secondary: string | null;
  phone_tertiary: string | null;
  whatsapp_number: string | null;
  offices: ContactOffice[];
  founder_name: string | null;
  founder_title: string | null;
  website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
};

export type ContactPageData = {
  branches: Branch[];
  contact: PublicContactInfo;
};

function asOffices(value: unknown): ContactOffice[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (o): o is ContactOffice =>
      Boolean(o) && typeof o.address === "string" && o.address.trim().length > 0
  );
}

export async function getContactPageData(): Promise<ContactPageData> {
  const supabase = createPublicClient();
  const [branchesRes, settingsRes] = await Promise.all([
    supabase.from("branches").select("*").eq("is_active", true).order("name"),
    supabase.from("organization_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  const row = settingsRes.data;
  const contact: PublicContactInfo = {
    primary_email: row?.primary_email ?? null,
    phone_primary: row?.phone_primary ?? CONTACT_PHONES[0] ?? null,
    phone_secondary: row?.phone_secondary ?? CONTACT_PHONES[1] ?? null,
    phone_tertiary: row?.phone_tertiary ?? null,
    whatsapp_number: row?.whatsapp_number ?? null,
    offices: asOffices(row?.offices),
    founder_name: row?.founder_name ?? null,
    founder_title: row?.founder_title ?? null,
    website_url: row?.website_url ?? "https://www.bhartiyanamosangh.com",
    facebook_url: row?.facebook_url ?? null,
    instagram_url: row?.instagram_url ?? null,
    youtube_url: row?.youtube_url ?? null,
  };

  return {
    branches: (branchesRes.data || []) as Branch[],
    contact,
  };
}
