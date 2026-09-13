export function ImportantNotice({ title, points }: { title: string; points: string[] }) {
  return (
    <div className="rounded-lg bg-masaar-black p-6 text-white">
      <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-light-gold">
        {title}
      </h3>
      <ul className="mt-3 space-y-2 text-sm text-white/80">
        {points.map((point) => (
          <li key={point} className="flex gap-2">
            <span className="text-pure-gold">•</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
