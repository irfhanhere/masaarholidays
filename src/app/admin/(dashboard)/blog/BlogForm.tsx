"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Badge, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import type { BlogCategoryRow, BlogPostRow } from "@/lib/types/database";
import { computeContentChecks, computeContentStats, computeSeoScore } from "@/lib/blog-seo";
import { saveBlogPost, unpublishBlogPost, deleteBlogPost } from "./actions";
import { uploadBlogImage } from "./upload";

const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://masaarholidays.com").replace(/\/$/, "");

type Tab = "content" | "details" | "seo" | "social" | "advanced";
const TABS: { key: Tab; label: string }[] = [
  { key: "content", label: "Content" },
  { key: "details", label: "Details" },
  { key: "seo", label: "SEO & Metadata" },
  { key: "social", label: "Social Sharing" },
  { key: "advanced", label: "Advanced" },
];

function CounterBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const color = value === 0 ? "bg-black/10" : pct > 100 ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-green-500";
  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-black/10">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className="shrink-0 text-[10px] text-masaar-black/40">Characters: {value}/{max}</span>
    </div>
  );
}

function ScoreGauge({ score, verdict }: { score: number; verdict: string }) {
  const color = score >= 80 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626";
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex items-center gap-4">
      <svg width="76" height="76" viewBox="0 0 76 76" className="shrink-0 -rotate-90">
        <circle cx="38" cy="38" r="34" fill="none" stroke="#eee" strokeWidth="7" />
        <circle
          cx="38"
          cy="38"
          r="34"
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
        <text x="38" y="38" textAnchor="middle" dominantBaseline="central" className="rotate-90" fontSize="20" fontWeight="700" fill="#0a0a08" transform="rotate(90 38 38)">
          {score}
        </text>
      </svg>
      <div>
        <p className="font-bold text-masaar-black">{verdict}</p>
        <p className="text-xs text-masaar-black/60">
          {verdict === "Good"
            ? "Your article is well optimised. A few improvements can make it even better."
            : verdict === "Needs work"
              ? "A handful of easy fixes will meaningfully improve this article's SEO."
              : "This article is missing several important SEO basics."}
        </p>
      </div>
    </div>
  );
}

export function BlogForm({
  postId,
  initial,
  categories,
}: {
  postId?: string;
  initial?: BlogPostRow | null;
  categories: BlogCategoryRow[];
}) {
  const router = useRouter();
  const [currentId, setCurrentId] = useState<string | undefined>(postId);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(initial?.hero_image_url ?? "");
  const [heroImageAlt, setHeroImageAlt] = useState(initial?.hero_image_alt ?? "");
  const contentFormat = initial?.content_format ?? "html"; // new posts always use the rich-text editor; existing legacy posts keep their plain-text editor.
  const [content, setContent] = useState(initial?.content ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [authorName, setAuthorName] = useState(initial?.author_name ?? "Haseeb");
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false);

  const [publicationMode, setPublicationMode] = useState<"draft" | "published" | "scheduled">(
    initial?.status === "published" ? "published" : initial?.scheduled_at ? "scheduled" : "draft"
  );
  const [scheduledAt, setScheduledAt] = useState(
    initial?.scheduled_at ? new Date(initial.scheduled_at).toISOString().slice(0, 16) : ""
  );

  const [metaTitle, setMetaTitle] = useState(initial?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(initial?.meta_description ?? "");
  const [focusKeyword, setFocusKeyword] = useState(initial?.focus_keyword ?? "");
  const [canonicalMode, setCanonicalMode] = useState<"auto" | "custom">(initial?.canonical_url ? "custom" : "auto");
  const [canonicalUrl, setCanonicalUrl] = useState(initial?.canonical_url ?? "");
  const [noindex, setNoindex] = useState(initial?.noindex ?? false);

  const [ogTitle, setOgTitle] = useState(initial?.og_title ?? "");
  const [ogDescription, setOgDescription] = useState(initial?.og_description ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(initial?.og_image_url ?? "");

  const [activeTab, setActiveTab] = useState<Tab>("content");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, setIsPending] = useState<"draft" | "published" | "preview" | null>(null);
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const heroFileRef = useRef<HTMLInputElement>(null);

  const seoTitle = metaTitle || title;
  const autoCanonical = `${SITE_ORIGIN}/blog/${slug || "..."}`;

  const stats = useMemo(() => computeContentStats(content), [content]);
  const contentChecks = useMemo(() => computeContentChecks(content, stats), [content, stats]);
  const seoResult = useMemo(
    () =>
      computeSeoScore({
        title,
        slug,
        focusKeyword,
        seoTitle,
        metaDescription,
        content,
        heroImageAlt,
      }),
    [title, slug, focusKeyword, seoTitle, metaDescription, content, heroImageAlt]
  );

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) {
      setSlug(value.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-"));
    }
  }

  function addTag() {
    const t = tagDraft.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagDraft("");
  }

  async function handleHeroUpload(file: File) {
    const fd = new FormData();
    fd.set("file", file);
    const url = await uploadBlogImage(fd);
    if (url) setHeroImageUrl(url);
  }

  async function handleEditorImageUpload(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.set("file", file);
    return uploadBlogImage(fd);
  }

  function buildFormData(mode: "draft" | "published" | "scheduled"): FormData {
    const fd = new FormData();
    fd.set("title", title);
    fd.set("slug", slug);
    fd.set("excerpt", excerpt);
    fd.set("content", content);
    fd.set("content_format", contentFormat);
    fd.set("category_id", categoryId);
    fd.set("hero_image_url", heroImageUrl);
    fd.set("hero_image_alt", heroImageAlt);
    fd.set("tags", tags.join(","));
    fd.set("author_name", authorName);
    if (isFeatured) fd.set("is_featured", "on");
    fd.set("publication_mode", mode);
    if (mode === "scheduled") fd.set("scheduled_at", scheduledAt);
    fd.set("meta_title", metaTitle);
    fd.set("meta_description", metaDescription);
    fd.set("focus_keyword", focusKeyword);
    if (canonicalMode === "custom") fd.set("canonical_url", canonicalUrl);
    if (noindex) fd.set("noindex", "on");
    fd.set("og_title", ogTitle);
    fd.set("og_description", ogDescription);
    fd.set("og_image_url", ogImageUrl);
    return fd;
  }

  async function handleSave(mode: "draft" | "published" | "scheduled", navigateAfter = true) {
    setErrorMsg(null);
    setIsPending(mode === "published" ? "published" : "draft");
    try {
      const fd = buildFormData(mode);
      const res = await saveBlogPost(currentId ?? null, { status: "idle" }, fd);
      if (res.status === "error") {
        setErrorMsg(res.error || "Something went wrong while saving.");
        return null;
      }
      if (res.savedId) {
        setCurrentId(res.savedId);
        if (!postId) router.replace(`/admin/blog/${res.savedId}`);
      }
      setStatus(mode === "published" ? "published" : "draft");
      if (navigateAfter) router.push("/admin/blog");
      return res.savedId ?? currentId ?? null;
    } finally {
      setIsPending(null);
    }
  }

  async function handlePreview() {
    setIsPending("preview");
    try {
      const id = await handleSave(publicationMode === "scheduled" ? "scheduled" : "draft", false);
      if (id) window.open(`/admin/blog-preview/${id}`, "_blank");
    } finally {
      setIsPending(null);
    }
  }

  async function handleUnpublish() {
    if (!currentId) return;
    if (!confirm("Unpublish this article? It will be removed from the public blog but its content will remain saved as a draft.")) return;
    await unpublishBlogPost(currentId);
    setStatus("draft");
    setPublicationMode("draft");
  }

  async function handleDelete() {
    if (!currentId) return;
    if (!confirm("Delete this article? This action cannot be undone.")) return;
    await deleteBlogPost(currentId);
    router.push("/admin/blog");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-masaar-black/50">
            <Link href="/admin" className="hover:underline">Dashboard</Link>
            <span>&rsaquo;</span>
            <Link href="/admin/blog" className="hover:underline">Blog</Link>
            <span>&rsaquo;</span>
            <span className="font-semibold text-masaar-black">{postId ? "Edit Article" : "Create New Article"}</span>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-masaar-black">{postId ? "Edit Article" : "Create New Article"}</h1>
            {postId && <Badge tone={status === "published" ? "green" : "gray"}>{status === "published" ? "Published" : "Draft"}</Badge>}
          </div>
          <p className="text-xs text-masaar-black/60">Update your article content, SEO settings and publish when ready.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {postId && status === "published" && (
            <button type="button" onClick={handleUnpublish} className="rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-masaar-black hover:bg-warm-ivory">
              Unpublish
            </button>
          )}
          {postId && (
            <button type="button" onClick={handleDelete} className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
              Delete
            </button>
          )}
          <SecondaryButton type="button" disabled={isPending !== null} onClick={() => handleSave("draft")}>
            {isPending === "draft" ? "Saving…" : "Save Draft"}
          </SecondaryButton>
          <SecondaryButton type="button" disabled={isPending !== null} onClick={handlePreview}>
            {isPending === "preview" ? "Opening…" : "👁 Preview"}
          </SecondaryButton>
          <PrimaryButton
            type="button"
            disabled={isPending !== null}
            onClick={() => handleSave(publicationMode === "scheduled" ? "scheduled" : "published")}
          >
            {isPending === "published" ? "Saving…" : publicationMode === "scheduled" ? "Schedule" : "Publish"}
          </PrimaryButton>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">{errorMsg}</div>
      )}

      <div className="flex flex-wrap gap-1 border-b border-black/10">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === tab.key ? "border-admin-primary text-admin-primary" : "border-transparent text-masaar-black/50 hover:text-masaar-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "content" && (
        <div className="rounded-lg border border-black/10 bg-white p-6 space-y-5">
          <Field label="Article Title" required>
            <input value={title} onChange={(e) => handleTitleChange(e.target.value)} className={inputClass} placeholder="e.g. What to Pack for Umrah: A Practical Checklist" required />
            <p className="mt-1 text-right text-[10px] text-masaar-black/40">Characters: {title.length}/70</p>
          </Field>

          <Field label="URL Slug" required hint="Keep it short, descriptive and SEO-friendly.">
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs text-masaar-black/40">{SITE_ORIGIN}/blog/</span>
              <input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                className={inputClass}
                required
              />
            </div>
          </Field>

          <div>
            <span className="mb-1 block text-sm font-medium text-masaar-black">Featured Image</span>
            <div className="flex flex-wrap items-start gap-4">
              {heroImageUrl ? (
                <div className="relative">
                  <div className="relative h-32 w-52 overflow-hidden rounded-lg border border-black/10 bg-warm-ivory">
                    <Image src={heroImageUrl} alt="" fill className="object-cover" unoptimized />
                  </div>
                  <button
                    type="button"
                    onClick={() => setHeroImageUrl("")}
                    className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-masaar-black text-xs text-white"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => heroFileRef.current?.click()}
                  className="flex h-32 w-52 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-black/20 text-xs text-masaar-black/50 hover:border-admin-primary hover:text-admin-primary"
                >
                  <span>⬆ Upload Image</span>
                  <span>JPG, PNG or WebP (Max 5MB)</span>
                </button>
              )}
              <input
                ref={heroFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleHeroUpload(file);
                }}
              />
              <div className="min-w-48 flex-1">
                <Field label="Image Alt Text" required hint='Describe the image for accessibility (e.g. "Kaaba in Makkah during Umrah").'>
                  <input value={heroImageAlt} onChange={(e) => setHeroImageAlt(e.target.value)} className={inputClass} />
                </Field>
              </div>
            </div>
          </div>

          <div>
            <span className="mb-1 block text-sm font-medium text-masaar-black">Article Content</span>
            {contentFormat === "html" ? (
              <RichTextEditor content={content} onChange={setContent} uploadImage={handleEditorImageUpload} />
            ) : (
              <>
                <p className="mb-2 text-xs text-masaar-black/60">
                  This article uses the original plain-text format — start a line with <code className="rounded bg-black/5 px-1">## </code> for a
                  subheading, and lines starting with <code className="rounded bg-black/5 px-1">- </code> for a bullet list.
                </p>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={18} className={`${inputClass} font-mono text-xs leading-relaxed`} />
              </>
            )}
            <p className="mt-1 text-right text-[10px] text-masaar-black/40">Words: {stats.wordCount}</p>
          </div>
        </div>
      )}

      {activeTab === "details" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-5 rounded-lg border border-black/10 bg-white p-6 lg:col-span-2">
            <Field label="Excerpt" hint="Short summary shown on the blog listing card.">
              <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} className={inputClass} />
            </Field>

            <Field label="Category" required>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
                <option value="">Select a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-masaar-black/50">
                Categories can be managed from <Link href="/admin/blog/categories" className="text-admin-primary underline">Blog Categories</Link>.
              </p>
            </Field>

            <Field label="Tags">
              <div className="flex flex-wrap items-center gap-2 rounded-md border border-black/15 p-2">
                {tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 rounded bg-admin-surface px-2 py-1 text-xs font-medium text-masaar-black">
                    {t}
                    <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="text-masaar-black/40 hover:text-masaar-black">✕</button>
                  </span>
                ))}
                <input
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add a tag and press Enter…"
                  className="min-w-32 flex-1 border-none text-sm outline-none"
                />
              </div>
            </Field>

            <Field label="Author" required>
              <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} className={inputClass} />
            </Field>
          </div>

          <div className="space-y-5 rounded-lg border border-black/10 bg-white p-6">
            <h3 className="font-bold text-sm text-masaar-black">Publication Settings</h3>
            <p className="text-xs text-masaar-black/50">Choose when and how this article will be published.</p>
            <div className="space-y-2">
              {(["draft", "published", "scheduled"] as const).map((mode) => (
                <label key={mode} className="flex cursor-pointer items-start gap-2 text-sm">
                  <input type="radio" checked={publicationMode === mode} onChange={() => setPublicationMode(mode)} className="mt-1" />
                  <span>
                    <span className="block font-semibold capitalize text-masaar-black">{mode}</span>
                    <span className="block text-xs text-masaar-black/50">
                      {mode === "draft" && "Save as a draft (not visible on website)"}
                      {mode === "published" && "Publish immediately"}
                      {mode === "scheduled" && "Set a future date and time"}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            {publicationMode === "scheduled" && (
              <Field label="Publish At" required>
                <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputClass} />
              </Field>
            )}

            <label className="flex items-center justify-between gap-3 rounded-md border border-black/10 p-3 text-sm">
              <span>
                <span className="block font-semibold text-masaar-black">Feature this article</span>
                <span className="block text-xs text-masaar-black/50">Show this article in featured sections on the blog.</span>
              </span>
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            </label>
          </div>
        </div>
      )}

      {activeTab === "seo" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-5 rounded-lg border border-black/10 bg-white p-6 lg:col-span-2">
            <Field label="Focus Keyword" hint="This helps us analyse your content and give SEO recommendations.">
              <input value={focusKeyword} onChange={(e) => setFocusKeyword(e.target.value)} className={inputClass} />
            </Field>

            <Field label="SEO Title" required hint="This will appear in search engine results.">
              <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder={`${title} | Masaar Holidays`} className={inputClass} />
              <CounterBar value={(metaTitle || `${title} | Masaar Holidays`).length} max={60} />
            </Field>

            <Field label="Meta Description" required hint="Write a concise and compelling description for search engines.">
              <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={3} placeholder={excerpt} className={inputClass} />
              <CounterBar value={(metaDescription || excerpt).length} max={160} />
            </Field>

            <label className="flex items-center justify-between gap-3 rounded-md border border-black/10 p-3 text-sm">
              <span>
                <span className="block font-semibold text-masaar-black">Allow search engines to index this article</span>
                <span className="block text-xs text-masaar-black/50">If disabled, this article will not appear in search results.</span>
              </span>
              <input type="checkbox" checked={!noindex} onChange={(e) => setNoindex(!e.target.checked)} />
            </label>

            <div className="rounded-lg border border-black/10 p-4">
              <p className="mb-2 text-xs font-semibold text-masaar-black/60">Search Result Preview</p>
              <p className="truncate text-sm text-[#1a0dab]">{metaTitle || `${title || "Article Title"} | Masaar Holidays`}</p>
              <p className="text-xs text-green-800">{SITE_ORIGIN.replace(/^https?:\/\//, "")} › blog › {slug}</p>
              <p className="mt-1 text-xs text-masaar-black/60">{metaDescription || excerpt}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-black/10 bg-white p-5">
              <p className="mb-3 text-sm font-bold text-masaar-black">SEO Score</p>
              <ScoreGauge score={seoResult.score} verdict={seoResult.verdict} />
            </div>
            <div className="rounded-lg border border-black/10 bg-white p-5">
              <p className="mb-3 text-sm font-bold text-masaar-black">SEO Checks</p>
              <ul className="space-y-2 text-xs">
                {seoResult.checks.map((c) => (
                  <li key={c.label} className="flex items-start gap-2">
                    <span className={c.passed ? "text-green-600" : "text-amber-500"}>{c.passed ? "✓" : "!"}</span>
                    <span className={c.passed ? "text-masaar-black/70" : "text-masaar-black"}>{c.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-black/10 bg-white p-5">
              <p className="mb-3 text-sm font-bold text-masaar-black">Content Check</p>
              <ul className="mb-4 space-y-2 text-xs">
                {contentChecks.map((c) => (
                  <li key={c.label} className="flex items-start gap-2">
                    <span className={c.passed ? "text-green-600" : "text-amber-500"}>{c.passed ? "✓" : "!"}</span>
                    <span className={c.passed ? "text-masaar-black/70" : "text-masaar-black"}>{c.label}</span>
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-3 gap-2 border-t border-black/5 pt-3 text-center text-[10px] text-masaar-black/50">
                <div><p className="text-sm font-bold text-masaar-black">{stats.wordCount}</p>Words</div>
                <div><p className="text-sm font-bold text-masaar-black">{stats.readingTimeMinutes}m</p>Read</div>
                <div><p className="text-sm font-bold text-masaar-black">{stats.headingCount}</p>Headings</div>
                <div><p className="text-sm font-bold text-masaar-black">{stats.imageCount}</p>Images</div>
                <div><p className="text-sm font-bold text-masaar-black">{stats.internalLinkCount}</p>Internal</div>
                <div><p className="text-sm font-bold text-masaar-black">{stats.externalLinkCount}</p>External</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "social" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5 rounded-lg border border-black/10 bg-white p-6">
            <p className="text-xs text-masaar-black/60">Optimise how your article appears when shared on social media. Leave empty to reuse the SEO title/description/image above.</p>
            <Field label="Social Title">
              <input value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} placeholder={seoTitle} className={inputClass} />
            </Field>
            <Field label="Social Description">
              <textarea value={ogDescription} onChange={(e) => setOgDescription(e.target.value)} rows={3} placeholder={metaDescription || excerpt} className={inputClass} />
            </Field>
            <Field label="Social Image URL" hint="Falls back to the featured image.">
              <input value={ogImageUrl} onChange={(e) => setOgImageUrl(e.target.value)} placeholder={heroImageUrl} className={inputClass} />
            </Field>
          </div>
          <div className="rounded-lg border border-black/10 bg-white p-5">
            <p className="mb-3 text-xs font-semibold text-masaar-black/60">Social Preview</p>
            <div className="overflow-hidden rounded-lg border border-black/10">
              <div className="relative h-40 w-full bg-warm-ivory">
                {(ogImageUrl || heroImageUrl) && (
                  <Image src={ogImageUrl || heroImageUrl} alt="" fill className="object-cover" unoptimized />
                )}
              </div>
              <div className="bg-warm-ivory p-3">
                <p className="text-[10px] uppercase tracking-wide text-masaar-black/40">{SITE_ORIGIN.replace(/^https?:\/\//, "")}</p>
                <p className="text-sm font-semibold text-masaar-black">{ogTitle || seoTitle || "Article Title"}</p>
                <p className="text-xs text-masaar-black/60">{ogDescription || metaDescription || excerpt}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "advanced" && (
        <div className="rounded-lg border border-black/10 bg-white p-6 space-y-5">
          <div>
            <span className="mb-1 block text-sm font-medium text-masaar-black">Canonical URL</span>
            <div className="flex items-center gap-2">
              <select value={canonicalMode} onChange={(e) => setCanonicalMode(e.target.value as "auto" | "custom")} className={inputClass}>
                <option value="auto">Auto (Use default URL)</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {canonicalMode === "auto" ? (
              <p className="mt-2 rounded-md bg-admin-surface px-3 py-2 text-xs text-masaar-black/50">{autoCanonical}</p>
            ) : (
              <input value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} className={`${inputClass} mt-2`} placeholder={autoCanonical} />
            )}
            <p className="mt-1 text-xs text-masaar-black/50">Set a custom canonical URL only if this content is available under a different URL.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="mb-1 block text-sm font-medium text-masaar-black">Schema Type</span>
              <p className="rounded-md bg-admin-surface px-3 py-2 text-sm text-masaar-black/70">Article</p>
              <p className="mt-1 text-xs text-masaar-black/50">Structured data (Article schema) is generated automatically. You don&apos;t need to edit any code.</p>
            </div>
            <div>
              <span className="mb-1 block text-sm font-medium text-masaar-black">Author</span>
              <p className="rounded-md bg-admin-surface px-3 py-2 text-sm text-masaar-black/70">{authorName}</p>
            </div>
            <div>
              <span className="mb-1 block text-sm font-medium text-masaar-black">Published Date</span>
              <p className="rounded-md bg-admin-surface px-3 py-2 text-sm text-masaar-black/70">
                {initial?.published_at ? new Date(initial.published_at).toLocaleString() : "Set automatically when published"}
              </p>
            </div>
            <div>
              <span className="mb-1 block text-sm font-medium text-masaar-black">Modified Date</span>
              <p className="rounded-md bg-admin-surface px-3 py-2 text-sm text-masaar-black/70">
                {initial?.updated_at ? new Date(initial.updated_at).toLocaleString() : "Updated automatically when changes are saved"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
