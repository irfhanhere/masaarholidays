"use client";

import { useActionState } from "react";
import { submitEnquiry, type SubmitEnquiryState } from "./actions";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp-templates";

const initialState: SubmitEnquiryState = { status: "idle" };

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitEnquiry, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full Name" name="name" required placeholder="Your full name" />
        <Field label="Phone / WhatsApp" name="phone" required placeholder="+971 5X XXX XXXX" />
      </div>
      <Field label="Email Address" name="email" type="email" placeholder="Your email address" />
      <div>
        <label className="mb-1 block text-sm font-medium text-masaar-black" htmlFor="enquiry_type">
          Your Enquiry
        </label>
        <select
          id="enquiry_type"
          name="enquiry_type"
          required
          className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
          defaultValue=""
        >
          <option value="" disabled>
            Select an option
          </option>
          <option value="Umrah">Umrah</option>
          <option value="Hajj">Hajj</option>
          <option value="Hotels">Hotels</option>
          <option value="Transfers">Transfers</option>
          <option value="Visa">Visa</option>
          <option value="General">General</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-masaar-black" htmlFor="message">
          Message / Trip Details (Optional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Tell us about your travel plans, dates, number of travellers or any specific requirements…"
          className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-pure-gold px-5 py-3 text-sm font-semibold text-masaar-black hover:bg-light-gold disabled:opacity-60"
      >
        {isPending ? "Sending…" : "Send Enquiry"}
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
        message={WHATSAPP_TEMPLATES.contact}
        variant="outline"
        className="w-full !border-[#25D366] !text-[#128C7E] hover:!bg-[#25D366]/10"
      >
        Prefer WhatsApp? Chat with us now
      </WhatsAppButton>

      <p className="text-center text-xs text-masaar-black/50">
        No payment is taken at this stage. This form is for enquiries only.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-masaar-black" htmlFor={name}>
        {label}
        {required && " *"}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
      />
    </div>
  );
}
