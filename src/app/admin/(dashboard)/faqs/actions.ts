"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { FaqCategory } from "@/lib/types/database";

function revalidateFaqPaths() {
  revalidatePath("/admin/faqs");
  revalidatePath("/faq");
  revalidatePath("/umrah");
  revalidatePath("/hajj");
  revalidatePath("/hotels");
  revalidatePath("/transfers");
  revalidatePath("/visa");
}

export async function createFaq(data: {
  category: FaqCategory;
  question: string;
  answer: string;
  published?: boolean;
}) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = await createClient();

  // Find the highest display_order in that category
  const { data: existing } = await supabase
    .from("faqs")
    .select("display_order")
    .eq("category", data.category)
    .order("display_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? (existing[0].display_order ?? 0) + 1 : 1;

  const { error } = await supabase.from("faqs").insert({
    category: data.category,
    question: data.question.trim(),
    answer: data.answer.trim(),
    display_order: nextOrder,
    published: data.published ?? true,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateFaqPaths();
}

export async function updateFaq(
  id: string,
  data: {
    category: FaqCategory;
    question: string;
    answer: string;
    published?: boolean;
    display_order?: number;
  }
) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("faqs")
    .update({
      category: data.category,
      question: data.question.trim(),
      answer: data.answer.trim(),
      published: data.published,
      ...(data.display_order !== undefined ? { display_order: data.display_order } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateFaqPaths();
}

export async function toggleFaqPublish(id: string, published: boolean) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("faqs")
    .update({
      published,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateFaqPaths();
}

export async function deleteFaq(id: string) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("faqs").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateFaqPaths();
}

export async function reorderFaqs(orderedIds: string[]) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = await createClient();

  // Update display_order for each id in order
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("faqs")
      .update({ display_order: index + 1, updated_at: new Date().toISOString() })
      .eq("id", id)
  );

  await Promise.all(updates);
  revalidateFaqPaths();
}
