import { Card, PageHeader } from "./ui";

/**
 * Shared shell for admin screens not yet built out in this pass. The
 * sidebar route exists (so the full admin IA from the approved screens is
 * navigable end-to-end) but the screen itself still needs its Supabase
 * wiring — named here so it's easy to pick up next.
 */
export function ComingSoon({
  title,
  description,
  inspirationFile,
}: {
  title: string;
  description: string;
  inspirationFile: string;
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <p className="text-sm text-masaar-black/60">
          This screen is scaffolded (route + sidebar entry) but not yet wired up in this pass.
        </p>
        <p className="mt-2 text-xs text-masaar-black/40">
          Reference design: <code className="rounded bg-admin-surface px-1.5 py-0.5">/inspirations/{inspirationFile}</code>
        </p>
      </Card>
    </div>
  );
}
