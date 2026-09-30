import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/Container";
import { ExternalImage } from "@/components/site/ExternalImage";
import { EmptyState, SectionHeading } from "@/components/site/SectionHeading";
import { getActiveBlogCategories, getPublishedBlogPosts } from "@/lib/data/public";
import { buildStaticPageMetadata } from "@/lib/i18n";

// Admin-editable via Admin → Page SEO (page_seo table) — see buildStaticPageMetadata.
export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata({
    path: "/blog",
    fallbackTitle: "Masaar Journal — Umrah & Hajj Travel Guides",
    fallbackDescription:
      "Practical, honest guides for Umrah and Hajj travel — preparation, packing, family planning, and what to expect in Makkah and Madinah.",
  });
}

export default async function BlogPage() {
  const [posts, categories] = await Promise.all([getPublishedBlogPosts(), getActiveBlogCategories()]);
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <section className="py-16">
      <Container>
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-deep-gold">
            Masaar Journal
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-masaar-black sm:text-4xl">
            Umrah &amp; Hajj Travel Guides
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-masaar-black/70 sm:text-base">
            Practical advice, preparation checklists, spiritual insights, and authentic travel guides for your pilgrimage from the UAE to Makkah and Madinah.
          </p>
        </div>
        <div className="mt-10">
          {posts.length === 0 ? (
            <EmptyState
              title="No articles published yet"
              note="Articles are being drafted — check back soon, or manage them from Admin → Blog once ready."
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col overflow-hidden rounded-lg border border-black/10 bg-white transition-all hover:border-pure-gold hover:shadow-md"
                >
                  <div className="relative h-44 w-full overflow-hidden bg-warm-ivory">
                    {post.hero_image_url && (
                      <ExternalImage
                        src={post.hero_image_url}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    {(post.category_id ? categoryNameById.get(post.category_id) : post.category) && (
                      <span className="text-xs font-semibold uppercase tracking-wider text-deep-gold">
                        {post.category_id ? categoryNameById.get(post.category_id) : post.category}
                      </span>
                    )}
                    <h3 className="mt-1 text-lg font-semibold text-masaar-black group-hover:text-deep-gold">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-masaar-black/70">{post.excerpt}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
