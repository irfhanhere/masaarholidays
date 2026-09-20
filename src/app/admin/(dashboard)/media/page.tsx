import type { Metadata } from "next";
import { getMediaCatalog } from "./data";
import { MediaCatalogGrid } from "./MediaCatalogGrid";

export const metadata: Metadata = { title: "Media Library | Masaar Admin", robots: { index: false } };

export default async function MediaLibraryPage() {
  const entries = await getMediaCatalog();
  return <MediaCatalogGrid entries={entries} />;
}
