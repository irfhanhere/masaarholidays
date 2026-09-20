"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import type { BlogCategoryRow } from "@/lib/types/database";
import { deleteCategory, reorderCategories, saveCategory, type CategoryFormState } from "./actions";

const initialState: CategoryFormState = { status: "idle" };

function CategoryPanel({
  category,
  onClose,
}: {
  category: BlogCategoryRow | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(saveCategory.bind(null, category?.id ?? null), initialState);
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(category));

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-masaar-black/40" role="dialog" aria-modal="true">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-masaar-black">{category ? "Edit Category" : "Add Category"}</h2>
          <button type="button" onClick={onClose} className="text-masaar-black/50 hover:text-masaar-black">
            ✕
          </button>
        </div>

        {state.status === "error" && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{state.error}</div>
        )}

        <form action={formAction} className="space-y-4">
          <Field label="Name" required hint="This is the name that will be displayed on the website.">
            <input
              name="name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) {
                  setSlug(e.target.value.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-"));
                }
              }}
              className={inputClass}
            />
          </Field>

          <Field label="Slug" required hint="Used in the URL. Keep it short and lowercase (e.g. umrah-guides).">
            <input
              name="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              className={inputClass}
            />
          </Field>

          <Field label="Description" hint="This may be displayed on the category page.">
            <textarea name="description" rows={3} defaultValue={category?.description ?? ""} className={inputClass} />
          </Field>

          <Field label="SEO Title" hint="Leave empty to use the default title format.">
            <input name="seo_title" defaultValue={category?.seo_title ?? ""} className={inputClass} />
          </Field>

          <Field label="Meta Description" hint="Leave empty to use the default description.">
            <textarea name="meta_description" rows={2} defaultValue={category?.meta_description ?? ""} className={inputClass} />
          </Field>

          <Field label="Status" hint="Inactive categories will be hidden on the website.">
            <select name="status" defaultValue={category?.status ?? "active"} className={inputClass}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>

          <div className="flex gap-3 pt-2">
            <SecondaryButton type="button" onClick={onClose} className="flex-1 justify-center">
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={isPending} className="flex-1 justify-center">
              {isPending ? "Saving…" : "Save Category"}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CategoriesManager({
  categories: initialCategories,
  postCounts,
}: {
  categories: BlogCategoryRow[];
  postCounts: Record<string, number>;
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [panelFor, setPanelFor] = useState<BlogCategoryRow | null | undefined>(undefined);
  const [prevInitialCategories, setPrevInitialCategories] = useState(initialCategories);
  if (initialCategories !== prevInitialCategories) {
    setPrevInitialCategories(initialCategories);
    setCategories(initialCategories);
  }

  async function handleDelete(cat: BlogCategoryRow) {
    if (!confirm(`Delete "${cat.name}"? Posts in this category will become uncategorized.`)) return;
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    await deleteCategory(cat.id);
  }

  async function move(index: number, direction: -1 | 1) {
    const next = [...categories];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setCategories(next);
    await reorderCategories(next.map((c) => c.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-masaar-black/50">
            <Link href="/admin" className="hover:underline">Dashboard</Link>
            <span>&rsaquo;</span>
            <Link href="/admin/blog" className="hover:underline">Blog</Link>
            <span>&rsaquo;</span>
            <span className="font-semibold text-masaar-black">Categories</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-masaar-black">Blog Categories</h1>
          <p className="text-xs text-masaar-black/60">
            Manage your blog categories. Categories help organise your content and make it easier for visitors to find relevant articles.
          </p>
        </div>
        <PrimaryButton type="button" onClick={() => setPanelFor(null)}>
          + Add Category
        </PrimaryButton>
      </div>

      <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-admin-surface text-xs uppercase text-masaar-black/50">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Posts</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-masaar-black/50">
                  No categories yet. Click &quot;+ Add Category&quot; to create the first one.
                </td>
              </tr>
            )}
            {categories.map((cat, i) => (
              <tr key={cat.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex flex-col text-[10px] leading-none text-masaar-black/30">
                      <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="hover:text-masaar-black disabled:opacity-30">▲</button>
                      <button type="button" onClick={() => move(i, 1)} disabled={i === categories.length - 1} className="hover:text-masaar-black disabled:opacity-30">▼</button>
                    </span>
                    <div>
                      <p className="font-semibold text-masaar-black">{cat.name}</p>
                      <p className="text-xs text-masaar-black/50">/{cat.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-masaar-black/70">{postCounts[cat.id] ?? 0}</td>
                <td className="px-4 py-3">
                  <Badge tone={cat.status === "active" ? "green" : "gray"}>{cat.status === "active" ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <button type="button" onClick={() => setPanelFor(cat)} className="text-sm font-medium text-admin-primary">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(cat)} className="text-sm text-red-600 underline">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {panelFor !== undefined && <CategoryPanel category={panelFor} onClose={() => setPanelFor(undefined)} />}
    </div>
  );
}
