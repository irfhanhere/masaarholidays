export interface CrmMetadata {
  crm_status?: "new" | "contacted" | "preparing_quote" | "quote_sent" | "revision_requested" | "accepted" | "converted" | "lost";
  assigned_to?: string;
  assigned_role?: string;
  country?: string;
  travel_dates?: string;
  preferred_package?: string;
  adults?: number;
  children?: number;
  notes?: string;
}

export function parseCrmMeta(raw: string | null | undefined): CrmMetadata {
  if (!raw) return {};
  try {
    if (raw.startsWith("{")) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback plain text
  }
  return { notes: raw };
}
