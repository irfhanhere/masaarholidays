import Link from "next/link";
import { Breadcrumbs } from "./Breadcrumbs";
import { Container } from "./Container";
import { ExternalImage } from "./ExternalImage";
import { BlogArticleBody } from "./BlogArticleBody";
import { BlogPromoCallout } from "./BlogPromoCallout";
import { computeContentStats, computeTableOfContents } from "@/lib/blog-seo";
import type { BlogCategoryRow, BlogPostRow } from "@/lib/types/database";

/**
 * The real public blog-article template — rendered by both /blog/[slug]
 * (live site) and the admin Article Preview, so preview is never a
 * hand-maintained copy that can drift from what visitors actually see.
 */
export function BlogArticleTemplate({
  post,
  category,
  relatedPosts,
}: {
  post: BlogPostRow;
  category: BlogCategoryRow | null;
  relatedPosts: BlogPostRow[];
}) {
  const stats = computeContentStats(post.content);
  const toc = computeTableOfContents(post.content);
  const dateLabel = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <>
      <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: post.title }]} />
      <section className="py-16">
      <Container className="max-w-5xl">
        {category && (
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-deep-gold">{category.name}</p>
        )}
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-masaar-black sm:text-4xl">
          {post.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-masaar-black/50">
          <span className="flex size-6 items-center justify-center rounded-full bg-warm-ivory text-[10px] font-bold text-masaar-black">
            {post.author_name.charAt(0)}
          </span>
          <span>By {post.author_name}</span>
          {dateLabel && (
            <>
              <span aria-hidden="true">·</span>
              <span>{dateLabel}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>{stats.readingTimeMinutes} min read</span>
        </div>

        {post.hero_image_url && (
          <div className="relative mt-6 h-64 w-full overflow-hidden rounded-lg bg-warm-ivory sm:h-96">
            <ExternalImage src={post.hero_image_url} alt={post.hero_image_alt || post.title} fill className="object-cover" />
          </div>
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_280px]">
          <div className="min-w-0">
            <BlogArticleBody content={post.content} format={post.content_format} />

            {(post.tags ?? []).length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2 border-t border-black/5 pt-6">
                {post.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-warm-ivory px-3 py-1 text-xs font-medium text-masaar-black/70">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            {toc.length > 0 && (
              <div className="rounded-xl border border-black/10 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-masaar-black/50">In this article</p>
                <ol className="mt-3 space-y-2 text-sm text-masaar-black/70">
                  {toc.map((entry, i) => (
                    <li key={i} className={entry.level === 3 ? "pl-3" : ""}>
                      {i + 1}. {entry.text}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <BlogPromoCallout />
          </aside>
        </div>

        {relatedPosts.length > 0 && (
          <div className="mt-14 border-t border-black/5 pt-10">
            <p className="text-sm font-bold uppercase tracking-wide text-masaar-black/60">Related Articles</p>
            <div className="mt-4 grid gap-5 sm:grid-cols-3">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/blog/${rp.slug}`}
                  className="group flex flex-col overflow-hidden rounded-lg border border-black/10 bg-white hover:border-pure-gold"
                >
                  <div className="relative h-28 w-full bg-warm-ivory">
                    {rp.hero_image_url && (
                      <ExternalImage src={rp.hero_image_url} alt={rp.title} fill className="object-cover" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-masaar-black group-hover:text-deep-gold">{rp.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>
      </section>
    </>
  );
}
