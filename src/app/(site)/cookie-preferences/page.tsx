import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { renderLegalContent } from "@/components/site/LegalPage";
import { getLegalPage } from "@/lib/data/public";
import { buildAlternates, getRequestLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: "Cookie Preferences | Masaar Holidays",
    alternates: buildAlternates(locale, "/cookie-preferences"),
    // Always noindex regardless of locale — not a buildPageMetadata()
    // call because that only defaults to noindex for /ar/*.
    robots: { index: false, follow: false },
  };
}

export default async function CookiePreferencesPage() {
  const cookiePolicy = await getLegalPage("cookie_policy");

  return (
    <section className="py-16">
      <Container className="max-w-2xl">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-masaar-black">
          Cookie Preferences
        </h1>

        {cookiePolicy?.content && <div className="mt-4">{renderLegalContent(cookiePolicy.content)}</div>}

        <h2 className="mt-8 text-lg font-semibold text-masaar-black">Your Preferences</h2>
        <div className="mt-3 space-y-4">
          {[
            { name: "Necessary", desc: "Required for the site to function. Always on.", locked: true },
            { name: "Analytics", desc: "Helps us understand how visitors use the site." },
            { name: "Marketing", desc: "Used to measure the effectiveness of campaigns." },
          ].map((cat) => (
            <label
              key={cat.name}
              className="flex items-start justify-between gap-4 rounded-lg border border-black/10 bg-white p-4"
            >
              <div>
                <p className="font-medium text-masaar-black">{cat.name}</p>
                <p className="text-sm text-masaar-black/60">{cat.desc}</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                disabled={cat.locked}
                className="mt-1 size-5 accent-[var(--color-pure-gold)]"
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          className="mt-6 rounded-md bg-masaar-black px-5 py-3 text-sm font-semibold text-white"
        >
          Save Preferences
        </button>
        <p className="mt-3 text-xs italic text-masaar-black/40">
          Wiring to an actual consent/analytics stack is pending — no analytics or marketing
          scripts are loaded yet.
        </p>
      </Container>
    </section>
  );
}
