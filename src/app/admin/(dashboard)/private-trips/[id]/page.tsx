import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAdminPrivateTripById, getAdminPrivateTripStops } from "@/lib/data/admin";
import { PrivateTripForm } from "../PrivateTripForm";

export const metadata: Metadata = {
  title: "Edit Private Trip | Masaar Admin",
  robots: { index: false },
};

export default async function EditPrivateTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trip = await getAdminPrivateTripById(id);

  if (!trip) {
    notFound();
  }

  const stops = await getAdminPrivateTripStops(id);

  return (
    <PrivateTripForm
      tripId={trip.id}
      initialTrip={trip}
      initialStops={stops}
    />
  );
}
