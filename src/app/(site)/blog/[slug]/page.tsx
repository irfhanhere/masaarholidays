import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticleTemplate } from "@/components/site/BlogArticleTemplate";
import { BlogArticleSchema } from "@/components/site/BlogArticleSchema";
import { getBlogCategoryById, getBlogPostBySlug, getRelatedBlogPosts } from "@/lib/data/public";
import { buildPageMetadata } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return buildPageMetadata({ path: `/blog/${slug}`, title: "Article | Masaar Holidays" });

  const metadata = await buildPageMetadata({
    path: `/blog/${slug}`,
    title: post.meta_title || `${post.title} | Masaar Holidays`,
    description: post.meta_description || post.excerpt || undefined,
    ogImageUrl: post.og_image_url || post.hero_image_url,
    noindex: post.noindex,
  });

  if (post.canonical_url) {
    metadata.alternates = { ...metadata.alternates, canonical: post.canonical_url };
  }

  // Social Sharing tab's own og_title/og_description take priority for the
  // share-card text specifically — falls back to the same chain used for
  // the page <title>/meta description when left blank, same as before.
  const socialTitle = post.og_title || post.meta_title || `${post.title} | Masaar Holidays`;
  const socialDescription = post.og_description || post.meta_description || post.excerpt || undefined;
  metadata.openGraph = { ...metadata.openGraph, title: socialTitle, description: socialDescription };
  metadata.twitter = { ...metadata.twitter, title: socialTitle, description: socialDescription };

  return metadata;
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const [category, relatedPosts] = await Promise.all([
    getBlogCategoryById(post.category_id),
    getRelatedBlogPosts(post.id, post.category_id),
  ]);

  return (
    <>
      <BlogArticleSchema post={post} />
      <BlogArticleTemplate post={post} category={category} relatedPosts={relatedPosts} />
    </>
  );
}
