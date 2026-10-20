"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ExternalLink,
  Save,
  CheckCircle2,
  Edit2,
  Plus,
  Trash2,
  ChevronDown,
  ShieldCheck,
  FileText,
  Clock,
  Headphones,
  Check,
  AlertCircle,
  Eye,
  Copy,
  Lock,
} from "@/components/admin/icons";
import { saveVisaLandingContent } from "./actions";

export default function VisaLandingEditor() {
  const [activeTab, setActiveTab] = useState<string>("content");
  const [isPublished, setIsPublished] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Content state
  const [heroHeadline, setHeroHeadline] = useState("Your Global Journey Starts Here");
  const [heroIntro, setHeroIntro] = useState(
    "Simple and reliable visa assistance for the UAE, Saudi Arabia, United States and more."
  );
  const [pageTitle, setPageTitle] = useState("Visa Services | Masaar Holidays");
  const [metaDescription, setMetaDescription] = useState(
    "Apply for UAE, Saudi, US and global visas with Masaar Holidays. Simple process, document support and reliable assistance."
  );
  const [focusKeyword, setFocusKeyword] = useState("visa services");
  const [whatsappNumber, setWhatsappNumber] = useState("+971 50 123 4567");

  // Editing modals/panels
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const handleSave = () => {
    startTransition(async () => {
      await saveVisaLandingContent({
        heroHeadline,
        heroIntro,
        pageTitle,
        metaDescription,
        focusKeyword,
        whatsappNumber,
        isPublished,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-masaar-black">Landing Page Content</h1>
          <p className="mt-1 text-sm text-masaar-black/60">
            Manage content for the main Visa landing page. Keep other cross-service sections (Umrah, Hajj, Hotels, Transfers) intact.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/visa"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3.5 py-2 text-sm font-semibold text-masaar-black hover:bg-black/5 transition"
          >
            <ExternalLink className="h-4 w-4" />
            View on Website
          </Link>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50 transition"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Landing page changes successfully saved and cached routes updated!
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-black/10">
        {[
          { key: "content", label: "Page Content" },
          { key: "seo", label: "SEO" },
          { key: "ctas", label: "CTAs" },
          { key: "settings", label: "Settings" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`border-b-2 px-5 py-3 text-sm font-semibold transition ${
              activeTab === t.key
                ? "border-amber-600 text-amber-700"
                : "border-transparent text-masaar-black/60 hover:text-masaar-black"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): Visual Sections */}
        <div className="space-y-6 lg:col-span-8">
          {/* 1. Hero Section */}
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-masaar-black">1. Hero Section</h3>
                <p className="text-xs text-masaar-black/60">
                  Main banner, headline and description for the visa landing page.
                </p>
              </div>
              <button
                onClick={() => setEditingSection(editingSection === "hero" ? null : "hero")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-masaar-black hover:bg-black/5"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Edit Section
              </button>
            </div>

            {editingSection === "hero" ? (
              <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/30 p-4">
                <div>
                  <label className="block text-xs font-semibold text-masaar-black/70">Headline</label>
                  <input
                    value={heroHeadline}
                    onChange={(e) => setHeroHeadline(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-masaar-black/70">Introduction</label>
                  <textarea
                    rows={2}
                    value={heroIntro}
                    onChange={(e) => setHeroIntro(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setEditingSection(null)}
                    className="rounded-lg bg-masaar-black px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#C9A227]/20 via-[#C9A227]/10 to-transparent p-6 border border-amber-600/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  VISA SERVICES
                </span>
                <h2 className="mt-1 text-2xl font-bold text-masaar-black font-editorial">
                  {heroHeadline}
                </h2>
                <p className="mt-2 text-xs text-masaar-black/70 max-w-md">{heroIntro}</p>
                <div className="mt-4 flex gap-3">
                  <span className="rounded bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white">
                    Apply for a Visa
                  </span>
                  <span className="rounded border border-black/20 bg-white px-3 py-1.5 text-xs font-semibold text-masaar-black">
                    Enquire on WhatsApp
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Visa Service Cards */}
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-masaar-black">2. Visa Service Cards</h3>
                <p className="text-xs text-masaar-black/60">
                  Manage the visa services displayed on the landing page.
                </p>
              </div>
              <Link
                href="/admin/visa-types"
                className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-masaar-black hover:bg-black/5"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Manage in Visa Services
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { name: "UAE Visa", tag: "Online", desc: "Tourism, visit and business visa assistance." },
                { name: "Saudi Tourist Visa", tag: "Online", desc: "Travel to Saudi Arabia for tourism and leisure." },
                { name: "US Visa", tag: "Online", desc: "Tourist, business and student visa assistance." },
                { name: "Global Visa Assistance", tag: "Enquiry", desc: "Assistance for multiple countries worldwide." },
              ].map((card, i) => (
                <div key={i} className="rounded-lg border border-black/10 bg-neutral-50/50 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-masaar-black">{card.name}</span>
                    <span
                      className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                        card.tag === "Online" ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-800"
                      }`}
                    >
                      {card.tag}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-masaar-black/60">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Why Choose Us */}
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-masaar-black">3. Why Choose Us</h3>
                <p className="text-xs text-masaar-black/60">
                  Key reasons to build trust and show your value.
                </p>
              </div>
              <button
                onClick={() => alert("Value propositions are dynamically editable.")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-masaar-black hover:bg-black/5"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Edit Section
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
              <div className="rounded-lg border border-black/5 bg-neutral-50/60 p-3">
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="mt-2 text-xs font-bold text-masaar-black">Expert Guidance</p>
                <p className="mt-0.5 text-[10px] text-masaar-black/60">Step-by-step support through the process</p>
              </div>

              <div className="rounded-lg border border-black/5 bg-neutral-50/60 p-3">
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <FileText className="h-4 w-4" />
                </div>
                <p className="mt-2 text-xs font-bold text-masaar-black">Document Assistance</p>
                <p className="mt-0.5 text-[10px] text-masaar-black/60">Clear checklist and verification support</p>
              </div>

              <div className="rounded-lg border border-black/5 bg-neutral-50/60 p-3">
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <Clock className="h-4 w-4" />
                </div>
                <p className="mt-2 text-xs font-bold text-masaar-black">Fast & Reliable</p>
                <p className="mt-0.5 text-[10px] text-masaar-black/60">Hassle-free and timely processing</p>
              </div>

              <div className="rounded-lg border border-black/5 bg-neutral-50/60 p-3">
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <Headphones className="h-4 w-4" />
                </div>
                <p className="mt-2 text-xs font-bold text-masaar-black">Dedicated Support</p>
                <p className="mt-0.5 text-[10px] text-masaar-black/60">Our team is here to help you</p>
              </div>
            </div>
          </div>

          {/* 4. How It Works */}
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-masaar-black">4. How It Works</h3>
                <p className="text-xs text-masaar-black/60">Simple steps to apply for a visa.</p>
              </div>
              <button
                onClick={() => alert("Workflow steps are managed.")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-masaar-black hover:bg-black/5"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Edit Section
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="rounded-lg bg-amber-50/30 p-2.5">
                <span className="flex h-5 w-5 mx-auto items-center justify-center rounded-full bg-amber-100 font-bold text-amber-800 text-[10px]">1</span>
                <p className="mt-1 font-semibold text-masaar-black">Choose Visa</p>
                <p className="text-[10px] text-masaar-black/50">Select destination & type</p>
              </div>
              <div className="rounded-lg bg-amber-50/30 p-2.5">
                <span className="flex h-5 w-5 mx-auto items-center justify-center rounded-full bg-amber-100 font-bold text-amber-800 text-[10px]">2</span>
                <p className="mt-1 font-semibold text-masaar-black">Fill Details</p>
                <p className="text-[10px] text-masaar-black/50">Details & document upload</p>
              </div>
              <div className="rounded-lg bg-amber-50/30 p-2.5">
                <span className="flex h-5 w-5 mx-auto items-center justify-center rounded-full bg-amber-100 font-bold text-amber-800 text-[10px]">3</span>
                <p className="mt-1 font-semibold text-masaar-black">Review & Pay</p>
                <p className="text-[10px] text-masaar-black/50">Secure Stripe payment</p>
              </div>
              <div className="rounded-lg bg-amber-50/30 p-2.5">
                <span className="flex h-5 w-5 mx-auto items-center justify-center rounded-full bg-amber-100 font-bold text-amber-800 text-[10px]">4</span>
                <p className="mt-1 font-semibold text-masaar-black">Get Visa</p>
                <p className="text-[10px] text-masaar-black/50">We process and deliver</p>
              </div>
            </div>
          </div>

          {/* Protected Cross-Service Notice Rule */}
          <div className="rounded-xl border border-amber-600/30 bg-amber-50/40 p-4 flex items-start gap-3">
            <Lock className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-900">
                Protected Section: “Thoughtful Services for Every Part of Your Journey”
              </p>
              <p className="text-xs text-amber-800/80 mt-0.5">
                This global section links to Umrah, Hajj, Hotels, Transfers, eSIM, and Private Trips. In accordance with system preservation guidelines, it remains untouched on the live visa landing page.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Page Settings & SEO */}
        <div className="space-y-6 lg:col-span-4">
          {/* Page Status */}
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/50">
              Page Status
            </h4>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-masaar-black">
                  {isPublished ? "Published" : "Draft"}
                </p>
                <p className="text-[11px] text-masaar-black/60">
                  {isPublished ? "This page is live on the website." : "Hidden from public view."}
                </p>
              </div>
              <button
                onClick={() => setIsPublished(!isPublished)}
                className={`h-5 w-9 rounded-full p-0.5 transition ${
                  isPublished ? "bg-emerald-600" : "bg-neutral-300"
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full bg-white transition transform ${
                    isPublished ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Page Information */}
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/50">
              Page Information
            </h4>
            <div>
              <label className="block text-xs font-semibold text-masaar-black/70">
                Page Title <span className="text-red-500">*</span>
              </label>
              <input
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-xs focus:border-amber-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-masaar-black/70">URL Slug</label>
              <input
                defaultValue="visa"
                disabled
                className="mt-1 w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-xs text-masaar-black/50"
              />
              <span className="text-[10px] text-masaar-black/40">https://masaarholidays.com/visa</span>
            </div>
          </div>

          {/* SEO Settings */}
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/50">
              SEO Settings
            </h4>
            <div>
              <div className="flex justify-between text-xs font-semibold text-masaar-black/70">
                <span>Meta Title</span>
                <span className="text-masaar-black/40">{pageTitle.length}/60</span>
              </div>
              <input
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-xs focus:border-amber-600 focus:outline-none"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-masaar-black/70">
                <span>Meta Description</span>
                <span className="text-masaar-black/40">{metaDescription.length}/160</span>
              </div>
              <textarea
                rows={3}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-xs focus:border-amber-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-masaar-black/70">Focus Keyword</label>
              <input
                value={focusKeyword}
                onChange={(e) => setFocusKeyword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-xs focus:border-amber-600 focus:outline-none"
              />
            </div>
          </div>

          {/* CTA Settings */}
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/50">
              CTA Settings
            </h4>
            <div>
              <label className="block text-xs font-semibold text-masaar-black/70">Primary CTA</label>
              <select className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs focus:border-amber-600 focus:outline-none">
                <option>Apply for a Visa (Online)</option>
                <option>View All Visa Services</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-masaar-black/70">Secondary CTA</label>
              <select className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs focus:border-amber-600 focus:outline-none">
                <option>WhatsApp Enquiry</option>
                <option>Call Specialist</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-masaar-black/70">WhatsApp Number</label>
              <input
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-xs focus:border-amber-600 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
