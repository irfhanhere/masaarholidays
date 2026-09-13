import { notFound } from "next/navigation";

// No blog_posts table exists yet (not part of the requested schema) and no
// articles have been drafted (content-seo-starter-kit.md, Section 5) — so
// every slug 404s honestly rather than rendering invented content.
export default async function BlogArticlePage() {
  notFound();
}
