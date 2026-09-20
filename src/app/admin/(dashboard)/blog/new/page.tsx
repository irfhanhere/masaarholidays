import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { BlogCategoryRow } from "@/lib/types/database";
import { BlogForm } from "../BlogForm";

export const metadata: Metadata = { title: "Create New Article | Masaar Admin", robots: { index: false } };

async function getCategories(): Promise<BlogCategoryRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("blog_categories").select("*").order("display_order", { ascending: true });
  return data ?? [];
}

export default async function NewBlogPostPage() {
  const categories = await getCategories();
  return <BlogForm categories={categories} />;
}
