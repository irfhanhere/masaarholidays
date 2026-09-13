export function Topbar() {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex h-16 items-center justify-between gap-4 border-b border-black/5 bg-white px-6">
      <input
        type="search"
        placeholder="Search anything…"
        className="w-full max-w-md rounded-md border border-black/10 bg-admin-surface px-4 py-2 text-sm"
      />
      <div className="flex items-center gap-4 text-sm text-masaar-black/70">
        <button type="button" aria-label="Notifications" className="relative">
          <BellIcon />
        </button>
        <span className="hidden sm:inline">{today}</span>
      </div>
    </div>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-5">
      <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  );
}
