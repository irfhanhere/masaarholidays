import { notFound } from "next/navigation";
import { Badge, Card, PageHeader, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WhatsAppGlyph } from "@/components/site/WhatsAppButton";
import { buildWhatsAppLink } from "@/lib/contact";
import { setEnquiryStatus, saveEnquiryNotes, deleteEnquiry } from "../actions";

export const metadata = { title: "Enquiry Details | Masaar Admin", robots: { index: false } };

async function getClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return supabase;
  }

  if (process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_AUTH_BYPASS === "true") {
    return createAdminClient();
  }

  return supabase;
}

export default async function EnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getClient();
  const { data: enquiry } = await supabase.from("enquiries").select("*").eq("id", id).maybeSingle();
  if (!enquiry) notFound();

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={enquiry.name}
        description={`Enquiry received on ${new Date(enquiry.received_at).toLocaleString("en-GB")}`}
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Enquiries", href: "/admin/enquiries" }, { label: enquiry.name }]}
        actions={<Badge tone="green">{enquiry.status}</Badge>}
      />

      <Card className="mb-6">
        <h2 className="mb-3 font-semibold text-masaar-black">Contact Information</h2>
        <dl className="space-y-1 text-sm">
          <Row label="Phone" value={enquiry.phone ?? "—"} />
          <Row label="Email" value={enquiry.email ?? "—"} />
        </dl>
      </Card>

      <Card className="mb-6">
        <h2 className="mb-3 font-semibold text-masaar-black">Enquiry Details</h2>
        <dl className="space-y-1 text-sm">
          <Row label="Enquiry Type" value={enquiry.enquiry_type} />
          <Row label="Number of Travellers" value={enquiry.number_of_travellers ?? "—"} />
          <Row label="Travel Date" value={enquiry.travel_date ?? "—"} />
        </dl>
        {enquiry.message && (
          <p className="mt-3 rounded-md bg-admin-surface p-3 text-sm text-masaar-black/80">{enquiry.message}</p>
        )}
      </Card>

      <Card className="mb-6">
        <h2 className="mb-3 font-semibold text-masaar-black">Source Information</h2>
        <dl className="space-y-1 text-sm">
          <Row label="Page / Source" value={enquiry.page_source ?? "—"} />
          <Row label="Referring URL" value={enquiry.referring_url ?? "—"} />
        </dl>
      </Card>

      <Card className="mb-6">
        <div className="flex flex-wrap gap-2">
          {enquiry.phone && (
            // Personalized per-lead greeting — not one of the admin-managed
            // WhatsApp Templates keys, so it isn't DB-driven like WhatsAppButton.
            <a
              href={buildWhatsAppLink(
                `Assalamu Alaikum ${enquiry.name}, thank you for your enquiry with Masaar Holidays.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-pure-gold px-5 py-3 text-sm font-semibold text-masaar-black transition-colors hover:bg-light-gold"
            >
              <WhatsAppGlyph />
              WhatsApp
            </a>
          )}
          <form action={setEnquiryStatus.bind(null, enquiry.id, "contacted")}>
            <SecondaryButton type="submit">Mark Contacted</SecondaryButton>
          </form>
          <form action={setEnquiryStatus.bind(null, enquiry.id, "closed")}>
            <SecondaryButton type="submit">Close Enquiry</SecondaryButton>
          </form>
          <form action={deleteEnquiry.bind(null, enquiry.id)}>
            <button type="submit" className="text-sm text-red-600 underline">
              Delete
            </button>
          </form>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold text-masaar-black">Notes (Optional)</h2>
        <form action={saveEnquiryNotes.bind(null, enquiry.id)} className="space-y-3">
          <textarea
            name="internal_notes"
            defaultValue={enquiry.internal_notes ?? ""}
            rows={3}
            placeholder="Add internal notes about this enquiry…"
            className={inputClass}
          />
          <PrimaryButton type="submit">Save Note</PrimaryButton>
        </form>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-masaar-black/50">{label}</dt>
      <dd className="text-right font-medium text-masaar-black">{value}</dd>
    </div>
  );
}
