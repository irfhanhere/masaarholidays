import { ComingSoon } from "@/components/admin/ComingSoon";

export const metadata = { title: "Media Library | Masaar Admin", robots: { index: false } };

export default function MediaLibraryPage() {
  return (
    <ComingSoon
      title="Media Library"
      description="Central image library backed by Supabase Storage — every content form currently takes a plain image URL as a placeholder for this."
      inspirationFile="ADMIN-MEDIA.png"
    />
  );
}
