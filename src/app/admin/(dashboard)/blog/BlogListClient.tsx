"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, PrimaryButton } from "@/components/admin/ui";
import type { BlogCategoryRow, BlogPostRow } from "@/lib/types/database";
import { deleteBlogPost, duplicateBlogPost, unpublishBlogPost } from "./actions";

const PAGE_SIZE = 6;

function deriveDisplayStatus(post: BlogPostRow): "published" | "draft" | "scheduled" {
  if (post.status === "published") return "published";
  if (post.scheduled_at && new Date(post.scheduled_at) > new Date()) return "scheduled";
  return "draft";
}

function KebabMenu({
  post,
  onDuplicate,
  onUnpublish,
  onDelete,
}: {
  post: BlogPostRow;
  onDuplicate: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex size-8 items-center justify-center rounded-md text-masaar-black/50 hover:bg-black/5"
      >
        ⋮
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-10 w-40 rounded-lg border border-black/10 bg-white py-1 text-sm shadow-lg">
          <Link href={`/admin/blog/${post.id}`} className="block px-3 py-2 hover:bg-warm-ivory">✏️ Edit</Link>
          <button type="button" onClick={onDuplicate} className="block w-full px-3 py-2 text-left hover:bg-warm-ivory">📋 Duplicate</button>
          <Link href={`/admin/blog-preview/${post.id}`} target="_blank" className="block px-3 py-2 hover:bg-warm-ivory">👁 Preview</Link>
          {post.status === "published" && (
            <button type="button" onClick={onUnpublish} className="block w-full px-3 py-2 text-left hover:bg-warm-ivory">🚫 Unpublish</button>
          )}
          <button type="button" onClick={onDelete} className="block w-full px-3 py-2 text-left text-red-600 hover:bg-red-50">🗑 Delete</button>
        </div>
      )}
    </div>
  );
}

export function BlogListClient({ posts: initialPosts, categories }: { posts: BlogPostRow[]; categories: BlogCategoryRow[] }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [prevInitialPosts, setPrevInitialPosts] = useState(initialPosts);
  if (initialPosts !== prevInitialPosts) {
    setPrevInitialPosts(initialPosts);
    setPosts(initialPosts);
  }
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<BlogPostRow | null>(null);
  const [unpublishTarget, setUnpublishTarget] = useState<BlogPostRow | null>(null);
  const [isPending, setIsPending] = useState(false);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const counts = useMemo(() => {
    let published = 0;
    let draft = 0;
    let scheduled = 0;
    for (const p of posts) {
      const s = deriveDisplayStatus(p);
      if (s === "published") published++;
      else if (s === "scheduled") scheduled++;
      else draft++;
    }
    return { all: posts.length, published, draft, scheduled };
  }, [posts]);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (statusFilter !== "all" && deriveDisplayStatus(p) !== statusFilter) return false;
      if (categoryFilter !== "all" && p.category_id !== categoryFilter) return false;
      if (search.trim() && !p.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [posts, statusFilter, categoryFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setPage(1);
  }

  async function handleDuplicate(post: BlogPostRow) {
    setIsPending(true);
    try {
      await duplicateBlogPost(post.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (!message.includes("NEXT_REDIRECT")) throw err;
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  async function handleUnpublishConfirm() {
    if (!unpublishTarget) return;
    setIsPending(true);
    try {
      await unpublishBlogPost(unpublishTarget.id);
      setPosts((prev) => prev.map((p) => (p.id === unpublishTarget.id ? { ...p, status: "draft", scheduled_at: null } : p)));
    } finally {
      setIsPending(false);
      setUnpublishTarget(null);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsPending(true);
    try {
      await deleteBlogPost(deleteTarget.id);
      setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    } finally {
      setIsPending(false);
      setDeleteTarget(null);
    }
  }

  const noArticlesAtAll = posts.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-masaar-black/50">
            <Link href="/admin" className="hover:underline">Dashboard</Link>
            <span>&rsaquo;</span>
            <span className="font-semibold text-masaar-black">Blog</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-masaar-black">Blog</h1>
          <p className="text-xs text-masaar-black/60">Manage articles published on the Masaar Holidays website.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/blog/categories">
            <button type="button" className="rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-masaar-black hover:bg-warm-ivory">
              Categories
            </button>
          </Link>
          <Link href="/admin/blog/new">
            <PrimaryButton type="button">+ Create New Post</PrimaryButton>
          </Link>
        </div>
      </div>

      {noArticlesAtAll ? (
        <div className="rounded-2xl border border-black/10 bg-white p-16 text-center">
          <p className="text-5xl">📰</p>
          <h2 className="mt-4 text-xl font-bold text-masaar-black">No blog articles yet.</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-masaar-black/60">
            Share useful guides and insights with your future travellers.
          </p>
          <Link href="/admin/blog/new">
            <PrimaryButton type="button" className="mx-auto mt-6">+ Create Your First Article</PrimaryButton>
          </Link>

          <div className="mx-auto mt-10 grid max-w-2xl gap-6 border-t border-black/5 pt-8 text-left sm:grid-cols-3">
            <div>
              <p className="text-sm font-bold text-masaar-black">Share Knowledge</p>
              <p className="mt-1 text-xs text-masaar-black/60">Help travellers with practical guides and useful tips.</p>
            </div>
            <div>
              <p className="text-sm font-bold text-masaar-black">Build Trust</p>
              <p className="mt-1 text-xs text-masaar-black/60">Show your expertise and support your community.</p>
            </div>
            <div>
              <p className="text-sm font-bold text-masaar-black">Drive Interest</p>
              <p className="mt-1 text-xs text-masaar-black/60">Quality content inspires more people to plan their journey with Masaar.</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-black/10 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-masaar-black/50">All Posts</p>
              <p className="mt-1 text-2xl font-bold text-masaar-black">{counts.all}</p>
            </div>
            <div className="rounded-xl border border-black/10 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-masaar-black/50">Published</p>
              <p className="mt-1 text-2xl font-bold text-green-700">{counts.published}</p>
            </div>
            <div className="rounded-xl border border-black/10 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-masaar-black/50">Drafts</p>
              <p className="mt-1 text-2xl font-bold text-masaar-black/70">{counts.draft}</p>
            </div>
            <div className="rounded-xl border border-black/10 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-masaar-black/50">Scheduled</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{counts.scheduled}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white p-4">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search articles..."
              className="min-w-48 flex-1 rounded-md border border-black/15 px-3 py-2 text-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-black/15 px-3 py-2 text-sm"
            >
              <option value="all">Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-black/15 px-3 py-2 text-sm"
            >
              <option value="all">Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button type="button" onClick={clearFilters} className="text-xs font-semibold text-deep-gold hover:underline">
              Clear Filters
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 bg-admin-surface text-xs uppercase text-masaar-black/50">
                <tr>
                  <th className="px-4 py-3">Article</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-masaar-black/50">
                      No articles match your filters.
                    </td>
                  </tr>
                )}
                {pageItems.map((post) => {
                  const displayStatus = deriveDisplayStatus(post);
                  return (
                    <tr key={post.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-masaar-black">{post.title}</p>
                        {post.excerpt && <p className="mt-0.5 line-clamp-1 text-xs text-masaar-black/50">{post.excerpt}</p>}
                      </td>
                      <td className="px-4 py-3 text-masaar-black/70">{post.category_id ? categoryById.get(post.category_id)?.name ?? "—" : "—"}</td>
                      <td className="px-4 py-3 text-masaar-black/70">{post.author_name}</td>
                      <td className="px-4 py-3">
                        <Badge tone={displayStatus === "published" ? "green" : displayStatus === "scheduled" ? "amber" : "gray"}>
                          {displayStatus === "published" ? "Published" : displayStatus === "scheduled" ? "Scheduled" : "Draft"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-masaar-black/60">{new Date(post.updated_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <KebabMenu
                            post={post}
                            onDuplicate={() => handleDuplicate(post)}
                            onUnpublish={() => setUnpublishTarget(post)}
                            onDelete={() => setDeleteTarget(post)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-masaar-black/50">
            <span>
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} articles
            </span>
            <div className="flex items-center gap-1">
              <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-black/15 px-2.5 py-1.5 disabled:opacity-40">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={`rounded-md border px-2.5 py-1.5 ${n === page ? "border-admin-primary bg-admin-primary text-white" : "border-black/15"}`}
                >
                  {n}
                </button>
              ))}
              <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-md border border-black/15 px-2.5 py-1.5 disabled:opacity-40">›</button>
            </div>
          </div>
        </>
      )}

      {unpublishTarget && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-masaar-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#FAF5E8] text-[#A87F12]">
              <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">Unpublish this article?</h3>
            <p className="mt-2 text-sm text-masaar-black/60">The article will be removed from the public blog but its content will remain saved as a draft.</p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setUnpublishTarget(null)} disabled={isPending} className="flex-1 rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-masaar-black hover:bg-warm-ivory">Cancel</button>
              <button type="button" onClick={handleUnpublishConfirm} disabled={isPending} className="flex-1 rounded-lg bg-[#8C6B1A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#A87F12] disabled:opacity-60">
                {isPending ? "Unpublishing..." : "Unpublish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-masaar-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-50 text-red-600">
              <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">Delete this article?</h3>
            <p className="mt-2 text-sm text-masaar-black/60">This action cannot be undone.</p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={isPending} className="flex-1 rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-masaar-black hover:bg-warm-ivory">Cancel</button>
              <button type="button" onClick={handleDeleteConfirm} disabled={isPending} className="flex-1 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60">
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
