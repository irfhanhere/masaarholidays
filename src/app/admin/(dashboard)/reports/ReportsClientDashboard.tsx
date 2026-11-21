"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Card, StatCard } from "@/components/admin/ui";
import type { OperationsReportData } from "@/lib/data/operations-reports";

export function ReportsClientDashboard({ initialData }: { initialData: OperationsReportData }) {
  const [activeSection, setActiveSection] = useState<"sales" | "packages" | "financial" | "outstanding">("sales");
  const { salesSummary, packagePerformance, financialPerformance, outstandingPayments } = initialData;

  function handleExportCsv() {
    const rows = [
      ["Invoice Number", "Customer Name", "Total Amount (AED)", "Paid Amount (AED)", "Outstanding (AED)", "Due Date", "Days Overdue"],
      ...outstandingPayments.map((p) => [
        p.invoiceNumber,
        `"${p.customerName.replace(/"/g, '""')}"`,
        p.totalAmountAed.toString(),
        p.paidAmountAed.toString(),
        p.outstandingAmountAed.toString(),
        p.dueDate || "—",
        p.daysOverdue.toString(),
      ]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `masaar_outstanding_payments_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Invoiced" value={`AED ${salesSummary.totalInvoicedAed.toLocaleString()}`} />
        <StatCard label="Total Collected" value={`AED ${salesSummary.totalCollectedAed.toLocaleString()}`} />
        <StatCard label="Outstanding Balance" value={`AED ${salesSummary.outstandingBalanceAed.toLocaleString()}`} />
        <StatCard label="Gross Margin" value={`${financialPerformance.grossMarginPct}%`} />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-black/10 bg-white px-4">
        {[
          { id: "sales", label: "Sales & Conversion" },
          { id: "packages", label: "Package Performance" },
          { id: "financial", label: "Profitability & Costs" },
          { id: "outstanding", label: `Outstanding Payments (${outstandingPayments.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
              activeSection === tab.id
                ? "border-pure-gold text-masaar-black"
                : "border-transparent text-masaar-black/60 hover:text-masaar-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section 1: Sales Summary */}
      {activeSection === "sales" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="space-y-4">
              <h2 className="text-base font-bold text-masaar-black">Quotation Pipeline Metrics</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1.5 border-b border-black/5">
                  <span className="text-masaar-black/60">Total Quotations Issued</span>
                  <span className="font-bold">{salesSummary.totalQuotations}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/5">
                  <span className="text-masaar-black/60">Accepted / Converted Quotes</span>
                  <span className="font-bold text-green-700">{salesSummary.acceptedQuotations}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/5">
                  <span className="text-masaar-black/60">Quote-to-Booking Conversion Rate</span>
                  <span className="font-bold text-pure-gold">{salesSummary.quotationConversionRate}%</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-masaar-black/60">Confirmed Bookings</span>
                  <span className="font-bold">{salesSummary.confirmedBookings}</span>
                </div>
              </div>
            </Card>

            <Card className="space-y-4">
              <h2 className="text-base font-bold text-masaar-black">Cashflow Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1.5 border-b border-black/5">
                  <span className="text-masaar-black/60">Total Invoiced Amount</span>
                  <span className="font-bold">AED {salesSummary.totalInvoicedAed.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/5">
                  <span className="text-masaar-black/60">Authoritative Payments Received</span>
                  <span className="font-bold text-green-700">AED {salesSummary.totalCollectedAed.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-masaar-black/60">Total Outstanding Balance</span>
                  <span className="font-bold text-amber-700">AED {salesSummary.outstandingBalanceAed.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Section 2: Package Performance */}
      {activeSection === "packages" && (
        <Card className="space-y-4">
          <h2 className="text-base font-bold text-masaar-black">Package Volume & Revenue Breakdown</h2>
          <div className="overflow-hidden rounded border border-black/10">
            <table className="min-w-full divide-y divide-black/10 text-left text-sm">
              <thead className="bg-admin-surface text-xs font-semibold uppercase tracking-wider text-masaar-black/60">
                <tr>
                  <th className="px-4 py-3">Package Name</th>
                  <th className="px-4 py-3 text-center">Bookings Count</th>
                  <th className="px-4 py-3 text-right">Total Revenue</th>
                  <th className="px-4 py-3 text-right">Average Selling Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {packagePerformance.map((pkg, idx) => (
                  <tr key={idx} className="hover:bg-black/[0.02]">
                    <td className="px-4 py-3 font-semibold text-masaar-black">
                      {pkg.packageName}
                      {pkg.packageName.includes("Best Selling") && (
                        <span className="ml-2 inline-block rounded bg-pure-gold/20 px-2 py-0.5 text-[10px] font-bold text-deep-gold uppercase">
                          Featured
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-bold">{pkg.bookingsCount}</td>
                    <td className="px-4 py-3 text-right font-bold text-xs">
                      AED {pkg.revenueAed.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      AED {pkg.averageSellingPriceAed.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Section 3: Profitability & Costs */}
      {activeSection === "financial" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-masaar-black/60">Gross Revenue</p>
              <p className="text-2xl font-bold text-masaar-black">AED {financialPerformance.totalRevenueAed.toLocaleString()}</p>
              <p className="text-xs text-masaar-black/50">Confirmed sales invoices</p>
            </Card>

            <Card className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-masaar-black/60">Supplier Costs</p>
              <p className="text-2xl font-bold text-masaar-black">AED {financialPerformance.actualSupplierCostsAed.toLocaleString()}</p>
              <p className="text-xs text-masaar-black/50">Hotels, transport & carriers</p>
            </Card>

            <Card className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-masaar-black/60">Gross Profit (Margin)</p>
              <p className="text-2xl font-bold text-green-700">AED {financialPerformance.grossProfitAed.toLocaleString()}</p>
              <p className="text-xs text-green-700 font-semibold">{financialPerformance.grossMarginPct}% Gross Margin</p>
            </Card>
          </div>

          {financialPerformance.hasIncompleteCosts && (
            <div className="rounded border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
              <strong>Notice on Cost Tracking:</strong> Some bookings utilize estimated baseline supplier cost rates. To calculate exact net profit per journey, link specific supplier invoice references in the booking supplier cost ledger.
            </div>
          )}
        </div>
      )}

      {/* Section 4: Outstanding Payments */}
      {activeSection === "outstanding" && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-masaar-black">Outstanding Accounts & Overdue Balances</h2>
            <button
              onClick={handleExportCsv}
              className="rounded border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-black/5"
            >
              Export CSV
            </button>
          </div>

          <div className="overflow-hidden rounded border border-black/10">
            <table className="min-w-full divide-y divide-black/10 text-left text-sm">
              <thead className="bg-admin-surface text-xs font-semibold uppercase tracking-wider text-masaar-black/60">
                <tr>
                  <th className="px-4 py-3">Invoice Number</th>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3 text-right">Invoice Amount</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Outstanding</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-center">Overdue</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {outstandingPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-masaar-black/50">
                      All accounts are fully paid. No outstanding balances.
                    </td>
                  </tr>
                ) : (
                  outstandingPayments.map((p) => (
                    <tr key={p.invoiceId} className="hover:bg-black/[0.02]">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-pure-gold">
                        {p.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold">{p.customerName}</td>
                      <td className="px-4 py-3 text-right text-xs">AED {p.totalAmountAed.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-xs text-green-700">AED {p.paidAmountAed.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-xs font-bold text-amber-700">AED {p.outstandingAmountAed.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs">{p.dueDate || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {p.daysOverdue > 0 ? (
                          <Badge tone="amber">{p.daysOverdue} days</Badge>
                        ) : (
                          <Badge tone="green">Current</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/payments/record?invoiceId=${p.invoiceId}&clientName=${encodeURIComponent(p.customerName)}&balance=${p.outstandingAmountAed}`}
                          className="rounded bg-pure-gold/20 px-2 py-1 text-xs font-semibold text-deep-gold hover:bg-pure-gold/30"
                        >
                          Collect
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
