import { ComingSoon } from "@/components/admin/ComingSoon";

export const metadata = { title: "Blog | Masaar Admin", robots: { index: false } };

export default function AdminBlogPage() {
  return (
    <ComingSoon
      title="Blog"
      description="Full blog CMS with SEO score, readability checks and categories — needs a blog_posts table (not part of the requested schema) before this can be wired up."
      inspirationFile="ADMIN-BLOG OVERVIW.png"
    />
  );
}
