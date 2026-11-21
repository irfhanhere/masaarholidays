import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface SupplierRow {
  id: string;
  name: string;
  category: "hotel" | "airline" | "transport" | "visa" | "esim" | "tour" | "other";
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  currency: string;
  payment_terms: string | null;
  supplier_reference: string | null;
  internal_notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingSupplierCostRow {
  id: string;
  booking_id: string;
  supplier_id: string | null;
  supplier_name?: string;
  service_description: string;
  estimated_cost: number;
  actual_cost: number;
  currency: string;
  payment_status: "unpaid" | "partially_paid" | "paid";
  invoice_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

async function getDb() {
  try {
    return createAdminClient();
  } catch {
    return createClient();
  }
}

const DEFAULT_SUPPLIERS: SupplierRow[] = [
  {
    id: "sup-1",
    name: "DoubleTree by Hilton Makkah",
    category: "hotel",
    contact_person: "Reservations Desk",
    email: "reservations.makkah@hilton.com",
    phone: "+966 12 550 5555",
    address: "Jabal Omar, Makkah, Saudi Arabia",
    currency: "SAR",
    payment_terms: "Direct bank transfer / 14 days advance",
    supplier_reference: "HLT-MAK-2026",
    internal_notes: "Contracted hotel for Masaar Best Selling Umrah",
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "sup-2",
    name: "Worth Tharawat Hotel Madinah",
    category: "hotel",
    contact_person: "Hotel Sales Team",
    email: "info@tharawat-hotels.com",
    phone: "+966 14 820 4444",
    address: "Central Northern Area, Madinah, Saudi Arabia",
    currency: "SAR",
    payment_terms: "Advance deposit",
    supplier_reference: "THAR-MED-04",
    internal_notes: "Contracted hotel for Masaar Best Selling Umrah",
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "sup-3",
    name: "Saudia (Saudi Arabian Airlines)",
    category: "airline",
    contact_person: "Masaar Agency Helpdesk",
    email: "agency@saudia.com",
    phone: "+971 4 228 1111",
    address: "Dubai International Financial Centre, Dubai, UAE",
    currency: "AED",
    payment_terms: "BSP Billing / Immediate Ticketing",
    supplier_reference: "SV-AGY-9844",
    internal_notes: "Primary carrier for Umrah flights from DXB/AUH",
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "sup-4",
    name: "Al Safwah Ground Transport & Limousines",
    category: "transport",
    contact_person: "Abu Fahad",
    email: "dispatch@alsafwah-transport.sa",
    phone: "+966 50 123 7890",
    address: "Jeddah Airport Road, Jeddah, Saudi Arabia",
    currency: "SAR",
    payment_terms: "Weekly reconciliation",
    supplier_reference: "ASF-TRANS-01",
    internal_notes: "Contracted for GMC Yukon XL & Hyundai H1 VIP fleet",
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "sup-5",
    name: "MegaeSIM Global Telecommunications",
    category: "esim",
    contact_person: "API Operations Desk",
    email: "support@megaesim.com",
    phone: "+44 20 7946 0912",
    address: "London, United Kingdom",
    currency: "USD",
    payment_terms: "Prepaid API wallet balance",
    supplier_reference: "MEGA-API-PARTNER",
    internal_notes: "Automated eSIM profile provisioning partner",
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
];

export async function listSuppliers(category?: string): Promise<SupplierRow[]> {
  const supabase = await getDb();

  try {
    let q = supabase.from("suppliers").select("*").order("name", { ascending: true });
    if (category && category !== "all") {
      q = q.eq("category", category);
    }
    const { data, error } = await q;
    if (!error && data && data.length > 0) {
      return data as SupplierRow[];
    }
  } catch {}

  // Fallback to seeded default suppliers
  if (category && category !== "all") {
    return DEFAULT_SUPPLIERS.filter((s) => s.category === category);
  }
  return DEFAULT_SUPPLIERS;
}

export async function getSupplierById(id: string): Promise<SupplierRow | null> {
  const supabase = await getDb();

  try {
    const { data, error } = await supabase.from("suppliers").select("*").eq("id", id).maybeSingle();
    if (!error && data) return data as SupplierRow;
  } catch {}

  return DEFAULT_SUPPLIERS.find((s) => s.id === id) || null;
}

export async function saveSupplier(supplier: Partial<SupplierRow>): Promise<SupplierRow> {
  const supabase = await getDb();

  const payload = {
    name: supplier.name?.trim() || "Supplier",
    category: supplier.category || "other",
    contact_person: supplier.contact_person || null,
    email: supplier.email || null,
    phone: supplier.phone || null,
    address: supplier.address || null,
    currency: supplier.currency || "AED",
    payment_terms: supplier.payment_terms || null,
    supplier_reference: supplier.supplier_reference || null,
    internal_notes: supplier.internal_notes || null,
    is_active: supplier.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  try {
    if (supplier.id) {
      const { data, error } = await supabase.from("suppliers").update(payload).eq("id", supplier.id).select("*").single();
      if (!error && data) return data as SupplierRow;
    } else {
      const { data, error } = await supabase.from("suppliers").insert(payload).select("*").single();
      if (!error && data) return data as SupplierRow;
    }
  } catch {}

  return {
    id: supplier.id || `sup-${Date.now()}`,
    ...payload,
    created_at: new Date().toISOString(),
  } as SupplierRow;
}
