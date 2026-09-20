import Link from "next/link";

/**
 * Shared blog-article sidebar CTA — used by both the public /blog/[slug] page
 * and the admin Article Preview, so it's never hand-duplicated per article.
 */
export function BlogPromoCallout() {
  return (
    <div className="rounded-xl bg-masaar-black p-5 text-white">
      <p className="text-2xl" aria-hidden="true">🕋</p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-lg font-semibold">
        Plan Your Umrah with Confidence
      </p>
      <p className="mt-2 text-xs leading-relaxed text-white/70">
        Let Masaar Holidays take care of your journey, so you can focus on what matters most.
      </p>
      <Link
        href="/umrah"
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-deep-gold px-4 py-2 text-xs font-semibold text-white hover:bg-pure-gold"
      >
        View Umrah Packages →
      </Link>
    </div>
  );
}
