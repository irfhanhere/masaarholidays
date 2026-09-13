import { Container } from "./Container";
import { ContentPending } from "./SectionHeading";

export function LegalPage({ title, note }: { title: string; note?: string }) {
  return (
    <section className="py-16">
      <Container className="max-w-3xl">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-masaar-black sm:text-4xl">
          {title}
        </h1>
        <div className="mt-6">
          <ContentPending note={note} />
        </div>
      </Container>
    </section>
  );
}
