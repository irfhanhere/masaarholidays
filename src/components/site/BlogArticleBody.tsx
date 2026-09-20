import { renderLegalContent } from "./LegalPage";
import type { BlogContentFormat } from "@/lib/types/database";

/**
 * Renders blog_posts.content correctly for either format: 'html' (real
 * WYSIWYG output from the RichTextEditor) or 'legacy' (the older ##/-
 * plain-text markup shared with Legal pages). Shared by the public
 * /blog/[slug] page and the admin Article Preview so they never drift.
 */
export function BlogArticleBody({ content, format }: { content: string; format: BlogContentFormat }) {
  if (format === "html") {
    return <div className="blog-richtext text-sm text-masaar-black" dangerouslySetInnerHTML={{ __html: content }} />;
  }
  return <>{renderLegalContent(content)}</>;
}
