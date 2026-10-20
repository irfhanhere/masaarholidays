"use client";

import { useState, useTransition } from "react";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  Search,
  Filter,
  Download,
  Eye,
  X,
  FileText,
  AlertTriangle,
  ArrowDownLeft,
} from "@/components/admin/icons";
import type { VisaPaymentRow } from "@/lib/types/database";
import { processVisaRefund } from "./actions";

interface PaymentItem {
  id: string;
  application_ref: string;
  applicant_name: string;
  visa_type: string;
  variant: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_ref: string;
  gateway_payment_id: string;
  status: "success" | "pending" | "failed" | "refunded";
  payment_date: string;
  travel_date: string;
  application_status: string;
  refund_status?: string;
  refund_amount?: number;
  refund_date?: string;
}

const INITIAL_PAYMENTS: PaymentItem[] = [
  {
    id: "pay-1",
    application_ref: "MH-UV-2026-001248",
    applicant_name: "Ahmed Khan",
    visa_type: "UAE Visa",
    variant: "30 Days – Single Entry",
    amount: 120,
    currency: "USD",
    payment_method: "Mastercard •••• 3456",
    transaction_ref: "pi_3KJd9a2F8v9Q1",
    gateway_payment_id: "ch_3KJd9a2F8v9Q1",
    status: "success",
    payment_date: "20 Oct 2026, 02:28 PM",
    travel_date: "12 Nov 2026",
    application_status: "Under Review",
  },
  {
    id: "pay-2",
    application_ref: "MH-SV-2026-001247",
    applicant_name: "Sara Ali",
    visa_type: "Saudi Tourist Visa",
    variant: "90 Days – Multiple Entry",
    amount: 220,
    currency: "USD",
    payment_method: "Visa •••• 1122",
    transaction_ref: "pi_3KJd9a2E8v9Q2",
    gateway_payment_id: "ch_3KJd9a2E8v9Q2",
    status: "success",
    payment_date: "19 Oct 2026, 11:15 AM",
    travel_date: "05 Dec 2026",
    application_status: "Submitted",
  },
  {
    id: "pay-3",
    application_ref: "MH-US-2026-001246",
    applicant_name: "Mohammed Rashid",
    visa_type: "US Visa",
    variant: "Work Visa (H1B)",
    amount: 245,
    currency: "USD",
    payment_method: "Visa •••• 9876",
    transaction_ref: "pi_3KJd9a2D8v9Q3",
    gateway_payment_id: "ch_3KJd9a2D8v9Q3",
    status: "success",
    payment_date: "18 Oct 2026, 04:20 PM",
    travel_date: "15 Nov 2026",
    application_status: "Approved",
  },
  {
    id: "pay-4",
    application_ref: "MH-UV-2026-001245",
    applicant_name: "Priya Nair",
    visa_type: "UAE Visa",
    variant: "60 Days – Single Entry",
    amount: 180,
    currency: "USD",
    payment_method: "Apple Pay",
    transaction_ref: "pi_3KJd9a2C8v9Q4",
    gateway_payment_id: "ch_3KJd9a2C8v9Q4",
    status: "pending",
    payment_date: "17 Oct 2026, 10:45 AM",
    travel_date: "22 Dec 2026",
    application_status: "Under Review",
  },
  {
    id: "pay-5",
    application_ref: "MH-UV-2026-001244",
    applicant_name: "Fahad Al Marri",
    visa_type: "UAE Visa",
    variant: "30 Days – Single Entry",
    amount: 140,
    currency: "USD",
    payment_method: "Mastercard •••• 5544",
    transaction_ref: "pi_3KJd9a2B8v9Q5",
    gateway_payment_id: "ch_3KJd9a2B8v9Q5",
    status: "success",
    payment_date: "16 Oct 2026, 03:10 PM",
    travel_date: "10 Nov 2026",
    application_status: "Submitted",
  },
  {
    id: "pay-6",
    application_ref: "MH-SV-2026-001243",
    applicant_name: "Aisha Rahman",
    visa_type: "Saudi Tourist Visa",
    variant: "30 Days – Single Entry",
    amount: 200,
    currency: "USD",
    payment_method: "Visa •••• 4433",
    transaction_ref: "pi_3KJd9a2A8v9Q6",
    gateway_payment_id: "ch_3KJd9a2A8v9Q6",
    status: "refunded",
    payment_date: "15 Oct 2026, 12:00 PM",
    travel_date: "25 Nov 2026",
    application_status: "Documents Required",
    refund_status: "Full refund processed",
    refund_amount: 200,
    refund_date: "16 Oct 2026",
  },
  {
    id: "pay-7",
    application_ref: "MH-US-2026-001242",
    applicant_name: "Daniel Thomas",
    visa_type: "US Visa",
    variant: "Student Visa (F1)",
    amount: 225,
    currency: "USD",
    payment_method: "Amex •••• 1009",
    transaction_ref: "pi_3KJd9a298v9Q7",
    gateway_payment_id: "ch_3KJd9a298v9Q7",
    status: "failed",
    payment_date: "14 Oct 2026, 09:30 AM",
    travel_date: "18 Jan 2027",
    application_status: "Rejected",
  },
  {
    id: "pay-8",
    application_ref: "MH-UV-2026-001241",
    applicant_name: "Fatima Zahra",
    visa_type: "UAE Visa",
    variant: "30 Days – Single Entry",
    amount: 120,
    currency: "USD",
    payment_method: "Visa •••• 2211",
    transaction_ref: "pi_3KJd9a288v9Q8",
    gateway_payment_id: "ch_3KJd9a288v9Q8",
    status: "success",
    payment_date: "13 Oct 2026, 05:20 PM",
    travel_date: "28 Nov 2026",
    application_status: "Under Review",
  },
  {
    id: "pay-9",
    application_ref: "MH-SV-2026-001240",
    applicant_name: "Khalid Hussain",
    visa_type: "Saudi Tourist Visa",
    variant: "Family Visit Visa",
    amount: 250,
    currency: "USD",
    payment_method: "Mastercard •••• 7788",
    transaction_ref: "pi_3KJd9a278v9Q9",
    gateway_payment_id: "ch_3KJd9a278v9Q9",
    status: "success",
    payment_date: "12 Oct 2026, 11:10 AM",
    travel_date: "02 Dec 2026",
    application_status: "Approved",
  },
  {
    id: "pay-10",
    application_ref: "MH-UV-2026-001239",
    applicant_name: "Neha Kapoor",
    visa_type: "UAE Visa",
    variant: "30 Days – Single Entry",
    amount: 120,
    currency: "USD",
    payment_method: "Google Pay",
    transaction_ref: "pi_3KJd9a268v9Q0",
    gateway_payment_id: "ch_3KJd9a268v9Q0",
    status: "pending",
    payment_date: "11 Oct 2026, 09:45 AM",
    travel_date: "08 Nov 2026",
    application_status: "Draft",
  },
];

export default function VisaPaymentsClient() {
  const [payments, setPayments] = useState<PaymentItem[]>(INITIAL_PAYMENTS);
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [visaTypeFilter, setVisaTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  // Metrics matching A06
  const totalCount = 224;
  const successCount = 198;
  const pendingCount = 12;
  const failedCount = 7;
  const refundedCount = 7;

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.application_ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.transaction_ref.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      visaTypeFilter === "all" || p.visa_type.toLowerCase().includes(visaTypeFilter.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleRefund = (payment: PaymentItem) => {
    if (!confirm(`Are you sure you want to refund USD ${payment.amount} for ${payment.application_ref}?`)) return;

    setPayments((prev) =>
      prev.map((p) =>
        p.id === payment.id
          ? {
              ...p,
              status: "refunded",
              refund_status: "Full refund processed",
              refund_amount: p.amount,
              refund_date: "Just now",
            }
          : p
      )
    );

    if (selectedPayment && selectedPayment.id === payment.id) {
      setSelectedPayment({
        ...selectedPayment,
        status: "refunded",
        refund_status: "Full refund processed",
        refund_amount: selectedPayment.amount,
        refund_date: "Just now",
      });
    }

    startTransition(async () => {
      await processVisaRefund(payment.id, payment.amount);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-masaar-black">Payments</h1>
          <p className="mt-1 text-sm text-masaar-black/60">
            View and manage all visa payments, transaction details, refunds and reconciliation.
          </p>
        </div>
        <button
          onClick={() => alert("Exporting payment reconciliation report...")}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition"
        >
          <Download className="h-4 w-4" />
          Export Reports
        </button>
      </div>

      {/* 5 Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-masaar-black/50">Total Payments</p>
            <p className="text-xl font-bold text-masaar-black">{totalCount}</p>
            <p className="text-[10px] text-masaar-black/50">All transactions</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-masaar-black/50">Successful</p>
            <p className="text-xl font-bold text-emerald-600">{successCount}</p>
            <p className="text-[10px] text-masaar-black/50">88% success rate</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-masaar-black/50">Pending</p>
            <p className="text-xl font-bold text-amber-800">{pendingCount}</p>
            <p className="text-[10px] text-masaar-black/50">Awaiting confirmation</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-masaar-black/50">Failed</p>
            <p className="text-xl font-bold text-red-600">{failedCount}</p>
            <p className="text-[10px] text-masaar-black/50">Payment unsuccessful</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <RotateCcw className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-masaar-black/50">Refunded</p>
            <p className="text-xl font-bold text-purple-700">{refundedCount}</p>
            <p className="text-[10px] text-masaar-black/50">Total refunded</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
          <input
            type="text"
            placeholder="Search by reference, applicant name, email or transaction ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-black/10 py-2 pl-9 pr-3 text-sm focus:border-amber-600 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={visaTypeFilter}
            onChange={(e) => setVisaTypeFilter(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-medium text-masaar-black focus:border-amber-600 focus:outline-none"
          >
            <option value="all">All Visa Types</option>
            <option value="uae">UAE Visa</option>
            <option value="saudi">Saudi Tourist Visa</option>
            <option value="us">US Visa</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-medium text-masaar-black focus:border-amber-600 focus:outline-none"
          >
            <option value="all">All Payment Status</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>

          <button
            onClick={() => {
              setSearchQuery("");
              setVisaTypeFilter("all");
              setStatusFilter("all");
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-black/10 px-3 py-2 text-xs font-medium text-masaar-black/70 hover:bg-black/5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-neutral-50/60 text-xs font-semibold uppercase tracking-wider text-masaar-black/50">
              <tr>
                <th className="w-8 px-4 py-3 text-center">#</th>
                <th className="px-4 py-3">Application Ref.</th>
                <th className="px-4 py-3">Applicant Name</th>
                <th className="px-4 py-3">Visa Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3">Transaction Ref.</th>
                <th className="px-4 py-3">Payment Status</th>
                <th className="px-4 py-3">Payment Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredPayments.map((p, idx) => (
                <tr
                  key={p.id}
                  onClick={() => setSelectedPayment(p)}
                  className={`cursor-pointer transition hover:bg-neutral-50/60 ${
                    selectedPayment?.id === p.id ? "bg-amber-50/30" : ""
                  }`}
                >
                  <td className="px-4 py-3.5 text-center text-xs text-masaar-black/40">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-masaar-black">
                    {p.application_ref}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-masaar-black">{p.applicant_name}</td>
                  <td className="px-4 py-3.5 text-masaar-black/80">{p.visa_type}</td>
                  <td className="px-4 py-3.5 font-bold text-masaar-black">
                    {p.currency} {p.amount}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-masaar-black/70">{p.payment_method}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-masaar-black/60">{p.transaction_ref}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        p.status === "success"
                          ? "bg-emerald-100 text-emerald-800"
                          : p.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : p.status === "refunded"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          p.status === "success"
                            ? "bg-emerald-600"
                            : p.status === "pending"
                            ? "bg-amber-600"
                            : p.status === "refunded"
                            ? "bg-purple-600"
                            : "bg-red-600"
                        }`}
                      />
                      {p.status === "success" && "Success"}
                      {p.status === "pending" && "Pending"}
                      {p.status === "refunded" && "Refunded"}
                      {p.status === "failed" && "Failed"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-masaar-black/60">{p.payment_date}</td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPayment(p);
                      }}
                      className="rounded p-1.5 text-masaar-black/50 hover:bg-black/5 hover:text-masaar-black"
                      title="View Transaction Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Slide-Over Drawer for Selected Transaction */}
      {selectedPayment && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl border-l border-black/10">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-black/10 px-6 py-4 bg-neutral-50/70">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-masaar-black">
                {selectedPayment.application_ref}
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                Paid
              </span>
            </div>
            <button
              onClick={() => setSelectedPayment(null)}
              className="rounded-lg p-1.5 text-masaar-black/40 hover:bg-black/5 hover:text-masaar-black"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Transaction Details */}
            <div className="rounded-xl border border-black/10 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/50">
                Transaction Details
              </h4>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Transaction Reference</span>
                  <span className="font-mono font-medium text-masaar-black">{selectedPayment.transaction_ref}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Payment Method</span>
                  <span className="font-medium text-masaar-black">{selectedPayment.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Payment Date</span>
                  <span className="font-medium text-masaar-black">{selectedPayment.payment_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Amount</span>
                  <span className="font-bold text-masaar-black">USD {selectedPayment.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Payment Status</span>
                  <span className="font-semibold text-emerald-700">Success</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Gateway</span>
                  <span className="font-semibold text-masaar-black">Stripe</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Gateway Payment ID</span>
                  <span className="font-mono text-masaar-black/70">{selectedPayment.gateway_payment_id}</span>
                </div>
              </div>
            </div>

            {/* Application Details */}
            <div className="rounded-xl border border-black/10 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/50">
                Application Details
              </h4>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Application Reference</span>
                  <span className="font-mono font-semibold text-masaar-black">{selectedPayment.application_ref}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Applicant Name</span>
                  <span className="font-semibold text-masaar-black">{selectedPayment.applicant_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Visa Type</span>
                  <span className="font-medium text-masaar-black">{selectedPayment.visa_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Product Variant</span>
                  <span className="font-medium text-masaar-black">{selectedPayment.variant}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Travel Date</span>
                  <span className="font-medium text-masaar-black">{selectedPayment.travel_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Application Status</span>
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    {selectedPayment.application_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Refund Information */}
            <div className="rounded-xl border border-black/10 p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/50">
                  Refund Information
                </h4>
                {selectedPayment.status !== "refunded" && (
                  <button
                    onClick={() => handleRefund(selectedPayment)}
                    className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                  >
                    Order Refund
                  </button>
                )}
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Refund Status</span>
                  <span className="font-medium text-masaar-black">
                    {selectedPayment.refund_status || "No refund"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Refund Amount</span>
                  <span className="font-medium text-masaar-black">
                    {selectedPayment.refund_amount ? `USD ${selectedPayment.refund_amount}` : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Refund Date</span>
                  <span className="font-medium text-masaar-black">
                    {selectedPayment.refund_date || "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Timeline */}
            <div className="rounded-xl border border-black/10 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/50">
                Payment Timeline
              </h4>
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-masaar-black">Payment Initiated</p>
                    <p className="text-[10px] text-masaar-black/50">{selectedPayment.payment_date}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-masaar-black">Payment Successful</p>
                    <p className="text-[10px] text-masaar-black/50">Stripe Webhook Verified</p>
                  </div>
                </div>

                {selectedPayment.status === "refunded" && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-white">
                      <RotateCcw className="h-3 w-3" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-purple-900">Refund Completed</p>
                      <p className="text-[10px] text-purple-700">{selectedPayment.refund_date}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
