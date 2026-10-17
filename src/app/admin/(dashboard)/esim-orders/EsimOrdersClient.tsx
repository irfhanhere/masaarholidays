"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { Badge, EmptyRow } from "@/components/admin/ui";
import { buildWhatsAppLink } from "@/lib/contact";
import { getDestinationByIso } from "@/lib/esim-config";
import { retryOrderFulfilment, refundOrder, dismissAttentionFlag } from "./actions";

interface EsimOrder {
  id: string;
  public_token: string;
  partner_ref: string;
  plan_id: string;
  quantity: number;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  payment_status: string;
  fulfilment_status: string;
  expected_amount_minor: number | null;
  charged_amount_minor: number | null;
  charge_currency: string | null;
  megaesim_order_number: string | null;
  megaesim_order_id: string | null;
  esims: Array<{
    iccid?: string;
    lpa?: string;
    qr_url?: string;
    status?: string;
  }> | null;
  needs_attention: boolean;
  fulfilment_error: string | null;
  sweep_count?: number;
  refund_notes?: string | null;
  created_at: string;
  updated_at: string;
}

interface PlanInfo {
  plan_id: string;
  name: string;
  country_iso: string | null;
  region_slug: string | null;
  data_gb: number;
  validity_days: number;
}

export function EsimOrdersClient({
  orders: initialOrders,
  plansMap,
}: {
  orders: EsimOrder[];
  plansMap: Record<string, PlanInfo>;
}) {
  const [orders, setOrders] = useState<EsimOrder[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "needs_attention" | "paid_not_fulfilled" | "failed" | "completed">("all");
  const [selectedOrder, setSelectedOrder] = useState<EsimOrder | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Stats calculation
  const stats = useMemo(() => {
    let total = orders.length;
    let needsAttention = 0;
    let paidNotFulfilled = 0;
    let failed = 0;
    let completed = 0;

    for (const o of orders) {
      if (o.needs_attention) needsAttention++;
      if (o.payment_status === "paid" && o.fulfilment_status !== "completed") paidNotFulfilled++;
      if (o.fulfilment_status === "failed" || o.payment_status === "failed") failed++;
      if (o.fulfilment_status === "completed") completed++;
    }

    return { total, needsAttention, paidNotFulfilled, failed, completed };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.partner_ref.toLowerCase().includes(q) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
        (o.customer_email && o.customer_email.toLowerCase().includes(q)) ||
        (o.customer_phone && o.customer_phone.toLowerCase().includes(q)) ||
        o.plan_id.toLowerCase().includes(q) ||
        (o.megaesim_order_number && o.megaesim_order_number.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterTab === "needs_attention") return o.needs_attention === true;
      if (filterTab === "paid_not_fulfilled") return o.payment_status === "paid" && o.fulfilment_status !== "completed";
      if (filterTab === "failed") return o.fulfilment_status === "failed" || o.payment_status === "failed";
      if (filterTab === "completed") return o.fulfilment_status === "completed";

      return true;
    });
  }, [orders, search, filterTab]);

  const [refundModalOrder, setRefundModalOrder] = useState<EsimOrder | null>(null);
  const [overrideNote, setOverrideNote] = useState("");
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  const handleRetry = (order: EsimOrder) => {
    if (!confirm(`Retry automated fulfilment for order ${order.partner_ref}? This will call the carrier API using the same partner ref.`)) {
      return;
    }

    setActionMessage(null);
    startTransition(async () => {
      const res = await retryOrderFulfilment(order.id);
      if (res.success) {
        setActionMessage({ type: "success", text: `Fulfilment initiated for order ${order.partner_ref}` });
        setOrders((prev) =>
          prev.map((item) => (item.id === order.id ? { ...item, fulfilment_status: "processing", fulfilment_error: null } : item))
        );
      } else {
        setActionMessage({ type: "error", text: `Retry failed: ${res.error || "Unknown error"}` });
      }
    });
  };

  const initiateRefund = (order: EsimOrder) => {
    const esims = (Array.isArray(order.esims) ? order.esims : []) as Array<{ status?: string; iccid?: string }>;
    const nonCancellable = esims.find((u) => u.status === "installed" || u.status === "active");

    if (nonCancellable) {
      setRefundModalOrder(order);
      setBlockedReason(
        `eSIM profile ${nonCancellable.iccid || "unit"} is marked as '${nonCancellable.status}' (installed/active on client device) and cannot be cancelled automatically with the carrier. An explicit admin override note is required to issue this Stripe refund.`
      );
      setOverrideNote("");
      return;
    }

    if (!confirm(`Issue a FULL Stripe refund for order ${order.partner_ref}? Any ready eSIM profiles will be cancelled with the carrier first.`)) {
      return;
    }

    executeRefund(order);
  };

  const executeRefund = (order: EsimOrder, note?: string) => {
    setActionMessage(null);
    startTransition(async () => {
      const res = await refundOrder(order.id, note);
      if (res.success) {
        setActionMessage({ type: "success", text: `Refund successfully processed for order ${order.partner_ref}` });
        setOrders((prev) =>
          prev.map((item) => (item.id === order.id ? { ...item, payment_status: "refunded" } : item))
        );
        setRefundModalOrder(null);
        setBlockedReason(null);
      } else if (res.blocked) {
        setRefundModalOrder(order);
        setBlockedReason(res.reason || "Refund blocked by carrier cancellation policy.");
      } else {
        setActionMessage({ type: "error", text: `Refund failed: ${res.error || res.reason || "Unknown error"}` });
      }
    });
  };

  const handleDismissAttention = (order: EsimOrder) => {
    startTransition(async () => {
      const res = await dismissAttentionFlag(order.id);
      if (res.success) {
        setOrders((prev) =>
          prev.map((item) => (item.id === order.id ? { ...item, needs_attention: false } : item))
        );
        if (selectedOrder?.id === order.id) {
          setSelectedOrder((prev) => (prev ? { ...prev, needs_attention: false } : null));
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ── BREADCRUMB & HEADER BANNER ── */}
      <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-gradient-to-r from-[#FAF8F5] via-[#F4EFE6] to-[#FAF8F5] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-masaar-black/50 mb-1">
              <Link href="/admin">Dashboard</Link> ›{" "}
              <Link href="/admin/documents">Documents</Link> › eSIM Orders
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-masaar-black">eSIM Orders</h1>
            <p className="mt-1 text-sm text-masaar-black/60">
              Real-time monitoring of automated carrier provisioning, Stripe payments, and exception triage.
            </p>
          </div>
        </div>
      </div>

      {/* ── KPI METRICS CARDS ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <button
          type="button"
          onClick={() => setFilterTab("all")}
          className={`rounded-xl border p-4 text-left transition shadow-2xs ${
            filterTab === "all" ? "border-masaar-black bg-white ring-2 ring-masaar-black/10" : "border-black/10 bg-white hover:bg-black/[0.02]"
          }`}
        >
          <div className="flex items-center gap-2 text-masaar-black/50 text-xs font-semibold uppercase tracking-wider">
            <span>🌐</span> Total Orders
          </div>
          <p className="mt-2 text-2xl font-bold text-masaar-black">{stats.total}</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab("needs_attention")}
          className={`rounded-xl border p-4 text-left transition shadow-2xs ${
            filterTab === "needs_attention"
              ? "border-red-500 bg-red-50 ring-2 ring-red-500/20"
              : stats.needsAttention > 0
              ? "border-red-300 bg-red-50/60 hover:bg-red-50"
              : "border-black/10 bg-white hover:bg-black/[0.02]"
          }`}
        >
          <div className="flex items-center gap-2 text-red-700 text-xs font-semibold uppercase tracking-wider">
            <span>⚠️</span> Needs Attention
          </div>
          <p className="mt-2 text-2xl font-bold text-red-900">{stats.needsAttention}</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab("paid_not_fulfilled")}
          className={`rounded-xl border p-4 text-left transition shadow-2xs ${
            filterTab === "paid_not_fulfilled"
              ? "border-amber-500 bg-amber-50 ring-2 ring-amber-500/20"
              : stats.paidNotFulfilled > 0
              ? "border-amber-200 bg-amber-50/50 hover:bg-amber-50"
              : "border-black/10 bg-white hover:bg-black/[0.02]"
          }`}
        >
          <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold uppercase tracking-wider">
            <span>⏳</span> Paid & Unfulfilled
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-900">{stats.paidNotFulfilled}</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab("completed")}
          className={`rounded-xl border p-4 text-left transition shadow-2xs ${
            filterTab === "completed" ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20" : "border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50"
          }`}
        >
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
            <span>✅</span> Completed
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-900">{stats.completed}</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab("failed")}
          className={`rounded-xl border p-4 text-left transition shadow-2xs ${
            filterTab === "failed" ? "border-gray-500 bg-gray-50 ring-2 ring-gray-500/20" : "border-gray-200 bg-gray-50/50 hover:bg-gray-100"
          }`}
        >
          <div className="flex items-center gap-2 text-gray-600 text-xs font-semibold uppercase tracking-wider">
            <span>✕</span> Failed / Refunded
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-800">{stats.failed}</p>
        </button>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`rounded-xl p-4 text-xs font-semibold flex items-center justify-between ${
            actionMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-xs underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── SEARCH & FILTER TOOLBAR ── */}
      <div className="rounded-xl border border-black/10 bg-white p-4 shadow-2xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 items-center">
          <div className="lg:col-span-8 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-masaar-black/40">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by order ref, customer name, email, phone, plan ID, or carrier number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-black/15 bg-white py-2 pl-9 pr-3 text-xs focus:border-admin-primary focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-masaar-black/40 hover:text-masaar-black"
              >
                ✕
              </button>
            )}
          </div>

          <div className="lg:col-span-4 flex items-center justify-end gap-2 text-xs">
            <span className="text-masaar-black/50">Filter:</span>
            <select
              value={filterTab}
              onChange={(e) => setFilterTab(e.target.value as any)}
              className="rounded-md border border-black/15 bg-white px-3 py-2 text-xs focus:border-admin-primary focus:outline-none font-semibold text-masaar-black"
            >
              <option value="all">All Orders ({stats.total})</option>
              <option value="needs_attention">Needs Attention ({stats.needsAttention})</option>
              <option value="paid_not_fulfilled">Paid & Not Fulfilled ({stats.paidNotFulfilled})</option>
              <option value="completed">Completed ({stats.completed})</option>
              <option value="failed">Failed / Refunded ({stats.failed})</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── ORDERS TABLE ── */}
      <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-black/10 bg-[#FAF9F6] uppercase tracking-wide text-masaar-black/50 font-semibold">
              <tr>
                <th className="px-4 py-3">Order Ref</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Plan Details</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Fulfilment</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredOrders.length === 0 && (
                <EmptyRow colSpan={7}>
                  No eSIM orders found matching the selected filter.
                </EmptyRow>
              )}
              {filteredOrders.map((order) => {
                const plan = plansMap[order.plan_id];
                const destination = plan?.country_iso ? getDestinationByIso(plan.country_iso) : null;
                const flag = destination?.flag || "🌐";
                const destinationTitle = destination?.name || plan?.name || order.plan_id;

                const amountMinor = order.charged_amount_minor || order.expected_amount_minor || 0;
                const amountFormatted = (amountMinor / 100).toFixed(2);
                const orderCurrency = (order.charge_currency || "AED").toUpperCase();

                const isPaid = order.payment_status === "paid";
                const isRefunded = order.payment_status === "refunded";
                const isCompleted = order.fulfilment_status === "completed";
                const canRetry = isPaid && !isCompleted;
                const canRefund = isPaid && !isRefunded;

                const whatsAppOrderUrl = order.customer_phone
                  ? buildWhatsAppLink(
                      `Assalamu Alaikum ${order.customer_name || ""}, regarding your Masaar Holidays eSIM order ${order.partner_ref}: `
                    )
                  : null;

                return (
                  <tr
                    key={order.id}
                    className={`transition-colors hover:bg-black/[0.02] ${
                      order.needs_attention ? "bg-red-50/30" : ""
                    }`}
                  >
                    {/* Order Ref */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {order.needs_attention && (
                          <span
                            className="size-2 rounded-full bg-red-600 animate-pulse shrink-0"
                            title="Needs Attention"
                          />
                        )}
                        <span className="font-mono font-bold text-admin-primary">
                          {order.partner_ref}
                        </span>
                      </div>
                      <div className="text-[11px] text-masaar-black/40 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-masaar-black">
                        {order.customer_name || "Guest Traveller"}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-masaar-black/60 mt-0.5">
                        {order.customer_email && (
                          <span className="truncate max-w-[150px]">{order.customer_email}</span>
                        )}
                        {order.customer_phone && whatsAppOrderUrl && (
                          <a
                            href={whatsAppOrderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:underline inline-flex items-center gap-0.5 font-mono"
                          >
                            <span>💬</span> {order.customer_phone}
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Plan Details */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-semibold text-masaar-black">
                        <span>{flag}</span>
                        <span>{destinationTitle}</span>
                      </div>
                      <div className="text-[11px] text-masaar-black/60 mt-0.5">
                        {plan?.data_gb ? `${plan.data_gb} GB` : "Data"} · {plan?.validity_days || 7} Days · Qty:{" "}
                        <strong>{order.quantity}</strong>
                      </div>
                    </td>

                    {/* Payment Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {order.payment_status === "paid" && <Badge tone="green">Paid</Badge>}
                      {order.payment_status === "pending" && <Badge tone="amber">Pending</Badge>}
                      {order.payment_status === "refunded" && <Badge tone="gray">Refunded</Badge>}
                      {order.payment_status === "failed" && <Badge tone="gray">Failed</Badge>}
                    </td>

                    {/* Fulfilment Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="space-y-1">
                        <div>
                          {order.fulfilment_status === "completed" && <Badge tone="green">Completed</Badge>}
                          {order.fulfilment_status === "processing" && <Badge tone="blue">Processing</Badge>}
                          {order.fulfilment_status === "pending" && <Badge tone="amber">Pending</Badge>}
                          {order.fulfilment_status === "failed" && <Badge tone="gray">Failed</Badge>}
                        </div>
                        {order.needs_attention && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                            Attention Required
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-masaar-black">
                      {orderCurrency} {amountFormatted}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {canRetry && (
                          <button
                            type="button"
                            onClick={() => handleRetry(order)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1 rounded-md bg-[#C9A227] px-2.5 py-1 text-xs font-semibold text-[#0A0A08] shadow-2xs hover:bg-[#b59120] transition disabled:opacity-50"
                            title="Retry carrier provisioning with same partner_ref"
                          >
                            <span>↻</span> Retry
                          </button>
                        )}

                        {canRefund && (
                          <button
                            type="button"
                            onClick={() => initiateRefund(order)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                            title="Issue full Stripe refund"
                          >
                            Refund
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 rounded-md border border-black/15 bg-white px-2.5 py-1 text-xs font-semibold text-masaar-black hover:bg-black/5 transition"
                        >
                          Details →
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-black/5 bg-[#FAF9F6] text-xs text-masaar-black/50 flex justify-between items-center">
          <span>
            Showing {filteredOrders.length} of {orders.length} orders
          </span>
        </div>
      </div>

      {/* ── DETAIL MODAL ── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-black/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-xl font-bold text-masaar-black">
                    {selectedOrder.partner_ref}
                  </h3>
                  {selectedOrder.needs_attention && (
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                      Needs Attention
                    </span>
                  )}
                </div>
                <p className="text-xs text-masaar-black/60 mt-1">
                  Ordered on {new Date(selectedOrder.created_at).toLocaleString("en-GB")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded p-1.5 text-masaar-black/40 hover:bg-black/5 hover:text-masaar-black text-xs"
              >
                ✕ Close
              </button>
            </div>

            {/* Attention Alert Box */}
            {selectedOrder.needs_attention && (
              <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-800 flex items-center gap-1.5">
                    <span>⚠️</span> Exception Flagged
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDismissAttention(selectedOrder)}
                    disabled={isPending}
                    className="text-xs font-semibold text-red-700 underline hover:no-underline"
                  >
                    Clear Attention Flag
                  </button>
                </div>
                {selectedOrder.fulfilment_error && (
                  <p className="font-mono text-xs text-red-900 bg-white/80 p-2.5 rounded border border-red-200 break-all">
                    {selectedOrder.fulfilment_error}
                  </p>
                )}
              </div>
            )}

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-black/10 bg-[#FAF9F6] p-4 text-xs">
              <div>
                <span className="text-masaar-black/50 block">Customer Name:</span>
                <span className="font-bold text-masaar-black">
                  {selectedOrder.customer_name || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-masaar-black/50 block">Customer Email:</span>
                <span className="font-medium text-masaar-black select-all">
                  {selectedOrder.customer_email || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-masaar-black/50 block">Customer Phone:</span>
                <span className="font-medium text-masaar-black font-mono">
                  {selectedOrder.customer_phone || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-masaar-black/50 block">Public Order Link:</span>
                <Link
                  href={`/esim/order/${selectedOrder.public_token}`}
                  target="_blank"
                  className="text-admin-primary underline font-medium"
                >
                  Open Customer Page ↗
                </Link>
              </div>
            </div>

            {/* Provider Technical Identifiers */}
            <div className="rounded-xl border border-black/10 bg-white p-4 text-xs space-y-2">
              <h4 className="font-bold text-masaar-black uppercase tracking-wider text-[11px] text-masaar-black/50">
                Carrier & Provider Details
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-masaar-black/50">MegaEsim Order Number:</span>
                  <p className="font-mono font-semibold text-masaar-black">
                    {selectedOrder.megaesim_order_number || "Not assigned"}
                  </p>
                </div>
                <div>
                  <span className="text-masaar-black/50">MegaEsim Order ID:</span>
                  <p className="font-mono font-semibold text-masaar-black">
                    {selectedOrder.megaesim_order_id || "Not assigned"}
                  </p>
                </div>
              </div>
            </div>

            {/* Allocated Profiles */}
            <div className="space-y-3">
              <h4 className="font-bold text-masaar-black text-xs uppercase tracking-wider text-masaar-black/60">
                Allocated eSIM Profiles (
                {Array.isArray(selectedOrder.esims) ? selectedOrder.esims.length : 0})
              </h4>
              {Array.isArray(selectedOrder.esims) && selectedOrder.esims.length > 0 ? (
                <div className="space-y-3">
                  {selectedOrder.esims.map((unit, idx) => (
                    <div
                      key={unit.iccid || idx}
                      className="rounded-xl border border-black/10 bg-[#FAF9F6] p-4 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between font-bold text-masaar-black">
                        <span>Profile {idx + 1}</span>
                        <span className="font-mono text-[11px] text-masaar-black/60">
                          ICCID: {unit.iccid || "Pending"}
                        </span>
                      </div>
                      {unit.lpa && (
                        <div>
                          <span className="text-masaar-black/50 text-[11px] block">LPA Code:</span>
                          <p className="font-mono text-[11px] bg-white p-2 rounded border border-black/10 break-all select-all">
                            {unit.lpa}
                          </p>
                        </div>
                      )}
                      {unit.qr_url && (
                        <div>
                          <a
                            href={unit.qr_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-admin-primary underline text-xs font-semibold"
                          >
                            View QR Code Image ↗
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-masaar-black/50 italic">
                  No profiles recorded yet. Profiles will appear once allocated by carrier.
                </p>
              )}
            </div>

            {/* Refund Notes Audit Log */}
            {selectedOrder.refund_notes && (
              <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs">
                <h4 className="font-bold text-amber-900 uppercase tracking-wider text-[11px]">
                  Refund & Cancellation Audit Trail
                </h4>
                <pre className="font-mono text-[11px] text-amber-950 bg-white/80 p-3 rounded border border-amber-200 whitespace-pre-wrap">
                  {selectedOrder.refund_notes}
                </pre>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10">
              {selectedOrder.payment_status === "paid" &&
                selectedOrder.fulfilment_status !== "completed" && (
                  <button
                    type="button"
                    onClick={() => handleRetry(selectedOrder)}
                    disabled={isPending}
                    className="rounded-md bg-[#C9A227] px-4 py-2 text-xs font-bold text-[#0A0A08] hover:bg-[#b59120] transition disabled:opacity-50"
                  >
                    Retry Fulfilment
                  </button>
                )}

              {selectedOrder.payment_status === "paid" && (
                <button
                  type="button"
                  onClick={() => initiateRefund(selectedOrder)}
                  disabled={isPending}
                  className="rounded-md bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition disabled:opacity-50"
                >
                  Issue Stripe Refund
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-md border border-black/15 bg-white px-4 py-2 text-xs font-semibold text-masaar-black hover:bg-black/5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN REFUND OVERRIDE MODAL ── */}
      {refundModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <h3 className="text-base font-bold text-red-900 flex items-center gap-2">
                <span>⚠️</span> Carrier Cancellation Blocked / Override
              </h3>
              <button
                type="button"
                onClick={() => {
                  setRefundModalOrder(null);
                  setBlockedReason(null);
                  setOverrideNote("");
                }}
                className="text-xs text-masaar-black/40 hover:text-masaar-black"
              >
                ✕ Cancel
              </button>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 space-y-1">
              <p className="font-semibold">Reason Refund is Blocked:</p>
              <p className="font-mono text-[11px] leading-relaxed">
                {blockedReason || "One or more eSIM profiles cannot be automatically cancelled with the carrier (status: installed/active)."}
              </p>
            </div>

            <p className="text-xs text-masaar-black/70">
              Per strict company policy, issuing a refund when a profile is installed or active incurs a carrier inventory cost. To proceed, an explicit written note explaining the business rationale (e.g., manager approval, customer device fault) is required and will be permanently recorded in the order audit ledger.
            </p>

            <div className="space-y-1">
              <label htmlFor="override-note" className="block text-xs font-semibold text-masaar-black">
                Admin Override Written Note <span className="text-red-500">*</span>:
              </label>
              <textarea
                id="override-note"
                rows={3}
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
                placeholder="e.g., Customer eSIM failed to connect in London; confirmed unused with carrier NOC. Approved by GM."
                className="w-full rounded-lg border border-black/20 p-2.5 text-xs text-masaar-black focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRefundModalOrder(null);
                  setBlockedReason(null);
                  setOverrideNote("");
                }}
                disabled={isPending}
                className="rounded-md border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-masaar-black hover:bg-black/5"
              >
                Abort
              </button>
              <button
                type="button"
                onClick={() => executeRefund(refundModalOrder, overrideNote)}
                disabled={isPending || !overrideNote.trim()}
                className="rounded-md bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                {isPending ? "Processing Override..." : "Authorize Override & Refund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
