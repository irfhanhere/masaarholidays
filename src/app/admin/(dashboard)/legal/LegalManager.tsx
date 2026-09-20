"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { PrimaryButton, inputClass } from "@/components/admin/ui";
import type { LegalPageKey, LegalPageRow } from "@/lib/types/database";
import { updateLegalPage } from "./actions";

const PUBLIC_PATH: Record<LegalPageKey, string> = {
  privacy_policy: "/privacy-policy",
  terms_conditions: "/terms-conditions",
  cookie_policy: "/cookie-preferences",
  accessibility: "/accessibility",
};

export function LegalManager({ pages }: { pages: LegalPageRow[] }) {
  const [selectedKey, setSelectedKey] = useState<string>(pages[0]?.key ?? "privacy_policy");
  const selected = pages.find((p) => p.key === selectedKey) ?? pages[0];

  const [title, setTitle] = useState(selected?.title ?? "");
  const [content, setContent] = useState(selected?.content ?? "");
  const [isPending, startTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  function selectPage(page: LegalPageRow) {
    setSelectedKey(page.key);
    setTitle(page.title);
    setContent(page.content);
    setSavedMessage(null);
  }

  function handleSave() {
    if (!selected) return;
    startTransition(async () => {
      await updateLegalPage(selected.key as LegalPageKey, title, content);
      setSavedMessage("Saved.");
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-masaar-black/50">
          <Link href="/admin" className="hover:underline">Dashboard</Link>
          <span>&rsaquo;</span>
          <span className="font-semibold text-masaar-black">Legal &amp; Cookies</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold text-masaar-black">Legal &amp; Cookies</h1>
        <p className="text-xs text-masaar-black/60">
          Edit Privacy Policy, Terms &amp; Conditions, Cookie Policy and Accessibility copy shown on the public site.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Document list */}
        <div className="space-y-2 lg:col-span-1">
          {pages.map((page) => (
            <button
              key={page.key}
              type="button"
              onClick={() => selectPage(page)}
              className={`block w-full rounded-lg border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                page.key === selectedKey
                  ? "border-deep-gold bg-[#FAF5E8] text-deep-gold"
                  : "border-black/10 bg-white text-masaar-black hover:bg-warm-ivory"
              }`}
            >
              {page.title}
            </button>
          ))}
        </div>

        {/* Editor */}
        {selected && (
          <div className="space-y-4 rounded-xl border border-black/10 bg-white p-6 shadow-2xs lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-masaar-black">Page Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${inputClass} max-w-sm`} />
              </div>
              <Link
                href={PUBLIC_PATH[selected.key as LegalPageKey]}
                target="_blank"
                className="text-xs font-semibold text-admin-primary hover:underline"
              >
                View on Website →
              </Link>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-masaar-black">Content</label>
              <p className="mb-2 text-[11px] text-masaar-black/50">
                Start a line with <code className="rounded bg-black/5 px-1">## </code> for a subheading, and a group
                of lines starting with <code className="rounded bg-black/5 px-1">- </code> for a bullet list. Leave a
                blank line between paragraphs.
              </p>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={22}
                className={`${inputClass} font-mono text-xs leading-relaxed`}
              />
            </div>

            <p className="text-[11px] text-masaar-black/50">
              Last updated {new Date(selected.updated_at).toLocaleString()}
            </p>

            <div className="flex items-center gap-3">
              <PrimaryButton type="button" onClick={handleSave} disabled={isPending}>
                {isPending ? "Saving…" : "Save Changes"}
              </PrimaryButton>
              {savedMessage && <span className="text-sm font-medium text-green-700">{savedMessage}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
