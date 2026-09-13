import Image from "next/image";
import Link from "next/link";

// System page — noindex, no main nav (brief: "System pages (noindex, no
// nav): 404, 500, Maintenance"). Deliberately outside the (site) route
// group so it doesn't get the Header/Footer.
export const metadata = { robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-warm-ivory px-6 text-center">
      <Image src="/brand/logo.png" alt="Masaar Holidays" width={160} height={48} className="h-11 w-auto" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-deep-gold">
          Some journeys take a different path
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-7xl font-bold text-masaar-black">
          404
        </h1>
        <h2 className="mt-2 text-2xl font-semibold text-masaar-black">
          This journey has taken a different turn.
        </h2>
        <p className="mt-2 text-masaar-black/60">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-md bg-admin-primary px-5 py-3 text-sm font-semibold text-white">
          Back to Home
        </Link>
        <Link
          href="/umrah"
          className="rounded-md border border-masaar-black px-5 py-3 text-sm font-semibold text-masaar-black"
        >
          Explore Umrah
        </Link>
      </div>
      <Link href="/contact" className="text-sm font-medium text-deep-gold underline">
        Contact Masaar
      </Link>
    </div>
  );
}
