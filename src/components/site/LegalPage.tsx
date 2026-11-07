import React from "react";
import Link from "next/link";
import { Container } from "./Container";
import { ContentPending } from "./SectionHeading";

type ContentBlock = { type: "heading"; text: string } | { type: "list"; items: string[] } | { type: "paragraph"; lines: string[] };

/**
 * Parses markdown [anchor text](/url) into accessible internal Next.js links or external anchors.
 */
function renderTextWithLinks(text: string): React.ReactNode {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  if (!linkRegex.test(text)) {
    return text;
  }
  linkRegex.lastIndex = 0;
  const parts: (string | React.ReactNode)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const label = match[1];
    const href = match[2];
    const isInternal = href.startsWith("/");
    if (isInternal) {
      parts.push(
        <Link
          key={match.index}
          href={href}
          className="font-medium text-[#8C6B1A] underline decoration-deep-gold/40 underline-offset-2 transition-colors hover:text-deep-gold hover:decoration-deep-gold"
        >
          {label}
        </Link>
      );
    } else {
      parts.push(
        <a
          key={match.index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#8C6B1A] underline decoration-deep-gold/40 underline-offset-2 transition-colors hover:text-deep-gold hover:decoration-deep-gold"
        >
          {label}
        </a>
      );
    }
    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/**
 * Renders the lightweight markup used by legal_pages.content and
 * blog_posts.content: "## " always starts a new subheading (its own
 * line, whether or not a blank line precedes/follows it — admins
 * shouldn't have to remember to add one), a run of "- " lines becomes a
 * bullet list, and any other run of lines becomes a paragraph, broken by
 * a blank line, a heading, or a list. Deliberately not full markdown —
 * this content is short, admin-edited plain text, not a rich-text CMS.
 */
export function renderLegalContent(content: string) {
  const blocks: ContentBlock[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      blocks.push({ type: "paragraph", lines: paragraphLines });
      paragraphLines = [];
    }
  };
  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: "list", items: listItems });
      listItems = [];
    }
  };

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (line === "") {
      flushParagraph();
      flushList();
    } else if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", text: line.slice(3).trim() });
    } else if (line.startsWith("- ")) {
      flushParagraph();
      listItems.push(line.slice(2));
    } else {
      flushList();
      paragraphLines.push(line);
    }
  }
  flushParagraph();
  flushList();

  return blocks.map((block, i) => {
    if (block.type === "heading") {
      return (
        <h2 key={i} className="mt-8 text-xl font-semibold text-masaar-black first:mt-0">
          {block.text}
        </h2>
      );
    }
    if (block.type === "list") {
      return (
        <ul key={i} className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-masaar-black/75">
          {block.items.map((item, j) => (
            <li key={j}>{renderTextWithLinks(item)}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={i} className="mt-3 text-sm leading-relaxed text-masaar-black/75">
        {renderTextWithLinks(block.lines.join(" "))}
      </p>
    );
  });
}

export function LegalPage({
  title,
  content,
  updatedAt,
  note,
}: {
  title: string;
  content?: string | null;
  updatedAt?: string | null;
  note?: string;
}) {
  return (
    <section className="py-16">
      <Container className="max-w-3xl">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-masaar-black sm:text-4xl">
          {title}
        </h1>
        {updatedAt && (
          <p className="mt-2 text-xs text-masaar-black/50">
            Last updated {new Date(updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}

        <div className="mt-6">
          {content ? renderLegalContent(content) : <ContentPending note={note} />}
        </div>
      </Container>
    </section>
  );
}
