import { Container } from "@/components/site/Container";

function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-black/5 ${className}`} />;
}

export default function UmrahJourneyLoading() {
  return (
    <>
      <div className="h-64 w-full animate-pulse bg-masaar-black/90 sm:h-80" />
      <Container className="space-y-10 py-10">
        <div className="grid gap-3 sm:grid-cols-3">
          <Block className="h-24" />
          <Block className="h-24" />
          <Block className="h-24" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Block key={i} className="h-10 w-24" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Block className="h-64" />
          <Block className="h-64" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Block className="h-56" />
          <Block className="h-56" />
        </div>
      </Container>
    </>
  );
}
