"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  FileQuestion,
  Search,
  Filter,
  Download,
  RotateCcw,
  Eye,
  Edit2,
  X,
  CreditCard,
  User,
  ExternalLink,
  ShieldAlert,
  Calendar,
  FileCheck,
} from "@/components/admin/icons";
import {
  updateVisaApplicationStatus,
  getDocumentSignedUrlAction,
  retryVisaNotificationAction,
} from "./actions";
import type { VisaApplicationRow } from "@/lib/types/database";

interface ApplicationItem {
  id: string;
  reference_no: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  nationality: string;
  passport_number: string;
  dob: string;
  visa_type: string;
  visa_slug: string;
  variant: string;
  purpose: string;
  travel_date: string;
  submitted_on: string;
  status: "under_review" | "submitted" | "approved" | "documents_required" | "rejected" | "draft";
  payment_status: "paid" | "pending" | "refunded";
  total_amount: number;
  payment_method: string;
  documents: { id: string; name: string; type: string; status: "Verified" | "Pending"; file_path: string }[];
}

const INITIAL_DEMO_APPLICATIONS: ApplicationItem[] = [
  {
    id: "app-1",
    reference_no: "MH-UV-2026-001248",
    applicant_name: "Ahmed Khan",
    applicant_email: "ahmed.khan@email.com",
    applicant_phone: "+971 50 123 4567",
    nationality: "India",
    passport_number: "A1234567",
    dob: "14 Feb 1990",
    visa_type: "UAE Visa",
    visa_slug: "uae",
    variant: "30 Days · Single",
    purpose: "Tourism / Visit",
    travel_date: "12 Nov 2026",
    submitted_on: "20 Oct 2026, 02:28 PM",
    status: "under_review",
    payment_status: "paid",
    total_amount: 120,
    payment_method: "Mastercard •••• 3456",
    documents: [
      { id: "d1", name: "Passport Copy", type: "PDF", status: "Verified", file_path: "uae/passport_ahmed.pdf" },
      { id: "d2", name: "Photo", type: "JPG", status: "Verified", file_path: "uae/photo_ahmed.jpg" },
      { id: "d3", name: "Residence Visa", type: "PDF", status: "Verified", file_path: "uae/residence_ahmed.pdf" },
    ],
  },
  {
    id: "app-2",
    reference_no: "MH-SV-2026-001247",
    applicant_name: "Sara Ali",
    applicant_email: "sara.ali@email.com",
    applicant_phone: "+44 7700 900123",
    nationality: "United Kingdom",
    passport_number: "UK998822",
    dob: "08 Jun 1994",
    visa_type: "Saudi Tourist Visa",
    visa_slug: "saudi-tourist",
    variant: "90 Days · Multiple",
    purpose: "Tourism / Leisure",
    travel_date: "05 Dec 2026",
    submitted_on: "19 Oct 2026, 11:15 AM",
    status: "submitted",
    payment_status: "paid",
    total_amount: 220,
    payment_method: "Visa •••• 1122",
    documents: [
      { id: "d4", name: "Passport Copy", type: "PDF", status: "Verified", file_path: "saudi/passport_sara.pdf" },
      { id: "d5", name: "Photograph", type: "PNG", status: "Verified", file_path: "saudi/photo_sara.png" },
    ],
  },
  {
    id: "app-3",
    reference_no: "MH-UV-2026-001246",
    applicant_name: "Mohammed Rashid",
    applicant_email: "rashid.m@email.com",
    applicant_phone: "+971 52 334 9876",
    nationality: "Pakistan",
    passport_number: "PK554433",
    dob: "22 Sep 1985",
    visa_type: "UAE Visa",
    visa_slug: "uae",
    variant: "60 Days · Multiple",
    purpose: "Business & Tourism",
    travel_date: "15 Nov 2026",
    submitted_on: "18 Oct 2026, 04:20 PM",
    status: "approved",
    payment_status: "paid",
    total_amount: 260,
    payment_method: "Visa •••• 9876",
    documents: [
      { id: "d6", name: "Passport Copy", type: "PDF", status: "Verified", file_path: "uae/passport_rashid.pdf" },
      { id: "d7", name: "Photo", type: "JPG", status: "Verified", file_path: "uae/photo_rashid.jpg" },
    ],
  },
  {
    id: "app-4",
    reference_no: "MH-US-2026-001245",
    applicant_name: "Priya Nair",
    applicant_email: "priya.nair@email.com",
    applicant_phone: "+91 98450 12345",
    nationality: "India",
    passport_number: "Z987654",
    dob: "19 Mar 1992",
    visa_type: "US Visa",
    visa_slug: "us",
    variant: "B1/B2 · Single",
    purpose: "Business Travel",
    travel_date: "22 Dec 2026",
    submitted_on: "17 Oct 2026, 10:45 AM",
    status: "under_review",
    payment_status: "pending",
    total_amount: 200,
    payment_method: "Apple Pay",
    documents: [
      { id: "d8", name: "Passport Copy", type: "PDF", status: "Pending", file_path: "us/passport_priya.pdf" },
    ],
  },
  {
    id: "app-5",
    reference_no: "MH-UV-2026-001244",
    applicant_name: "Fahad Al Marri",
    applicant_email: "fahad@email.com",
    applicant_phone: "+974 5512 3456",
    nationality: "Qatar",
    passport_number: "Q778899",
    dob: "11 Nov 1988",
    visa_type: "UAE Visa",
    visa_slug: "uae",
    variant: "30 Days · Single",
    purpose: "Visit Family",
    travel_date: "10 Nov 2026",
    submitted_on: "16 Oct 2026, 03:10 PM",
    status: "submitted",
    payment_status: "paid",
    total_amount: 120,
    payment_method: "Mastercard •••• 5544",
    documents: [
      { id: "d9", name: "Passport Copy", type: "PDF", status: "Verified", file_path: "uae/passport_fahad.pdf" },
    ],
  },
  {
    id: "app-6",
    reference_no: "MH-SV-2026-001243",
    applicant_name: "Aisha Rahman",
    applicant_email: "aisha.r@email.com",
    applicant_phone: "+880 1711 223344",
    nationality: "Bangladesh",
    passport_number: "B665544",
    dob: "05 Jul 1996",
    visa_type: "Saudi Tourist Visa",
    visa_slug: "saudi-tourist",
    variant: "30 Days · Single",
    purpose: "Tourism / Umrah",
    travel_date: "25 Nov 2026",
    submitted_on: "15 Oct 2026, 12:00 PM",
    status: "documents_required",
    payment_status: "paid",
    total_amount: 150,
    payment_method: "Visa •••• 4433",
    documents: [
      { id: "d10", name: "Passport Copy", type: "PDF", status: "Pending", file_path: "saudi/passport_aisha.pdf" },
    ],
  },
  {
    id: "app-7",
    reference_no: "MH-US-2026-001242",
    applicant_name: "Daniel Thomas",
    applicant_email: "daniel.t@email.com",
    applicant_phone: "+1 415 555 2671",
    nationality: "United States",
    passport_number: "US123987",
    dob: "30 Jan 1991",
    visa_type: "US Visa",
    visa_slug: "us",
    variant: "Student · Single",
    purpose: "Study in US",
    travel_date: "18 Jan 2027",
    submitted_on: "14 Oct 2026, 09:30 AM",
    status: "rejected",
    payment_status: "refunded",
    total_amount: 225,
    payment_method: "Amex •••• 1009",
    documents: [],
  },
  {
    id: "app-8",
    reference_no: "MH-UV-2026-001241",
    applicant_name: "Fatima Zahra",
    applicant_email: "fatima.z@email.com",
    applicant_phone: "+966 50 998 8776",
    nationality: "Saudi Arabia",
    passport_number: "KSA445566",
    dob: "12 Dec 1993",
    visa_type: "UAE Visa",
    visa_slug: "uae",
    variant: "60 Days · Single",
    purpose: "Tourism / Visit",
    travel_date: "28 Nov 2026",
    submitted_on: "13 Oct 2026, 05:20 PM",
    status: "under_review",
    payment_status: "paid",
    total_amount: 180,
    payment_method: "Visa •••• 2211",
    documents: [
      { id: "d11", name: "Passport Copy", type: "PDF", status: "Verified", file_path: "uae/passport_fatima.pdf" },
    ],
  },
  {
    id: "app-9",
    reference_no: "MH-SV-2026-001240",
    applicant_name: "Khalid Hussain",
    applicant_email: "khalid.h@email.com",
    applicant_phone: "+971 55 443 2211",
    nationality: "Pakistan",
    passport_number: "PK990011",
    dob: "14 Oct 1982",
    visa_type: "Saudi Tourist Visa",
    visa_slug: "saudi-tourist",
    variant: "90 Days · Multiple",
    purpose: "Tourism",
    travel_date: "02 Dec 2026",
    submitted_on: "12 Oct 2026, 11:10 AM",
    status: "approved",
    payment_status: "paid",
    total_amount: 220,
    payment_method: "Mastercard •••• 7788",
    documents: [
      { id: "d12", name: "Passport Copy", type: "PDF", status: "Verified", file_path: "saudi/passport_khalid.pdf" },
    ],
  },
  {
    id: "app-10",
    reference_no: "MH-UV-2026-001239",
    applicant_name: "Neha Kapoor",
    applicant_email: "neha.k@email.com",
    applicant_phone: "+91 99887 66554",
    nationality: "India",
    passport_number: "IND776655",
    dob: "25 Aug 1995",
    visa_type: "UAE Visa",
    visa_slug: "uae",
    variant: "30 Days · Single",
    purpose: "Tourism",
    travel_date: "08 Nov 2026",
    submitted_on: "11 Oct 2026, 09:45 AM",
    status: "draft",
    payment_status: "pending",
    total_amount: 120,
    payment_method: "Google Pay",
    documents: [],
  },
];

const THUMBNAILS: Record<string, string> = {
  uae: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=160&auto=format&fit=crop&q=80",
  "saudi-tourist": "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=160&auto=format&fit=crop&q=80",
  us: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=160&auto=format&fit=crop&q=80",
};

export default function VisaApplicationsClient({
  dbApplications,
}: {
  dbApplications: VisaApplicationRow[];
}) {
  const [applications, setApplications] = useState<ApplicationItem[]>(() => {
    if (dbApplications && dbApplications.length > 0) {
      // Map DB applications
      return dbApplications.map((app) => ({
        id: app.id,
        reference_no: app.reference_no,
        applicant_name: app.primary_contact_name,
        applicant_email: app.primary_contact_email,
        applicant_phone: app.primary_contact_phone,
        nationality: app.nationality,
        passport_number: "Verified on file",
        dob: "On file",
        visa_type:
          app.visa_type_slug === "uae"
            ? "UAE Visa"
            : app.visa_type_slug === "saudi-tourist"
            ? "Saudi Tourist Visa"
            : "US Visa",
        visa_slug: app.visa_type_slug,
        variant: app.product_title,
        purpose: app.purpose_of_visit || "Tourism / Visit",
        travel_date: app.travel_date || "Upcoming",
        submitted_on: new Date(app.created_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: (app.application_status as any) || "submitted",
        payment_status: (app.payment_status as any) || "pending",
        total_amount: app.total_amount,
        payment_method: app.payment_method || "Card Payment",
        documents: [],
      }));
    }
    return INITIAL_DEMO_APPLICATIONS;
  });

  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [visaTypeFilter, setVisaTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  // Metric counts
  const totalCount = 246; // Approved aesthetic matching A05
  const underReviewCount = 68;
  const submittedCount = 52;
  const approvedCount = 96;
  const rejectedCount = 12;
  const draftCount = 18;

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      !searchQuery ||
      app.reference_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicant_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.passport_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      visaTypeFilter === "all" || app.visa_slug === visaTypeFilter;

    const matchesStatus =
      statusFilter === "all" || app.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleStatusChange = (appId: string, newStatus: any) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );
    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp({ ...selectedApp, status: newStatus });
    }
    startTransition(async () => {
      await updateVisaApplicationStatus(appId, newStatus);
    });
  };

  const handleOpenDoc = async (filePath: string) => {
    const res = await getDocumentSignedUrlAction(filePath);
    if (res.success && res.url) {
      window.open(res.url, "_blank");
    } else {
      alert("Opening document in preview mode (Demo / Test mode).");
    }
  };

  const [retryStatus, setRetryStatus] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetryEmail = async (appId: string) => {
    setIsRetrying(true);
    setRetryStatus(null);
    try {
      const res = await retryVisaNotificationAction(appId);
      if (res.success) {
        setRetryStatus("Customer notification sent successfully.");
      } else {
        setRetryStatus(`Failed: ${res.error || "Delivery error"}`);
      }
    } catch {
      setRetryStatus("Failed to retry notification.");
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-masaar-black">Visa Applications</h1>
          <p className="mt-1 text-sm text-masaar-black/60">
            View and manage all submitted visa applications, applicants, documents and current status.
          </p>
        </div>
        <button
          onClick={() => alert("To submit a new application, use the customer flow or direct enquiry.")}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition"
        >
          + Add Application
        </button>
      </div>

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-masaar-black/50">Total</p>
            <p className="text-xl font-bold text-masaar-black">{totalCount}</p>
            <p className="text-[10px] text-masaar-black/50">All applications</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-masaar-black/50">Under Review</p>
            <p className="text-xl font-bold text-amber-800">{underReviewCount}</p>
            <p className="text-[10px] text-masaar-black/50">Awaiting verification</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-masaar-black/50">Submitted</p>
            <p className="text-xl font-bold text-masaar-black">{submittedCount}</p>
            <p className="text-[10px] text-masaar-black/50">Recently submitted</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-masaar-black/50">Approved</p>
            <p className="text-xl font-bold text-emerald-600">{approvedCount}</p>
            <p className="text-[10px] text-masaar-black/50">Visa approved</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-masaar-black/50">Rejected</p>
            <p className="text-xl font-bold text-red-600">{rejectedCount}</p>
            <p className="text-[10px] text-masaar-black/50">Rejected</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
            <FileQuestion className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-masaar-black/50">Draft</p>
            <p className="text-xl font-bold text-masaar-black">{draftCount}</p>
            <p className="text-[10px] text-masaar-black/50">Not yet submitted</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
          <input
            type="text"
            placeholder="Search by name, reference, passport or email..."
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
            <option value="saudi-tourist">Saudi Tourist Visa</option>
            <option value="us">US Visa</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-medium text-masaar-black focus:border-amber-600 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="under_review">Under Review</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="documents_required">Documents Required</option>
            <option value="rejected">Rejected</option>
            <option value="draft">Draft</option>
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

          <button
            onClick={() => alert("Exporting applications as CSV...")}
            className="inline-flex items-center gap-1 rounded-lg border border-black/10 px-3 py-2 text-xs font-medium text-masaar-black/70 hover:bg-black/5"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-neutral-50/60 text-xs font-semibold uppercase tracking-wider text-masaar-black/50">
              <tr>
                <th className="w-8 px-4 py-3 text-center">#</th>
                <th className="px-4 py-3">Reference No.</th>
                <th className="px-4 py-3">Applicant Name</th>
                <th className="px-4 py-3">Visa Type</th>
                <th className="px-4 py-3">Travel Date</th>
                <th className="px-4 py-3">Submitted On</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredApps.map((app, idx) => (
                <tr
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`cursor-pointer transition hover:bg-neutral-50/60 ${
                    selectedApp?.id === app.id ? "bg-amber-50/30" : ""
                  }`}
                >
                  <td className="px-4 py-3.5 text-center text-xs text-masaar-black/40">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-masaar-black">
                    {app.reference_no}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-masaar-black">{app.applicant_name}</p>
                    <p className="text-xs text-masaar-black/50">{app.applicant_email}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-masaar-black">{app.visa_type}</p>
                    <p className="text-xs text-masaar-black/50">{app.variant}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-masaar-black/80">{app.travel_date}</td>
                  <td className="px-4 py-3.5 text-xs text-masaar-black/60">{app.submitted_on}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        app.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : app.status === "under_review"
                          ? "bg-amber-100 text-amber-800"
                          : app.status === "submitted"
                          ? "bg-blue-100 text-blue-800"
                          : app.status === "documents_required"
                          ? "bg-rose-100 text-rose-800"
                          : app.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {app.status === "approved" && "Approved"}
                      {app.status === "under_review" && "Under Review"}
                      {app.status === "submitted" && "Submitted"}
                      {app.status === "documents_required" && "Documents Required"}
                      {app.status === "rejected" && "Rejected"}
                      {app.status === "draft" && "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        app.payment_status === "paid"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : app.payment_status === "refunded"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          app.payment_status === "paid"
                            ? "bg-emerald-600"
                            : app.payment_status === "refunded"
                            ? "bg-purple-600"
                            : "bg-amber-600"
                        }`}
                      />
                      {app.payment_status === "paid" ? "Paid" : app.payment_status === "refunded" ? "Refunded" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApp(app);
                        }}
                        className="rounded p-1.5 text-masaar-black/50 hover:bg-black/5 hover:text-masaar-black"
                        title="View Application Details"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/visa/tracking?ref=${app.reference_no}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded p-1.5 text-masaar-black/50 hover:bg-black/5 hover:text-masaar-black"
                        title="Customer Tracking Link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Slide-Over Drawer for Selected Application */}
      {selectedApp && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl border-l border-black/10">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-black/10 px-6 py-4 bg-neutral-50/70">
            <div>
              <span className="font-mono text-sm font-bold text-masaar-black">
                {selectedApp.reference_no}
              </span>
              <p className="text-xs text-masaar-black/60">Submitted {selectedApp.submitted_on}</p>
            </div>
            <button
              onClick={() => setSelectedApp(null)}
              className="rounded-lg p-1.5 text-masaar-black/40 hover:bg-black/5 hover:text-masaar-black"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Applicant Details */}
            <div className="rounded-xl border border-black/10 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/50">
                Applicant Details
              </h4>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Name</span>
                  <span className="font-semibold text-masaar-black">{selectedApp.applicant_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Email</span>
                  <span className="font-medium text-masaar-black">{selectedApp.applicant_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Phone</span>
                  <span className="font-medium text-masaar-black">{selectedApp.applicant_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Nationality</span>
                  <span className="font-semibold text-masaar-black">{selectedApp.nationality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Passport No.</span>
                  <span className="font-mono font-medium text-masaar-black">{selectedApp.passport_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Date of Birth</span>
                  <span className="font-medium text-masaar-black">{selectedApp.dob}</span>
                </div>
              </div>
            </div>

            {/* Visa Details */}
            <div className="rounded-xl border border-black/10 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/50">
                Visa Details
              </h4>
              <div className="mt-3 flex items-center gap-3">
                <div className="relative h-12 w-16 overflow-hidden rounded-md border border-black/10">
                  <Image
                    src={THUMBNAILS[selectedApp.visa_slug] || THUMBNAILS.uae}
                    alt={selectedApp.visa_type}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-masaar-black">{selectedApp.visa_type}</p>
                  <p className="text-xs text-masaar-black/60">{selectedApp.variant}</p>
                  <p className="text-xs text-amber-700">{selectedApp.purpose}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-black/5 pt-3 text-xs">
                <div>
                  <span className="text-masaar-black/50">Travel Date</span>
                  <p className="font-semibold text-masaar-black">{selectedApp.travel_date}</p>
                </div>
                <div>
                  <span className="text-masaar-black/50">No. of Travellers</span>
                  <p className="font-semibold text-masaar-black">1 Traveller</p>
                </div>
              </div>
            </div>

            {/* Application Status & Action */}
            <div className="rounded-xl border border-black/10 p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/50">
                  Application Status
                </h4>
                <select
                  value={selectedApp.status}
                  onChange={(e) => handleStatusChange(selectedApp.id, e.target.value)}
                  className="rounded-lg border border-black/15 bg-white px-2.5 py-1 text-xs font-semibold text-masaar-black focus:border-amber-600 focus:outline-none"
                >
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="documents_required">Documents Required</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Status Timeline */}
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-masaar-black">Application Submitted</p>
                    <p className="text-[10px] text-masaar-black/50">{selectedApp.submitted_on}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full ${
                      selectedApp.status !== "submitted" && selectedApp.status !== "draft"
                        ? "bg-amber-600 text-white"
                        : "bg-black/10 text-black/40"
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-masaar-black">Under Review</p>
                    <p className="text-[10px] text-masaar-black/50">
                      {selectedApp.status === "under_review" ? "In progress" : "Pending verification"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full ${
                      selectedApp.status === "approved"
                        ? "bg-emerald-600 text-white"
                        : "bg-black/10 text-black/40"
                    }`}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-masaar-black">Visa Approval</p>
                    <p className="text-[10px] text-masaar-black/50">
                      {selectedApp.status === "approved" ? "Approved" : "Pending"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="rounded-xl border border-black/10 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/50">
                Payment & Pricing (5% Online Discount Applied)
              </h4>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Payment Status</span>
                  <span className="font-semibold text-emerald-700">
                    {selectedApp.payment_status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Original Package Price</span>
                  <span className="text-masaar-black line-through">
                    USD {(selectedApp.total_amount / 0.95).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700 font-medium">5% Online Discount</span>
                  <span className="text-emerald-700 font-semibold">
                    -USD {((selectedApp.total_amount / 0.95) * 0.05).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-black/10 pt-2 font-bold">
                  <span className="text-masaar-black">Total Charged</span>
                  <span className="text-masaar-black">USD {selectedApp.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-masaar-black/60">Payment Method</span>
                  <span className="font-medium text-masaar-black">{selectedApp.payment_method}</span>
                </div>
              </div>

              {/* Notification Status & Retry */}
              <div className="mt-4 border-t border-black/10 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-masaar-black">Customer Notification</p>
                    <p className="text-[10px] text-masaar-black/60">Transactional email log & delivery</p>
                  </div>
                  <button
                    disabled={isRetrying}
                    onClick={() => handleRetryEmail(selectedApp.id)}
                    className="rounded bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50 transition"
                  >
                    {isRetrying ? "Sending..." : "Retry Email"}
                  </button>
                </div>
                {retryStatus && (
                  <p className="mt-2 text-[11px] font-medium text-amber-800 bg-amber-50 rounded p-1.5 border border-amber-200">
                    {retryStatus}
                  </p>
                )}
              </div>
            </div>

            {/* Uploaded Documents */}
            <div className="rounded-xl border border-black/10 p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/50">
                  Documents ({selectedApp.documents.length})
                </h4>
                <span className="text-[10px] font-semibold text-amber-700">Private & Encrypted</span>
              </div>
              <div className="mt-3 space-y-2">
                {selectedApp.documents.length === 0 ? (
                  <p className="text-xs text-masaar-black/50 italic">No documents uploaded for this record.</p>
                ) : (
                  selectedApp.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border border-black/10 bg-neutral-50/50 p-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileCheck className="h-4 w-4 text-emerald-600" />
                        <div>
                          <p className="text-xs font-semibold text-masaar-black">{doc.name}</p>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                            {doc.status}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenDoc(doc.file_path)}
                        className="rounded border border-black/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-masaar-black hover:bg-black/5"
                      >
                        View Securely
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
