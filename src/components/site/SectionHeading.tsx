export function SectionHeading({
  eyebrow,
  title,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-deep-gold">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-masaar-black sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}

/** Marks a spot where final marketing copy is still pending — never
 * invented text. Renders visibly (muted/italic) so it's obvious in
 * preview, not mistaken for shipped content. */
export function ContentPending({ note }: { note?: string }) {
  return (
    <p className="text-sm italic text-masaar-black/40">
      {note ?? "This page's content is coming soon."}
    </p>
  );
}

export function EmptyState({ title, note }: { title: string; note?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-black/15 bg-white/60 px-6 py-10 text-center">
      <p className="text-sm font-medium text-masaar-black/70">{title}</p>
      {note && <p className="mt-1 text-sm text-masaar-black/50">{note}</p>}
    </div>
  );
}
