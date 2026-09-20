import type { FaqRow } from "@/lib/types/database";

/** FAQPage JSON-LD built directly from the real published faqs rows shown on the page — no rewritten or invented questions. */
export function FaqSchema({ faqs }: { faqs: FaqRow[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
