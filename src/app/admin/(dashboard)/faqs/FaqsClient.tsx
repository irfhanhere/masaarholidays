"use client";

import { useMemo, useState, useTransition } from "react";
import type { FaqCategory, FaqRow } from "@/lib/types/database";
import {
  createFaq,
  deleteFaq,
  reorderFaqs,
  toggleFaqPublish,
  updateFaq,
} from "./actions";

const CATEGORY_META: Record<
  FaqCategory,
  { label: string; bg: string; text: string; border: string }
> = {
  umrah: { label: "Umrah", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  hajj: { label: "Hajj", bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
  hotels: { label: "Hotels", bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
  visa: { label: "Visa", bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },
  transfers: { label: "Transfers", bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200" },
  general: { label: "General", bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-200" },
};

const ALL_CATEGORIES: FaqCategory[] = ["umrah", "hajj", "hotels", "visa", "transfers", "general"];

export function FaqsClient({ initialFaqs }: { initialFaqs: FaqRow[] }) {
  const [faqs, setFaqs] = useState<FaqRow[]>(initialFaqs);
  const [activeCategory, setActiveCategory] = useState<"all" | FaqCategory>("all");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"order" | "newest" | "alpha">("order");

  // Modal / Editor states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqRow | null>(null);

  // Form states
  const [formCategory, setFormCategory] = useState<FaqCategory>("umrah");
  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [formPublished, setFormPublished] = useState(true);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<FaqRow | null>(null);

  const [isPending, startTransition] = useTransition();

  // Filtered and sorted FAQs
  const filteredFaqs = useMemo(() => {
    let list = faqs.filter((faq) => {
      if (activeCategory !== "all" && faq.category !== activeCategory) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          faq.question.toLowerCase().includes(q) ||
          faq.answer.toLowerCase().includes(q)
        );
      }
      return true;
    });

    if (sortOrder === "newest") {
      list = [...list].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortOrder === "alpha") {
      list = [...list].sort((a, b) => a.question.localeCompare(b.question));
    } else {
      list = [...list].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }

    return list;
  }, [faqs, activeCategory, search, sortOrder]);

  const openCreateModal = () => {
    setEditingFaq(null);
    setFormCategory(activeCategory !== "all" ? activeCategory : "umrah");
    setFormQuestion("");
    setFormAnswer("");
    setFormPublished(true);
    setIsModalOpen(true);
  };

  const openEditModal = (faq: FaqRow) => {
    setEditingFaq(faq);
    setFormCategory(faq.category);
    setFormQuestion(faq.question);
    setFormAnswer(faq.answer);
    setFormPublished(faq.published);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formQuestion.trim() || !formAnswer.trim()) {
      alert("Please provide both a question and an answer.");
      return;
    }

    startTransition(async () => {
      try {
        if (editingFaq) {
          await updateFaq(editingFaq.id, {
            category: formCategory,
            question: formQuestion,
            answer: formAnswer,
            published: formPublished,
          });
          setFaqs((prev) =>
            prev.map((f) =>
              f.id === editingFaq.id
                ? {
                    ...f,
                    category: formCategory,
                    question: formQuestion,
                    answer: formAnswer,
                    published: formPublished,
                    updated_at: new Date().toISOString(),
                  }
                : f
            )
          );
        } else {
          await createFaq({
            category: formCategory,
            question: formQuestion,
            answer: formAnswer,
            published: formPublished,
          });
          // Add optimistically
          const newFaq: FaqRow = {
            id: `temp-${Date.now()}`,
            category: formCategory,
            question: formQuestion,
            answer: formAnswer,
            published: formPublished,
            display_order: faqs.length + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setFaqs((prev) => [...prev, newFaq]);
        }
        setIsModalOpen(false);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to save FAQ");
      }
    });
  };

  const handleTogglePublish = (faq: FaqRow) => {
    const nextPublished = !faq.published;
    setFaqs((prev) =>
      prev.map((f) => (f.id === faq.id ? { ...f, published: nextPublished } : f))
    );

    startTransition(async () => {
      try {
        await toggleFaqPublish(faq.id, nextPublished);
      } catch (err: unknown) {
        // revert on failure
        setFaqs((prev) =>
          prev.map((f) => (f.id === faq.id ? { ...f, published: faq.published } : f))
        );
        alert(err instanceof Error ? err.message : "Failed to update publish state");
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;

    startTransition(async () => {
      try {
        await deleteFaq(deleteTarget.id);
        setFaqs((prev) => prev.filter((f) => f.id !== deleteTarget.id));
        setDeleteTarget(null);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to delete FAQ");
      }
    });
  };

  const moveFaq = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredFaqs.length) return;

    const reordered = [...filteredFaqs];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    // Update state display_orders
    const updatedIds = reordered.map((f) => f.id);
    setFaqs((prev) => {
      const map = new Map(reordered.map((f, i) => [f.id, i + 1]));
      return prev.map((f) => (map.has(f.id) ? { ...f, display_order: map.get(f.id)! } : f));
    });

    startTransition(async () => {
      try {
        await reorderFaqs(updatedIds);
      } catch (err: unknown) {
        console.warn("Reorder sync notice:", err);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header matching ADMIN-FAQ.png */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-masaar-black">Manage FAQs</h1>
          <p className="mt-1 text-sm text-masaar-black/60">
            Add, edit and organise frequently asked questions for your website.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-pure-gold px-5 py-2.5 text-sm font-semibold text-masaar-black transition-colors hover:bg-light-gold shadow-xs"
        >
          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add New FAQ
        </button>
      </div>

      {/* Filter Tabs & Search Row matching ADMIN-FAQ.png */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeCategory === "all"
                ? "bg-pure-gold text-masaar-black shadow-xs"
                : "border border-black/10 bg-white text-masaar-black/70 hover:bg-admin-surface"
            }`}
          >
            All ({faqs.length})
          </button>
          {ALL_CATEGORIES.map((cat) => {
            const count = faqs.filter((f) => f.category === cat).length;
            const meta = CATEGORY_META[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  activeCategory === cat
                    ? "bg-pure-gold text-masaar-black shadow-xs"
                    : "border border-black/10 bg-white text-masaar-black/70 hover:bg-admin-surface"
                }`}
              >
                {meta.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[200px] flex-1 sm:min-w-[260px]">
            <svg
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-masaar-black/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search FAQs..."
              className="w-full rounded-lg border border-black/15 bg-white py-1.5 pl-9 pr-4 text-xs text-masaar-black focus:border-admin-primary focus:outline-none"
            />
          </div>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "order" | "newest" | "alpha")}
            className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs text-masaar-black focus:border-admin-primary focus:outline-none"
          >
            <option value="order">Sort by Order</option>
            <option value="newest">Newest First</option>
            <option value="alpha">A – Z</option>
          </select>
        </div>
      </div>

      {/* Table matching ADMIN-FAQ.png */}
      <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 bg-admin-surface text-[11px] font-semibold uppercase tracking-wider text-masaar-black/50">
              <tr>
                <th className="w-12 px-4 py-3 text-center">#</th>
                <th className="w-28 px-4 py-3">Category</th>
                <th className="px-4 py-3">Question</th>
                <th className="w-36 px-4 py-3 text-center">Status</th>
                <th className="w-24 px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredFaqs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-masaar-black/50">
                    No FAQs found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredFaqs.map((faq, index) => {
                  const meta = CATEGORY_META[faq.category];
                  return (
                    <tr key={faq.id} className="transition-colors hover:bg-black/[0.01]">
                      {/* Drag / Reorder Controls */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-masaar-black/30">
                          <button
                            type="button"
                            disabled={index === 0 || sortOrder !== "order"}
                            onClick={() => moveFaq(index, "up")}
                            title="Move Up"
                            className="rounded p-0.5 hover:bg-black/5 hover:text-masaar-black disabled:opacity-20"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={index === filteredFaqs.length - 1 || sortOrder !== "order"}
                            onClick={() => moveFaq(index, "down")}
                            title="Move Down"
                            className="rounded p-0.5 hover:bg-black/5 hover:text-masaar-black disabled:opacity-20"
                          >
                            ▼
                          </button>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-md border px-2.5 py-0.5 text-xs font-semibold ${meta.bg} ${meta.text} ${meta.border}`}
                        >
                          {meta.label}
                        </span>
                      </td>

                      {/* Question & Preview */}
                      <td className="px-4 py-4">
                        <p className="font-medium text-masaar-black">{faq.question}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-masaar-black/55">{faq.answer}</p>
                      </td>

                      {/* Status Toggle Switch matching ADMIN-FAQ.png */}
                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(faq)}
                          disabled={isPending}
                          className="group inline-flex items-center gap-2"
                        >
                          <span
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              faq.published ? "bg-pure-gold" : "bg-black/20"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                faq.published ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </span>
                          <span className="text-xs font-medium text-masaar-black/70">
                            {faq.published ? "Published" : "Draft"}
                          </span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(faq)}
                            title="Edit FAQ"
                            className="rounded-lg p-1.5 text-masaar-black/60 transition-colors hover:bg-black/5 hover:text-admin-primary"
                          >
                            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(faq)}
                            title="Delete FAQ"
                            className="rounded-lg p-1.5 text-masaar-black/60 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal Dialog matching ADMIN-FAQ.png */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-black/10 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <h2 className="text-lg font-bold text-masaar-black">
                {editingFaq ? "Edit FAQ" : "Add New FAQ"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-masaar-black/50 hover:bg-black/5 hover:text-masaar-black"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-masaar-black">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as FaqCategory)}
                    className="mt-1.5 w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-masaar-black focus:border-admin-primary focus:outline-none"
                  >
                    {ALL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_META[cat].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-masaar-black">Status</label>
                  <div className="mt-2.5 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFormPublished(!formPublished)}
                      className="group inline-flex items-center gap-2"
                    >
                      <span
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          formPublished ? "bg-pure-gold" : "bg-black/20"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            formPublished ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </span>
                      <span className="text-xs font-medium text-masaar-black">
                        {formPublished ? "Published (Visible on site)" : "Draft (Hidden)"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-masaar-black">Question</label>
                <input
                  type="text"
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="e.g. Can I customize an Umrah package for my family's needs?"
                  className="mt-1.5 w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm text-masaar-black focus:border-admin-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-masaar-black">Answer</label>
                <textarea
                  rows={5}
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  placeholder="Provide a clear, helpful, and faith-led answer..."
                  className="mt-1.5 w-full rounded-lg border border-black/15 p-3.5 text-sm leading-relaxed text-masaar-black focus:border-admin-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-black/10 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium text-masaar-black hover:bg-admin-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="rounded-lg bg-pure-gold px-5 py-2 text-sm font-semibold text-masaar-black hover:bg-light-gold disabled:opacity-50 shadow-xs"
              >
                {isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-bold text-masaar-black">Delete FAQ</h3>
            <p className="mt-2 text-sm text-masaar-black/70">
              Are you sure you want to delete this FAQ? This action is permanent and cannot be undone.
            </p>
            <div className="mt-3 rounded-lg bg-warm-ivory p-3 text-xs font-medium text-masaar-black">
              &ldquo;{deleteTarget.question}&rdquo;
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium text-masaar-black hover:bg-admin-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete FAQ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
