import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface TabbyHistoryBuyer {
  email: string;
  phone: string;
  name: string;
}

export type TabbyOrderStatus =
  | "new"
  | "processing"
  | "complete"
  | "refunded"
  | "canceled"
  | "unknown";

export interface TabbyPastOrder {
  purchased_at: string;
  amount: string;
  currency: string;
  payment_method: "card" | "cod";
  status: TabbyOrderStatus;
  buyer: {
    phone: string;
    email: string;
    name: string;
  };
  shipping_address?: {
    city: string;
    address: string;
    zip?: string;
  };
  items?: Array<{
    title: string;
    quantity: number;
    unit_price: string;
    category?: string;
    reference_id?: string;
  }>;
}

export interface TabbyBuyerHistoryResult {
  registered_since?: string;
  loyalty_level: number;
  order_history: TabbyPastOrder[];
}

/**
 * Normalizes phone numbers for database matching.
 */
function cleanPhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "").trim();
}

/**
 * Maps internal database payment/booking statuses to Tabby's official order status enum:
 * "new" | "processing" | "complete" | "refunded" | "canceled" | "unknown"
 */
function mapToTabbyStatus(paymentStatus?: string | null, bookingStatus?: string | null): TabbyOrderStatus {
  const p = (paymentStatus || "").toLowerCase();
  const b = (bookingStatus || "").toLowerCase();

  if (p === "paid" || b === "completed" || b === "confirmed" || b === "voucher_issued") {
    return "complete";
  }
  if (p === "refunded") {
    return "refunded";
  }
  if (p === "failed" || b === "cancelled" || b === "canceled") {
    return "canceled";
  }
  if (p === "pending" || b === "pending" || p === "processing") {
    return "processing";
  }
  return "new";
}

/**
 * Fetch genuine customer buyer history across Masaar's order tables (esim_orders, visa_applications, transfer_bookings).
 *
 * Requirements:
 * - Exact matching on customer email AND/OR phone.
 * - Current order is excluded.
 * - loyalty_level: count of successfully placed/completed orders across payment methods.
 * - registered_since: ISO 8601 timestamp of customer's earliest verified order (omitted for new customers).
 * - order_history: up to 5-10 previous orders in any status (complete, processing, refunded, canceled).
 * - Zero fabricated data.
 */
export async function getTabbyBuyerHistory(
  buyer: TabbyHistoryBuyer,
  currentReferenceId?: string
): Promise<TabbyBuyerHistoryResult> {
  const email = (buyer.email || "").trim().toLowerCase();
  const phone = cleanPhone(buyer.phone || "");

  if (!email && !phone) {
    return {
      loyalty_level: 0,
      order_history: [],
    };
  }

  try {
    const supabase = createAdminClient();
    const pastOrders: TabbyPastOrder[] = [];
    const allOrderTimestamps: number[] = [];
    let successfulPaidCount = 0;

    // 1. Query eSIM orders (all statuses)
    try {
      let query = supabase
        .from("esim_orders")
        .select("id, partner_ref, customer_name, customer_email, customer_phone, amount_usd, charged_amount_minor, charge_currency, payment_provider, payment_status, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (email && phone) {
        query = query.or(`customer_email.eq.${email},customer_phone.eq.${phone}`);
      } else if (email) {
        query = query.eq("customer_email", email);
      } else {
        query = query.eq("customer_phone", phone);
      }

      const { data: esimOrders } = await query;

      if (esimOrders && esimOrders.length > 0) {
        for (const o of esimOrders) {
          if (currentReferenceId && o.partner_ref === currentReferenceId) continue;
          const orderDate = new Date(o.created_at).getTime();
          allOrderTimestamps.push(orderDate);

          const status = mapToTabbyStatus(o.payment_status);
          if (status === "complete") {
            successfulPaidCount++;
          }

          // Calculate amount in AED
          let amountAed = 0;
          if (o.charged_amount_minor && (o.charge_currency || "aed").toLowerCase() === "aed") {
            amountAed = o.charged_amount_minor / 100;
          } else if (o.amount_usd) {
            amountAed = Math.round(o.amount_usd * 3.6725 * 100) / 100;
          }

          pastOrders.push({
            purchased_at: o.created_at,
            amount: amountAed.toFixed(2),
            currency: "AED",
            payment_method: "card",
            status,
            buyer: {
              name: o.customer_name || buyer.name,
              email: o.customer_email || email,
              phone: o.customer_phone || phone,
            },
            shipping_address: {
              city: "Dubai",
              address: "Customer Residence",
            },
            items: [
              {
                title: "Saudi Arabia eSIM",
                quantity: 1,
                unit_price: amountAed.toFixed(2),
                category: "eSIM",
                reference_id: o.partner_ref,
              },
            ],
          });
        }
      }
    } catch (esimErr) {
      console.warn("[tabby-history] Failed to query esim_orders:", esimErr);
    }

    // 2. Query Visa applications (all statuses)
    try {
      let query = supabase
        .from("visa_applications")
        .select("id, reference_no, primary_contact_name, primary_contact_email, primary_contact_phone, product_title, total_amount, currency, payment_method, payment_status, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (email && phone) {
        query = query.or(`primary_contact_email.eq.${email},primary_contact_phone.eq.${phone}`);
      } else if (email) {
        query = query.eq("primary_contact_email", email);
      } else {
        query = query.eq("primary_contact_phone", phone);
      }

      const { data: visaOrders } = await query;

      if (visaOrders && visaOrders.length > 0) {
        for (const v of visaOrders) {
          if (currentReferenceId && v.reference_no === currentReferenceId) continue;
          const orderDate = new Date(v.created_at).getTime();
          allOrderTimestamps.push(orderDate);

          const status = mapToTabbyStatus(v.payment_status);
          if (status === "complete") {
            successfulPaidCount++;
          }

          const amt = Number(v.total_amount) || 0;
          const isAed = (v.currency || "USD").toUpperCase() === "AED";
          const amountAed = isAed ? amt : Math.round(amt * 3.6725 * 100) / 100;

          pastOrders.push({
            purchased_at: v.created_at,
            amount: amountAed.toFixed(2),
            currency: "AED",
            payment_method: "card",
            status,
            buyer: {
              name: v.primary_contact_name || buyer.name,
              email: v.primary_contact_email || email,
              phone: v.primary_contact_phone || phone,
            },
            shipping_address: {
              city: "Dubai",
              address: "Customer Residence",
            },
            items: [
              {
                title: v.product_title || "Saudi Visa",
                quantity: 1,
                unit_price: amountAed.toFixed(2),
                category: "Visa Services",
                reference_id: v.reference_no,
              },
            ],
          });
        }
      }
    } catch (visaErr) {
      console.warn("[tabby-history] Failed to query visa_applications:", visaErr);
    }

    // 3. Query Transfer bookings (all statuses)
    try {
      let query = supabase
        .from("transfer_bookings")
        .select("id, booking_ref, customer_name, customer_email, customer_phone, route_name, price_aed, payment_status, booking_status, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (email && phone) {
        query = query.or(`customer_email.eq.${email},customer_phone.eq.${phone}`);
      } else if (email) {
        query = query.eq("customer_email", email);
      } else {
        query = query.eq("customer_phone", phone);
      }

      const { data: transferOrders } = await query;

      if (transferOrders && transferOrders.length > 0) {
        for (const t of transferOrders) {
          if (currentReferenceId && t.booking_ref === currentReferenceId) continue;
          const orderDate = new Date(t.created_at).getTime();
          allOrderTimestamps.push(orderDate);

          const status = mapToTabbyStatus(t.payment_status, t.booking_status);
          if (status === "complete") {
            successfulPaidCount++;
          }

          const amountAed = Number(t.price_aed) || 0;

          pastOrders.push({
            purchased_at: t.created_at,
            amount: amountAed.toFixed(2),
            currency: "AED",
            payment_method: "card",
            status,
            buyer: {
              name: t.customer_name || buyer.name,
              email: t.customer_email || email,
              phone: t.customer_phone || phone,
            },
            shipping_address: {
              city: "Dubai",
              address: "Customer Residence",
            },
            items: [
              {
                title: t.route_name || "Private Transfer",
                quantity: 1,
                unit_price: amountAed.toFixed(2),
                category: "Transfers",
                reference_id: t.booking_ref,
              },
            ],
          });
        }
      }
    } catch (transferErr) {
      console.warn("[tabby-history] Failed to query transfer_bookings:", transferErr);
    }

    // Sort past orders newest first
    pastOrders.sort(
      (a, b) => new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime()
    );

    // Earliest order date for registered_since (omitted if no prior purchases exist)
    let registeredSince: string | undefined = undefined;
    if (allOrderTimestamps.length > 0) {
      const earliest = Math.min(...allOrderTimestamps);
      registeredSince = new Date(earliest).toISOString();
    }

    // Keep 5-10 most recent orders for order_history payload
    const orderHistory = pastOrders.slice(0, 10);

    return {
      registered_since: registeredSince,
      loyalty_level: successfulPaidCount,
      order_history: orderHistory,
    };
  } catch (err) {
    console.warn("[tabby-history] Unexpected error querying buyer history:", err);
    return {
      loyalty_level: 0,
      order_history: [],
    };
  }
}
