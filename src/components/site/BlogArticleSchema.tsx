import type { BlogPostRow } from "@/lib/types/database";
import { getSiteOrigin } from "@/lib/site-url";

const SITE_ORIGIN = getSiteOrigin();

/**
 * Article/BlogPosting JSON-LD for a single blog post — built entirely from
 * the real blog_posts row. Fields with no real value (e.g. no hero image)
 * are omitted rather than filled with a placeholder. Author uses Person
 * (post.author_name, shown on the page as "By {author_name}"); publisher
 * reuses the same Organization identity as OrganizationSchema (Breadcrumbs.tsx)
 * for consistency site-wide.
 */
export function BlogArticleSchema({ post }: { post: BlogPostRow }) {
  const canonicalUrl = post.canonical_url || `${SITE_ORIGIN}/blog/${post.slug}`;
  const imageUrl = post.og_image_url || post.hero_image_url;
  const description = post.meta_description || post.excerpt;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    ...(imageUrl ? { image: [imageUrl.startsWith("http") ? imageUrl : `${SITE_ORIGIN}${imageUrl}`] } : {}),
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    dateModified: post.updated_at,
    author: {
      "@type": "Person",
      name: post.author_name,
    },
    publisher: {
      "@type": "Organization",
      name: "Masaar Holidays",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_ORIGIN}/brand/logo.png`,
      },
    },
    ...(description ? { description } : {}),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
