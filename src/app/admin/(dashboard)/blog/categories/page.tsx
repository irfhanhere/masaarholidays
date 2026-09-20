import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { BlogCategoryRow } from "@/lib/types/database";
import { CategoriesManager } from "./CategoriesManager";

export const metadata: Metadata = { title: "Blog Categories | Masaar Admin", robots: { index: false } };

export default async function BlogCategoriesPage() {
  if (!isSupabaseConfigured()) return <CategoriesManager categories={[]} postCounts={{}} />;

  const supabase = await createClient();
  const [{ data: categories }, { data: posts }] = await Promise.all([
    supabase.from("blog_categories").select("*").order("display_order", { ascending: true }),
    supabase.from("blog_posts").select("category_id"),
  ]);

  const postCounts: Record<string, number> = {};
  for (const post of posts ?? []) {
    if (post.category_id) postCounts[post.category_id] = (postCounts[post.category_id] ?? 0) + 1;
  }

  return <CategoriesManager categories={(categories ?? []) as BlogCategoryRow[]} postCounts={postCounts} />;
}
