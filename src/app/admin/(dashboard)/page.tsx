import Link from "next/link";
import type { Metadata } from "next";
import { Badge, Card, StatCard } from "@/components/admin/ui";
import { getDashboardStats, getRecentEnquiries } from "@/lib/data/admin";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp-templates";

export const metadata: Metadata = { title: "Dashboard | Masaar Admin", robots: { index: false } };

const STATUS_TONE: Record<string, "green" | "blue" | "amber" | "gray"> = {
  new: "green",
  viewed: "blue",
  contacted: "amber",
  closed: "gray",
};

export default async function AdminDashboardPage() {
  const [stats, recentEnquiries] = await Promise.all([getDashboardStats(), getRecentEnquiries()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-masaar-black">Good day 👋</h1>
        <p className="text-sm text-masaar-black/60">Here&apos;s what&apos;s happening with your website.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Active Umrah Packages" value={stats.activeUmrahPackages} />
        <StatCard label="Active Hajj Packages" value={stats.activeHajjPackages} />
        <StatCard label="Hotels" value={stats.hotels} />
        <StatCard label="Transfer Routes" value={stats.transferRoutes} />
        <StatCard label="New Enquiries" value={stats.newEnquiries} />
        <Card className="flex flex-col justify-center">
          <p className="text-sm text-masaar-black/60">Currency rates last updated</p>
          <p className="font-semibold text-masaar-black">
            {stats.currencyLastUpdated
              ? new Date(stats.currencyLastUpdated).toLocaleString("en-GB")
              : "Not set up yet"}
          </p>
          <Link href="/admin/currency-pricing" className="mt-1 text-sm text-admin-primary underline">
            Manage rates →
          </Link>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-masaar-black">Recent Enquiries</h2>
              <p className="text-sm text-masaar-black/60">Latest enquiries from your website.</p>
            </div>
            <Link href="/admin/enquiries" className="text-sm font-medium text-admin-primary">
              View All →
            </Link>
          </div>
          {recentEnquiries.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-masaar-black/50">
                <tr>
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Enquiry</th>
                  <th className="pb-2">Received</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {recentEnquiries.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2 font-medium text-masaar-black">{e.name}</td>
                    <td className="py-2 text-masaar-black/70">{e.enquiry_type}</td>
                    <td className="py-2 text-masaar-black/70">
                      {new Date(e.received_at).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-2">
                      <Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="py-8 text-center text-sm text-masaar-black/50">No enquiries yet.</p>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold text-masaar-black">Quick Actions</h2>
          <div className="mt-4 space-y-2">
            <Link href="/admin/packages/new?type=umrah" className="block rounded-md bg-admin-surface px-4 py-2.5 text-sm font-medium text-masaar-black hover:bg-black/5">
              + Add Umrah Package
            </Link>
            <Link href="/admin/packages/new?type=hajj" className="block rounded-md bg-admin-surface px-4 py-2.5 text-sm font-medium text-masaar-black hover:bg-black/5">
              + Add Hajj Package
            </Link>
            <Link href="/admin/hotels/new" className="block rounded-md bg-admin-surface px-4 py-2.5 text-sm font-medium text-masaar-black hover:bg-black/5">
              + Add Hotel
            </Link>
            <Link href="/admin/transfers/new" className="block rounded-md bg-admin-surface px-4 py-2.5 text-sm font-medium text-masaar-black hover:bg-black/5">
              + Add Transfer
            </Link>
          </div>
          <div className="mt-6 rounded-md bg-[#25D366]/10 p-4">
            <p className="text-sm font-medium text-masaar-black">Need Help?</p>
            <p className="mt-1 text-xs text-masaar-black/60">For technical issues or support, reach out directly.</p>
            <div className="mt-3">
              <WhatsAppButton message={WHATSAPP_TEMPLATES.general} className="w-full">
                Chat on WhatsApp
              </WhatsAppButton>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
