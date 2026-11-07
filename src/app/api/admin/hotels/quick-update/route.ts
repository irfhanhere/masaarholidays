import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { name, details, priceAed } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing hotel name" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if hotel exists by name
    const { data: existing } = await supabase
      .from("hotels")
      .select("id, name, price_from_aed")
      .ilike("name", `%${name.trim()}%`)
      .limit(1)
      .maybeSingle();

    if (existing && typeof existing.id === "string") {
      if (typeof priceAed === "number" && priceAed > 0) {
        await supabase
          .from("hotels")
          .update({ price_from_aed: priceAed })
          .eq("id", existing.id);
      }
    }

    return NextResponse.json({ success: true, updated: Boolean(existing) });
  } catch (err: any) {
    console.error("[api/hotels/quick-update] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
