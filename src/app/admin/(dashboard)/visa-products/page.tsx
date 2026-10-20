import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { CANONICAL_ONLINE_VISA_PRODUCTS } from "@/lib/data/visa";
import type { VisaProductRow } from "@/lib/types/database";
import VisaProductsManager from "./VisaProductsManager";

export const metadata: Metadata = {
  title: "Online Visa Products | Masaar Admin",
  robots: { index: false },
};

export default async function VisaProductsAdminPage() {
  let products: VisaProductRow[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("visa_products")
        .select("*")
        .order("display_order", { ascending: true });

      if (!error && data && data.length > 0) {
        products = data;
      }
    } catch (err) {
      console.warn("[admin-visa-products] Falling back to canonical catalog:", err);
    }
  }

  // Fallback to canonical 12 items if DB empty or not connected
  if (products.length === 0) {
    products = [
      ...CANONICAL_ONLINE_VISA_PRODUCTS.uae,
      ...CANONICAL_ONLINE_VISA_PRODUCTS["saudi-tourist"],
      ...CANONICAL_ONLINE_VISA_PRODUCTS.us,
    ];
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center gap-2 text-xs text-masaar-black/50">
        <a href="/admin" className="hover:text-masaar-black">Home</a>
        <span>/</span>
        <a href="/admin/visa-types" className="hover:text-masaar-black">Visa Services</a>
        <span>/</span>
        <span className="font-semibold text-masaar-black">Online Products</span>
      </div>

      <VisaProductsManager initialProducts={products} />
    </div>
  );
}
