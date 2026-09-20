import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Auto-publishes any blog_posts scheduled at or before now. Wired to Vercel
 * Cron (see vercel.json) to run every 5 minutes. Protected by CRON_SECRET so
 * this can't be triggered by anyone who finds the URL — Vercel Cron sends it
 * automatically as a Bearer token on every invocation.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: due, error: fetchError } = await supabase
    .from("blog_posts")
    .select("id")
    .eq("status", "draft")
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", nowIso);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!due || due.length === 0) {
    return NextResponse.json({ published: 0 });
  }

  const ids = due.map((row) => row.id);
  const { error: updateError } = await supabase
    .from("blog_posts")
    .update({ status: "published", published_at: nowIso, scheduled_at: null })
    .in("id", ids);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ published: ids.length, ids });
}
