import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader, PrimaryButton } from "@/components/admin/ui";
import { getAdminPrivateTrips } from "@/lib/data/admin";
import { PrivateTripsListClient } from "./PrivateTripsListClient";

export const metadata: Metadata = {
  title: "Private Trips | Masaar Admin",
  robots: { index: false },
};

export default async function AdminPrivateTripsPage() {
  const trips = await getAdminPrivateTrips();

  return (
    <div>
      <PageHeader
        title="Private Trips"
        description="Manage private sightseeing and add-on experiences available to Masaar travellers."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Private Trips" },
        ]}
        actions={
          <Link href="/admin/private-trips/new">
            <PrimaryButton className="bg-[#A87F12] hover:bg-[#C9A227]">
              + Add Private Trip
            </PrimaryButton>
          </Link>
        }
      />

      <PrivateTripsListClient trips={trips} />
    </div>
  );
}
