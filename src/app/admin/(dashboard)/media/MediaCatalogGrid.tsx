"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import type { MediaCatalogEntry } from "./data";
import { deleteMediaFile, saveMediaMeta, uploadMediaFile, type UploadMediaState } from "./actions";

function formatSize(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function EditModal({ entry, onClose }: { entry: MediaCatalogEntry; onClose: () => void }) {
  const router = useRouter();
  const [altText, setAltText] = useState(entry.altText ?? "");
  const [caption, setCaption] = useState(entry.caption ?? "");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.set("url", entry.url);
      fd.set("alt_text", altText);
      fd.set("caption", caption);
      await saveMediaMeta(fd);
      router.refresh();
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-masaar-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-masaar-black">Edit Image Details</h3>
          <button type="button" onClick={onClose} className="text-masaar-black/50 hover:text-masaar-black">✕</button>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={entry.url} alt="" className="mb-4 h-40 w-full rounded-lg object-cover bg-warm-ivory" />

        <p className="mb-4 truncate text-xs text-masaar-black/50">{entry.fileName}</p>

        {entry.usedIn.length > 0 && (
          <div className="mb-4">
            <p className="mb-1.5 text-xs font-semibold text-masaar-black/60">Used in</p>
            <div className="flex flex-wrap gap-1.5">
              {entry.usedIn.map((u, i) => (
                <span key={i} className="rounded bg-admin-surface px-2 py-1 text-[11px] text-masaar-black/70">{u}</span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <Field label="Alt Text" hint="Describes the image for accessibility and SEO — shown to screen readers, never invented for you.">
            <input value={altText} onChange={(e) => setAltText(e.target.value)} className={inputClass} placeholder="e.g. Kaaba in Makkah at sunset" />
          </Field>
          <Field label="Caption" hint="Optional — shown alongside the image where captions are supported.">
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={2} className={inputClass} />
          </Field>
        </div>

        <div className="mt-6 flex gap-3">
          <SecondaryButton type="button" onClick={onClose} className="flex-1 justify-center">Cancel</SecondaryButton>
          <PrimaryButton type="button" onClick={handleSave} disabled={isSaving} className="flex-1 justify-center">
            {isSaving ? "Saving…" : "Save"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

const uploadInitialState: UploadMediaState = { status: "idle" };

export function MediaCatalogGrid({ entries }: { entries: MediaCatalogEntry[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<MediaCatalogEntry | null>(null);
  const [filter, setFilter] = useState<"all" | "missing-alt" | "unused">("all");
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const filtered = entries.filter((e) => {
    if (filter === "missing-alt" && e.altText) return false;
    if (filter === "unused" && e.usedIn.length > 0) return false;
    if (search.trim() && !e.fileName.toLowerCase().includes(search.trim().toLowerCase()) && !e.usedIn.some((u) => u.toLowerCase().includes(search.trim().toLowerCase()))) {
      return false;
    }
    return true;
  });

  const missingAltCount = entries.filter((e) => !e.altText).length;

  async function handleUpload(formData: FormData) {
    setIsUploading(true);
    try {
      const state = await uploadMediaFile(uploadInitialState, formData);
      if (state.status === "success") {
        formRef.current?.reset();
        router.refresh();
      }
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(entry: MediaCatalogEntry) {
    if (!entry.isUploadedFile || !entry.storagePath) return;
    if (entry.usedIn.length > 0) {
      alert("This image is still referenced by content on the site — remove it from those places first.");
      return;
    }
    if (!confirm(`Delete "${entry.fileName}"? This cannot be undone.`)) return;
    await deleteMediaFile(entry.storagePath);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-masaar-black">Media Library</h1>
          <p className="text-xs text-masaar-black/60">
            Every image currently used across the site — {entries.length} total, {missingAltCount} missing alt text.
          </p>
        </div>
        <form
          ref={formRef}
          action={(fd) => handleUpload(fd)}
          className="flex items-center gap-2"
        >
          <input
            type="file"
            name="file"
            accept="image/*"
            required
            className="text-xs file:mr-3 file:rounded-md file:border-0 file:bg-admin-primary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-admin-primary-dark"
          />
          <PrimaryButton type="submit" disabled={isUploading}>
            {isUploading ? "Uploading…" : "Upload"}
          </PrimaryButton>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by filename or usage…"
          className="min-w-48 flex-1 rounded-md border border-black/15 px-3 py-2 text-sm"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="rounded-md border border-black/15 px-3 py-2 text-sm">
          <option value="all">All images</option>
          <option value="missing-alt">Missing alt text</option>
          <option value="unused">Not currently used</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-black/10 bg-white p-10 text-center text-sm text-masaar-black/50">
          No images match this filter.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((entry) => (
            <div key={entry.url} className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xs">
              <div className="relative h-32 w-full bg-warm-ivory">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.url} alt="" className="h-full w-full object-cover" />
                {!entry.altText && (
                  <span className="absolute right-2 top-2 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">No alt</span>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-xs font-semibold text-masaar-black" title={entry.fileName}>{entry.fileName}</p>
                <p className="mt-0.5 text-[10px] text-masaar-black/50">{formatSize(entry.size)}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {entry.usedIn.length > 0 ? (
                    <Badge tone="blue">{entry.usedIn.length === 1 ? entry.usedIn[0] : `${entry.usedIn.length} places`}</Badge>
                  ) : (
                    <Badge tone="gray">Not in use</Badge>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button type="button" onClick={() => setEditing(entry)} className="flex-1 rounded-md border border-black/15 py-1.5 text-xs font-semibold text-masaar-black hover:bg-warm-ivory">
                    Edit
                  </button>
                  {entry.isUploadedFile && entry.usedIn.length === 0 && (
                    <button type="button" onClick={() => handleDelete(entry)} className="rounded-md border border-red-200 px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <EditModal entry={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
