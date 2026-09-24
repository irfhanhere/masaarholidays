"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { HotelReview } from "@/lib/data/hotel-reviews";
import { INITIAL_HOTEL_REVIEWS } from "@/lib/data/hotel-reviews";
import fs from "fs";
import path from "path";

const CUSTOM_REVIEWS_FILE = path.join(process.cwd(), "src/lib/data/custom-hotel-reviews.json");

function getCustomReviews(): HotelReview[] {
  try {
    if (fs.existsSync(CUSTOM_REVIEWS_FILE)) {
      const data = fs.readFileSync(CUSTOM_REVIEWS_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch {
    // ignore
  }
  return [];
}

function saveCustomReviews(reviews: HotelReview[]) {
  try {
    fs.writeFileSync(CUSTOM_REVIEWS_FILE, JSON.stringify(reviews, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write custom reviews file:", err);
  }
}

export async function fetchHotelReviewsForAdmin(hotelSlug: string, hotelId?: string): Promise<HotelReview[]> {
  const normSlug = hotelSlug.toLowerCase().trim();

  // 1. Try Supabase
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      let query = supabase.from("hotel_reviews").select("*");
      if (hotelId) {
        query = query.or(`hotel_slug.eq.${normSlug},hotel_id.eq.${hotelId}`);
      } else {
        query = query.eq("hotel_slug", normSlug);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data as HotelReview[];
      }
    } catch {
      // fallback
    }
  }

  // 2. Check local custom file + initial
  const custom = getCustomReviews().filter((r) => r.hotel_slug === normSlug);
  const initial = INITIAL_HOTEL_REVIEWS.filter(
    (r) => r.hotel_slug === normSlug || normSlug.includes(r.hotel_slug) || r.hotel_slug.includes(normSlug)
  );

  return [...custom, ...initial];
}

export async function createHotelReviewAction(formData: FormData) {
  const hotel_id = formData.get("hotel_id") as string;
  const hotel_slug = (formData.get("hotel_slug") as string)?.toLowerCase().trim();
  const hotel_name = formData.get("hotel_name") as string;
  const author_name = formData.get("author_name") as string;
  const travel_party = (formData.get("travel_party") as HotelReview["travel_party"]) || "General";
  const rating = parseInt((formData.get("rating") as string) || "5", 10);
  const stay_month_year = (formData.get("stay_month_year") as string) || "Recent Stay";
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const highlight_quote = (formData.get("highlight_quote") as string) || "";
  const helpful_tag = (formData.get("helpful_tag") as string) || "";

  if (!hotel_slug || !author_name || !title || !content) {
    return { error: "Please fill in all required fields." };
  }

  const newReview: HotelReview = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    hotel_id: hotel_id || null,
    hotel_slug,
    hotel_name: hotel_name || undefined,
    author_name,
    travel_party,
    rating,
    stay_month_year,
    read_time: "1 min read",
    title,
    content,
    highlight_quote: highlight_quote || undefined,
    helpful_tag: helpful_tag || undefined,
    is_verified: true,
    created_at: new Date().toISOString(),
  };

  // 1. Try Supabase
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.from("hotel_reviews").insert({
        hotel_id: hotel_id || null,
        hotel_slug,
        author_name,
        travel_party,
        rating,
        stay_month_year,
        read_time: "1 min read",
        title,
        content,
        highlight_quote: highlight_quote || null,
        helpful_tag: helpful_tag || null,
        is_verified: true,
      });
      if (!error) {
        revalidatePath(`/admin/hotels/${hotel_id}`);
        revalidatePath("/umrah/[slug]", "page");
        return { success: true };
      }
    } catch {
      // fallback to file
    }
  }

  // 2. Save to custom file
  const custom = getCustomReviews();
  custom.unshift(newReview);
  saveCustomReviews(custom);

  revalidatePath(`/admin/hotels/${hotel_id}`);
  revalidatePath("/umrah/[slug]", "page");
  return { success: true };
}

export async function deleteHotelReviewAction(id: string, hotel_id: string) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.from("hotel_reviews").delete().eq("id", id);
    } catch {
      // ignore
    }
  }

  // Also remove from custom file
  const custom = getCustomReviews().filter((r) => r.id !== id);
  saveCustomReviews(custom);

  revalidatePath(`/admin/hotels/${hotel_id}`);
  revalidatePath("/umrah/[slug]", "page");
  return { success: true };
}
