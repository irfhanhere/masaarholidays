/**
 * Pure, regex-based computation of the Blog editor's SEO score, SEO
 * checklist, content-quality checklist, and content statistics — no DOM
 * APIs, so it runs the same in the browser (live, as the admin types) or
 * on the server. Deliberately not a real SEO audit tool: these are
 * heuristic, self-explanatory checks against the article's own fields,
 * meant to guide the admin, not to guarantee search rankings.
 */

export interface BlogSeoInput {
  title: string;
  slug: string;
  focusKeyword: string;
  seoTitle: string;
  metaDescription: string;
  /** HTML content (content_format === "html") or plain legacy markup — both are stripped to text/structure the same way. */
  content: string;
  heroImageAlt: string;
}

export interface SeoCheck {
  label: string;
  passed: boolean;
}

export interface BlogSeoResult {
  score: number;
  verdict: "Good" | "Needs work" | "Poor";
  checks: SeoCheck[];
}

export interface ContentStats {
  wordCount: number;
  readingTimeMinutes: number;
  headingCount: number;
  imageCount: number;
  internalLinkCount: number;
  externalLinkCount: number;
}

export interface ContentCheck {
  label: string;
  passed: boolean;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function countMatches(text: string, pattern: RegExp): number {
  return (text.match(pattern) ?? []).length;
}

function includesLoose(haystack: string, needle: string): boolean {
  if (!needle.trim()) return false;
  return haystack.toLowerCase().includes(needle.trim().toLowerCase());
}

export function computeContentStats(content: string): ContentStats {
  const plainText = stripTags(content);
  const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
  const headingCount = countMatches(content, /<h[23][ >]/gi) + countMatches(content, /^##\s+/gm);
  const imageCount = countMatches(content, /<img[ >]/gi);
  const links = content.match(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi) ?? [];
  let internalLinkCount = 0;
  let externalLinkCount = 0;
  for (const link of links) {
    const hrefMatch = link.match(/href=["']([^"']+)["']/i);
    const href = hrefMatch?.[1] ?? "";
    if (href.startsWith("/") || href.includes("masaarholidays.com")) internalLinkCount++;
    else if (href.startsWith("http")) externalLinkCount++;
  }

  return {
    wordCount,
    readingTimeMinutes: Math.max(1, Math.round(wordCount / 200)),
    headingCount,
    imageCount,
    internalLinkCount,
    externalLinkCount,
  };
}

export interface TocEntry {
  level: 2 | 3;
  text: string;
}

/** Extracts H2/H3 headings for the article's "In this article" table of contents — works for
 *  both HTML content (real <h2>/<h3> tags) and the legacy "## " plain-text markup. */
export function computeTableOfContents(content: string): TocEntry[] {
  const entries: TocEntry[] = [];
  const htmlMatches = content.matchAll(/<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi);
  for (const m of htmlMatches) {
    entries.push({ level: Number(m[1]) as 2 | 3, text: stripTags(m[2]) });
  }
  if (entries.length === 0) {
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("## ")) entries.push({ level: 2, text: trimmed.slice(3).trim() });
    }
  }
  return entries;
}

export function computeContentChecks(content: string, stats: ContentStats): ContentCheck[] {
  const plainText = stripTags(content);
  const paragraphs = content.split(/<\/p>|\n\n+/).map((p) => stripTags(p)).filter(Boolean);
  const firstParagraphWords = paragraphs[0]?.split(/\s+/).filter(Boolean).length ?? 0;
  const longParagraphs = paragraphs.filter((p) => p.split(/\s+/).filter(Boolean).length > 120);

  return [
    { label: "Article has a clear introduction", passed: firstParagraphWords >= 15 },
    { label: "Paragraphs are easy to scan", passed: longParagraphs.length === 0 },
    { label: "Heading structure detected", passed: stats.headingCount >= 2 },
    { label: "Images included", passed: stats.imageCount >= 1 },
    { label: "Content has meaningful length", passed: plainText.split(/\s+/).filter(Boolean).length >= 150 },
  ];
}

export function computeSeoScore(input: BlogSeoInput): BlogSeoResult {
  const stats = computeContentStats(input.content);
  const plainText = stripTags(input.content);
  const hasKeyword = input.focusKeyword.trim().length > 0;

  const checks: SeoCheck[] = [
    { label: "SEO title set", passed: input.seoTitle.trim().length > 0 },
    { label: "Meta description set", passed: input.metaDescription.trim().length >= 50 },
    { label: "Focus keyword included in SEO title", passed: hasKeyword && includesLoose(input.seoTitle, input.focusKeyword) },
    { label: "Focus keyword included in meta description", passed: hasKeyword && includesLoose(input.metaDescription, input.focusKeyword) },
    { label: "Focus keyword appears in content", passed: hasKeyword && includesLoose(plainText, input.focusKeyword) },
    { label: "URL contains focus keyword", passed: hasKeyword && includesLoose(input.slug.replace(/-/g, " "), input.focusKeyword) },
    { label: "Article has one H1 (the article title)", passed: input.title.trim().length > 0 },
    { label: "H2 headings used", passed: stats.headingCount >= 1 },
    { label: "Featured image has alt text", passed: input.heroImageAlt.trim().length > 0 },
    { label: "Internal links found", passed: stats.internalLinkCount >= 1 },
    { label: "Add more descriptive subheadings", passed: stats.headingCount >= 3 },
    { label: "Add one relevant internal link", passed: stats.internalLinkCount >= 1 },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);
  const verdict: BlogSeoResult["verdict"] = score >= 80 ? "Good" : score >= 50 ? "Needs work" : "Poor";

  return { score, verdict, checks };
}
