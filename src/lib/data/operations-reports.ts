import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface OperationsReportData {
  salesSummary: {
    totalQuotations: number;
    acceptedQuotations: number;
    confirmedBookings: number;
    totalInvoicedAed: number;
    totalCollectedAed: number;
    outstandingBalanceAed: number;
    quotationConversionRate: number;
  };
  packagePerformance: Array<{
    packageName: string;
    packageSlug?: string;
    bookingsCount: number;
    revenueAed: number;
    averageSellingPriceAed: number;
  }>;
  financialPerformance: {
    totalRevenueAed: number;
    estimatedSupplierCostsAed: number;
    actualSupplierCostsAed: number;
    grossProfitAed: number;
    grossMarginPct: number;
    hasIncompleteCosts: boolean;
  };
  outstandingPayments: Array<{
    invoiceId: string;
    invoiceNumber: string;
    customerName: string;
    customerPhone?: string;
    bookingReference?: string;
    totalAmountAed: number;
    paidAmountAed: number;
    outstandingAmountAed: number;
    dueDate: string | null;
    daysOverdue: number;
  }>;
}

async function getDb() {
  try {
    return createAdminClient();
  } catch {
    return createClient();
  }
}

export async function getOperationsReport(dateRange?: { from?: string; to?: string }): Promise<OperationsReportData> {
  const supabase = await getDb();

  // Fetch all documents (quotations, invoices, receipts, vouchers)
  const { data: allDocs } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  const docs = allDocs ?? [];

  // Filter by date range if provided
  const filteredDocs = docs.filter((d) => {
    if (!d.created_at) return true;
    const dt = d.created_at.split("T")[0];
    if (dateRange?.from && dt < dateRange.from) return false;
    if (dateRange?.to && dt > dateRange.to) return false;
    return true;
  });

  // Quotation metrics
  const quotes = filteredDocs.filter((d) => d.document_type === "quotation");
  const acceptedQuotes = quotes.filter((q) => q.status === "accepted" || q.status === "converted" || q.status === "confirmed");

  // Invoices & Receipts
  const invoices = filteredDocs.filter((d) => d.document_type === "invoice" && d.status !== "cancelled");
  const receipts = filteredDocs.filter((d) => d.document_type === "receipt" && d.status !== "cancelled");

  const totalInvoicedAed = invoices.reduce((sum, inv) => sum + (Number(inv.total_aed) || 0), 0);
  const totalCollectedAed = receipts.reduce((sum, rc) => sum + (Number(rc.amount_paid_aed || rc.total_aed) || 0), 0);
  const outstandingBalanceAed = Math.max(0, totalInvoicedAed - totalCollectedAed);

  // Fetch bookings
  let bookings: any[] = [];
  try {
    const { data: bkgs } = await supabase.from("bookings").select("*");
    if (bkgs) bookings = bkgs;
  } catch {}

  // If bookings table is empty, derive from vouchers / accepted quotes
  if (bookings.length === 0) {
    bookings = filteredDocs.filter((d) => d.document_type === "booking_voucher" || d.status === "accepted");
  }

  const confirmedBookingsCount = bookings.length;
  const convRate = quotes.length > 0 ? Math.round((acceptedQuotes.length / quotes.length) * 100) : 0;

  // Package Performance
  const pkgMap = new Map<string, { count: number; revenue: number }>();
  // Pre-seed known packages
  pkgMap.set("Masaar Best Selling Umrah Package", { count: 0, revenue: 0 });
  pkgMap.set("Masaar Premium Umrah Package", { count: 0, revenue: 0 });
  pkgMap.set("Essential Umrah Package", { count: 0, revenue: 0 });
  pkgMap.set("Signature Umrah Package", { count: 0, revenue: 0 });
  pkgMap.set("Exclusive Umrah Package", { count: 0, revenue: 0 });

  for (const b of bookings) {
    const name = b.package_name || b.destination || "Masaar Best Selling Umrah Package";
    const amt = Number(b.total_amount || b.total_aed) || 0;
    const entry = pkgMap.get(name) || { count: 0, revenue: 0 };
    entry.count += 1;
    entry.revenue += amt;
    pkgMap.set(name, entry);
  }

  const packagePerformance = Array.from(pkgMap.entries())
    .map(([packageName, val]) => ({
      packageName,
      bookingsCount: val.count,
      revenueAed: val.revenue,
      averageSellingPriceAed: val.count > 0 ? Math.round(val.revenue / val.count) : 0,
    }))
    .sort((a, b) => b.revenueAed - a.revenueAed);

  // Financial performance (Costs & Profitability)
  let estCosts = 0;
  let actCosts = 0;
  let hasIncompleteCosts = false;

  try {
    const { data: costs } = await supabase.from("booking_supplier_costs").select("*");
    if (costs && costs.length > 0) {
      estCosts = costs.reduce((s: number, c: any) => s + (Number(c.estimated_cost) || 0), 0);
      actCosts = costs.reduce((s: number, c: any) => s + (Number(c.actual_cost) || 0), 0);
    } else {
      // Default estimated cost basis (approx 68% of travel package revenue is standard supplier cost)
      estCosts = Math.round(totalInvoicedAed * 0.68);
      actCosts = estCosts;
      hasIncompleteCosts = true;
    }
  } catch {
    estCosts = Math.round(totalInvoicedAed * 0.68);
    actCosts = estCosts;
    hasIncompleteCosts = true;
  }

  const grossProfitAed = Math.max(0, totalInvoicedAed - actCosts);
  const grossMarginPct = totalInvoicedAed > 0 ? Math.round((grossProfitAed / totalInvoicedAed) * 100) : 0;

  // Outstanding payments
  const now = new Date();
  const outstandingPayments = invoices
    .filter((inv) => (Number(inv.total_aed) || 0) > (Number(inv.amount_paid_aed) || 0))
    .map((inv) => {
      const tot = Number(inv.total_aed) || 0;
      const pd = Number(inv.amount_paid_aed) || 0;
      const due = inv.due_date || inv.valid_until || null;
      let daysOverdue = 0;
      if (due) {
        const dueDateObj = new Date(due);
        if (now > dueDateObj) {
          daysOverdue = Math.floor((now.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24));
        }
      }
      return {
        invoiceId: inv.id,
        invoiceNumber: inv.document_number,
        customerName: inv.client_name,
        customerPhone: inv.client_phone || undefined,
        bookingReference: inv.booking_reference || undefined,
        totalAmountAed: tot,
        paidAmountAed: pd,
        outstandingAmountAed: tot - pd,
        dueDate: due,
        daysOverdue,
      };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  return {
    salesSummary: {
      totalQuotations: quotes.length,
      acceptedQuotations: acceptedQuotes.length,
      confirmedBookings: confirmedBookingsCount,
      totalInvoicedAed,
      totalCollectedAed,
      outstandingBalanceAed,
      quotationConversionRate: convRate,
    },
    packagePerformance,
    financialPerformance: {
      totalRevenueAed: totalInvoicedAed,
      estimatedSupplierCostsAed: estCosts,
      actualSupplierCostsAed: actCosts,
      grossProfitAed,
      grossMarginPct,
      hasIncompleteCosts,
    },
    outstandingPayments,
  };
}
