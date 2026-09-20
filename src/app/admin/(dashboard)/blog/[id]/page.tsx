import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { BlogCategoryRow, BlogPostRow } from "@/lib/types/database";
import { BlogForm } from "../BlogForm";

export const metadata: Metadata = { title: "Edit Article | Masaar Admin", robots: { index: false } };

async function getData(id: string): Promise<{ post: BlogPostRow | null; categories: BlogCategoryRow[] }> {
  if (!isSupabaseConfigured()) return { post: null, categories: [] };
  const supabase = await createClient();
  const [{ data: post, error }, { data: categories }] = await Promise.all([
    supabase.from("blog_posts").select("*").eq("id", id).maybeSingle(),
    supabase.from("blog_categories").select("*").order("display_order", { ascending: true }),
  ]);
  if (error) {
    console.error("admin blog getPost", error.message);
  }
  return { post, categories: categories ?? [] };
}

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { post, categories } = await getData(id);

  if (!post) {
    notFound();
  }

  return <BlogForm postId={post.id} initial={post} categories={categories} />;
}
