export interface FaqItemSchema {
  question: string;
  answer: string;
}

/** FAQPage JSON-LD built directly from real visible questions and answers shown on the page — no rewritten or invented questions. */
export function FaqSchema({ faqs }: { faqs: FaqItemSchema[] }) {
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
