import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { BlogArticleTemplate } from "@/components/site/BlogArticleTemplate";
import { Badge } from "@/components/admin/ui";
import type { BlogCategoryRow, BlogPostRow } from "@/lib/types/database";
import { publishFromPreview } from "../../(dashboard)/blog/actions";

export const metadata: Metadata = { title: "Article Preview | Masaar Admin", robots: { index: false } };

async function getClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return supabase;
  if (process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_AUTH_BYPASS === "true") {
    return createAdminClient();
  }
  return supabase;
}

async function getPreviewData(id: string): Promise<{
  post: BlogPostRow | null;
  category: BlogCategoryRow | null;
  relatedPosts: BlogPostRow[];
}> {
  if (!isSupabaseConfigured()) return { post: null, category: null, relatedPosts: [] };
  const supabase = await getClient();

  const { data: post } = await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle();
  if (!post) return { post: null, category: null, relatedPosts: [] };

  const [{ data: category }, { data: relatedPosts }] = await Promise.all([
    post.category_id ? supabase.from("blog_categories").select("*").eq("id", post.category_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .neq("id", id)
      .order("published_at", { ascending: false })
      .limit(3),
  ]);

  return { post, category: category ?? null, relatedPosts: relatedPosts ?? [] };
}

export default async function BlogPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { post, category, relatedPosts } = await getPreviewData(id);

  if (!post) notFound();

  return (
    <div className="min-h-screen bg-warm-ivory">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 bg-white px-6 py-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-masaar-black/50">
            <Link href="/admin" className="hover:underline">Dashboard</Link>
            <span>&rsaquo;</span>
            <Link href="/admin/blog" className="hover:underline">Blog</Link>
            <span>&rsaquo;</span>
            <span className="font-semibold text-masaar-black">Preview</span>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-xl font-bold text-masaar-black">Article Preview</h1>
            <Badge tone={post.status === "published" ? "green" : "gray"}>{post.status === "published" ? "Published" : "Draft"}</Badge>
          </div>
          <p className="text-xs text-masaar-black/60">This is how your article will appear on the website.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/blog/${id}`}
            className="rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-masaar-black hover:bg-warm-ivory"
          >
            ← Back to Editor
          </Link>
          {post.status !== "published" && (
            <form action={publishFromPreview.bind(null, id)}>
              <button type="submit" className="rounded-lg bg-admin-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-admin-primary-dark">
                Publish
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Static, non-interactive nav — visual context only. The real Header component
          depends on the (site) route group's own client providers (currency, WhatsApp
          templates, language), which the admin tree doesn't set up. */}
      <div className="border-b border-black/10 bg-masaar-black px-6 py-4 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-sm font-medium">
          <span className="font-[family-name:var(--font-display)] text-lg font-bold">masaar holidays</span>
          <nav className="hidden gap-5 text-white/80 sm:flex">
            <span>Umrah</span>
            <span>Hajj</span>
            <span>Hotels</span>
            <span>Visa</span>
            <span className="text-white">Blog</span>
          </nav>
        </div>
      </div>

      <BlogArticleTemplate post={post} category={category} relatedPosts={relatedPosts} />
    </div>
  );
}
