import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { BlogCategoryRow, BlogPostRow } from "@/lib/types/database";
import { BlogListClient } from "./BlogListClient";

export const metadata = { title: "Blog | Masaar Admin", robots: { index: false } };

async function getData(): Promise<{ posts: BlogPostRow[]; categories: BlogCategoryRow[] }> {
  if (!isSupabaseConfigured()) return { posts: [], categories: [] };
  const supabase = await createClient();
  const [{ data: posts, error }, { data: categories }] = await Promise.all([
    supabase.from("blog_posts").select("*").order("created_at", { ascending: false }),
    supabase.from("blog_categories").select("*").order("display_order", { ascending: true }),
  ]);
  if (error) {
    console.error("admin blog getPosts", error.message);
  }
  return { posts: posts ?? [], categories: categories ?? [] };
}

export default async function AdminBlogPage() {
  const { posts, categories } = await getData();
  return <BlogListClient posts={posts} categories={categories} />;
}
