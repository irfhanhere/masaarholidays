import Link from "next/link";
import type { Metadata } from "next";
import { Badge, Card, PageHeader, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { WHATSAPP_DEFAULT_PHONE } from "@/lib/whatsapp-templates";
import { updatePhoneNumber, updateTemplate } from "./actions";
import { TemplateTextarea } from "./TemplateTextarea";

export const metadata: Metadata = { title: "WhatsApp Templates | Masaar Admin", robots: { index: false } };

export default async function WhatsAppTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const requestedKey = (await searchParams).key;

  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader
          title="WhatsApp Templates"
          description="Edit the pre-filled WhatsApp messages used across the site without a developer."
          breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "WhatsApp Templates" }]}
        />
        <Card>
          <p className="text-sm text-masaar-black/60">
            Connect Supabase (.env.local) to manage WhatsApp templates — they&apos;re seeded by
            supabase/migrations/0014_seed_whatsapp_templates.sql.
          </p>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: templates }, { data: settings }] = await Promise.all([
    supabase.from("whatsapp_templates").select("*").order("display_order"),
    supabase.from("whatsapp_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  const allTemplates = templates ?? [];
  const activeTemplate =
    allTemplates.find((t) => t.key === requestedKey) ?? allTemplates[0] ?? null;
  const phoneNumber = settings?.phone_number ?? WHATSAPP_DEFAULT_PHONE;

  return (
    <div>
      <PageHeader
        title="WhatsApp Templates"
        description="Edit the pre-filled WhatsApp messages used across the site without a developer."
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "WhatsApp Templates" }]}
      />

      <Card className="mb-6">
        <h2 className="mb-1 font-semibold text-masaar-black">Destination Phone Number</h2>
        <p className="mb-4 text-sm text-masaar-black/60">
          The WhatsApp number every template message is sent to (wa.me deep link).
        </p>
        <form action={updatePhoneNumber} className="flex flex-wrap items-end gap-3">
          <div className="max-w-xs flex-1">
            <label className="mb-1 block text-sm font-medium text-masaar-black" htmlFor="phone_number">
              Number (with country code)
            </label>
            <input
              id="phone_number"
              name="phone_number"
              defaultValue={`+${phoneNumber}`}
              placeholder="+971 55 227 6299"
              className={inputClass}
            />
          </div>
          <PrimaryButton type="submit">Save Number</PrimaryButton>
        </form>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-semibold text-masaar-black">Templates</h2>
          <div className="space-y-1">
            {allTemplates.map((template) => (
              <Link
                key={template.id}
                href={`/admin/whatsapp-templates?key=${template.key}`}
                className={`block rounded-md border px-3 py-2.5 transition-colors ${
                  activeTemplate?.id === template.id
                    ? "border-admin-primary bg-admin-surface"
                    : "border-transparent hover:bg-admin-surface"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-masaar-black">{template.label}</p>
                  <Badge tone={template.is_active ? "green" : "gray"}>
                    {template.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-masaar-black/50">{template.template_text}</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-3">
          {activeTemplate ? (
            <>
              <h2 className="mb-1 font-semibold text-masaar-black">Edit Template</h2>
              <p className="mb-4 text-sm text-masaar-black/60">{activeTemplate.label}</p>

              <form
                key={activeTemplate.id}
                action={updateTemplate.bind(null, activeTemplate.id)}
                className="space-y-4"
              >
                <div>
                  <span className="mb-1 block text-sm font-medium text-masaar-black">Message</span>
                  <TemplateTextarea name="template_text" defaultValue={activeTemplate.template_text} />
                </div>

                {activeTemplate.placeholders.length > 0 && (
                  <div className="rounded-md bg-admin-surface p-3">
                    <p className="text-xs font-semibold text-masaar-black">Available Variables</p>
                    <p className="mt-1 text-xs text-masaar-black/60">
                      These are filled in automatically — keep the double braces exactly as shown.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {activeTemplate.placeholders.map((p) => (
                        <code
                          key={p}
                          className="rounded bg-white px-1.5 py-0.5 text-xs text-deep-gold"
                        >
                          {`{{${p}}}`}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={activeTemplate.is_active}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-masaar-black">
                    Active
                    <span className="block text-xs text-masaar-black/50">
                      Status label only — every template here is wired to a live button on the
                      site, so this does not hide it. Use it to flag templates that need review.
                    </span>
                  </span>
                </label>

                <div className="flex gap-2 border-t border-black/10 pt-4">
                  <PrimaryButton type="submit">Save Template</PrimaryButton>
                  <Link href="/admin/whatsapp-templates">
                    <SecondaryButton type="button">Cancel</SecondaryButton>
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <p className="text-sm text-masaar-black/50">No templates found.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
