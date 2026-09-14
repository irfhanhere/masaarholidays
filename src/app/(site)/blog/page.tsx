import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { EmptyState, SectionHeading } from "@/components/site/SectionHeading";
import { buildPageMetadata } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    path: "/blog",
    title: "Masaar Journal — Umrah & Hajj Travel Guides",
    description:
      "Practical, honest guides for Umrah and Hajj travel — preparation, packing, family planning, and what to expect in Makkah and Madinah.",
  });
}

export default function BlogPage() {
  return (
    <section className="py-16">
      <Container>
        <SectionHeading eyebrow="Masaar Journal" title="Umrah & Hajj Travel Guides" />
        <div className="mt-10">
          <EmptyState
            title="No articles published yet"
            note="18 articles are planned across 6 clusters (content-seo-starter-kit.md, Section 5) — a blog_posts table and Admin → Blog CMS are the next schema addition once article drafting starts."
          />
        </div>
      </Container>
    </section>
  );
}
