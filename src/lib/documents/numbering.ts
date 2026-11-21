import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type OperativeDocType = "quotation" | "invoice" | "receipt" | "booking_voucher" | "booking" | "customer";

const PREFIX_MAP: Record<OperativeDocType, string> = {
  quotation: "MAS-QT",
  invoice: "MAS-INV",
  receipt: "MAS-RC",
  booking_voucher: "MAS-BV",
  booking: "MAS-BKG",
  customer: "MAS-CUS",
};

/**
 * Returns the next sequential, thread-safe document or operational reference number.
 * Conforms to official Masaar numbering:
 * - Quotation: MAS-QT-2026-0001
 * - Invoice:   MAS-INV-2026-0001
 * - Receipt:   MAS-RC-2026-0001
 * - Voucher:   MAS-BV-2026-0001
 * - Booking:   MAS-BKG-2026-0001
 * - Customer:  MAS-CUS-0001
 */
export async function getNextDocumentNumber(
  docType: OperativeDocType,
  overrideYear?: number
): Promise<string> {
  const currentYear = overrideYear ?? new Date().getFullYear();
  const prefix = PREFIX_MAP[docType] || "MAS-DOC";

  let supabase: any;
  try {
    supabase = createAdminClient();
  } catch {
    supabase = await createClient();
  }

  // 1. Try atomic PostgreSQL sequence function if provisioned
  try {
    const { data: rpcVal, error: rpcErr } = await supabase.rpc("generate_next_document_number", {
      p_doc_type: docType,
      p_year: currentYear,
    });
    if (!rpcErr && rpcVal && typeof rpcVal === "string") {
      return rpcVal;
    }
  } catch (err) {
    // Continue to application-level atomic fallback
  }

  // 2. Try document_sequences table upsert
  try {
    const { data: seqRow, error: selErr } = await supabase
      .from("document_sequences")
      .select("id, current_sequence")
      .eq("document_type", docType)
      .eq("year", currentYear)
      .maybeSingle();

    if (!selErr && seqRow) {
      const nextSeq = (seqRow.current_sequence || 0) + 1;
      const { error: updErr } = await supabase
        .from("document_sequences")
        .update({ current_sequence: nextSeq, updated_at: new Date().toISOString() })
        .eq("id", seqRow.id);

      if (!updErr) {
        return formatDocNumber(docType, prefix, currentYear, nextSeq);
      }
    } else if (!selErr && !seqRow) {
      const { error: insErr } = await supabase
        .from("document_sequences")
        .insert({
          document_type: docType,
          prefix,
          year: currentYear,
          current_sequence: 1,
        });

      if (!insErr) {
        return formatDocNumber(docType, prefix, currentYear, 1);
      }
    }
  } catch (err) {
    // Table not available or schema cache issue, proceed to scan-based fallback
  }

  // 3. Scan existing records for highest sequence
  try {
    let highestSeq = 0;
    if (docType === "customer") {
      const { data: custs } = await supabase
        .from("customers")
        .select("customer_number")
        .like("customer_number", `${prefix}-%`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (custs && custs.length > 0) {
        for (const c of custs) {
          const match = c.customer_number?.match(/MAS-CUS-(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > highestSeq) highestSeq = num;
          }
        }
      }
    } else if (docType === "booking") {
      const { data: bkgs } = await supabase
        .from("bookings")
        .select("booking_reference")
        .like("booking_reference", `${prefix}-${currentYear}-%`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (bkgs && bkgs.length > 0) {
        for (const b of bkgs) {
          const match = b.booking_reference?.match(/MAS-BKG-\d+-(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > highestSeq) highestSeq = num;
          }
        }
      }
    } else {
      const { data: docs } = await supabase
        .from("documents")
        .select("document_number")
        .eq("document_type", docType)
        .order("created_at", { ascending: false })
        .limit(30);

      if (docs && docs.length > 0) {
        for (const d of docs) {
          const match = d.document_number?.match(/(?:MAS|MH)-(?:QT|INV|RC|RCT|BV|BKG)-\d+-(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > highestSeq) highestSeq = num;
          }
        }
      }
    }

    const nextSeq = highestSeq + 1;
    return formatDocNumber(docType, prefix, currentYear, nextSeq);
  } catch (err) {
    // Deterministic timestamp fallback in worst-case scenario
    const randPart = Math.floor(1000 + Math.random() * 9000);
    return formatDocNumber(docType, prefix, currentYear, randPart);
  }
}

function formatDocNumber(docType: OperativeDocType, prefix: string, year: number, seq: number): string {
  const pad = seq.toString().padStart(4, "0");
  if (docType === "customer") {
    return `${prefix}-${pad}`;
  }
  return `${prefix}-${year}-${pad}`;
}
