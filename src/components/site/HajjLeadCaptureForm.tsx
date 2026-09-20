"use client";

import { useActionState } from "react";
import { submitHajjInterest, type SubmitHajjInterestState } from "@/app/(site)/hajj/actions";
import { PhoneNumberField } from "./PhoneNumberField";
import { WhatsAppButton } from "./WhatsAppButton";

const initialState: SubmitHajjInterestState = { status: "idle" };

export function HajjLeadCaptureForm() {
  const [state, formAction, isPending] = useActionState(submitHajjInterest, initialState);

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-pure-gold/30 bg-white p-6 shadow-sm sm:p-8">
      <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black sm:text-3xl">
        2027 Hajj Packages: Register Your Interest
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-masaar-black/70">
        Packages, accommodation, and availability are subject to official regulations and confirmed arrangements.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-masaar-black" htmlFor="hajj-name">
            Full Name *
          </label>
          <input
            id="hajj-name"
            name="name"
            required
            placeholder="Your full name"
            className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
          />
        </div>
        <PhoneNumberField name="contact" id="hajj-contact" />
        <div>
          <label className="mb-1 block text-sm font-medium text-masaar-black" htmlFor="hajj-email">
            Email Address
          </label>
          <input
            id="hajj-email"
            name="email"
            type="email"
            placeholder="Your email address (optional)"
            className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-masaar-black" htmlFor="hajj-tier">
            Preferred Package Tier *
          </label>
          <select
            id="hajj-tier"
            name="tier"
            required
            defaultValue=""
            className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Select a tier
            </option>
            <option value="Essential">Essential</option>
            <option value="Signature">Signature</option>
            <option value="Exclusive">Exclusive</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-pure-gold px-5 py-3 text-sm font-semibold text-masaar-black hover:bg-light-gold disabled:opacity-60"
        >
          {isPending ? "Sending…" : "Register Interest"}
        </button>

        {state.status !== "idle" && (
          <p
            className={`text-sm ${state.status === "success" ? "text-green-700" : "text-red-700"}`}
            role="status"
          >
            {state.message}
          </p>
        )}

        <WhatsAppButton
          templateKey="hajj"
          variant="outline"
          className="w-full !border-[#25D366] !text-[#128C7E] hover:!bg-[#25D366]/10"
        >
          Prefer WhatsApp? Register Interest There
        </WhatsAppButton>
      </form>
    </div>
  );
}
