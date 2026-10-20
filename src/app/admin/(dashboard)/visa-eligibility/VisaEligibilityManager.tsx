"use client";

import { useState } from "react";
import {
  HelpCircle,
  Plus,
  Trash2,
  Edit2,
  GitBranch,
  CheckCircle2,
  FileText,
  Upload,
  Check,
  ChevronDown,
  Info,
  Sparkles,
} from "@/components/admin/icons";
import { saveEligibilityConfig } from "./actions";

interface Question {
  id: string;
  order: number;
  label: string;
  type: string;
  required: boolean;
  helpText?: string;
  hasCondition?: boolean;
}

interface ConditionalRule {
  id: string;
  order: number;
  condition: string;
  action: "Show" | "Hide";
  appliesTo: string;
  active: boolean;
}

interface DocumentItem {
  id: string;
  order: number;
  name: string;
  type: "Mandatory" | "Conditional" | "Optional";
  requiredFor: string;
  conditionalRule: string;
  active: boolean;
}

const INITIAL_QUESTIONS: Question[] = [
  { id: "q1", order: 1, label: "Nationality", type: "Dropdown list of countries", required: true, helpText: "Select your nationality as per your passport." },
  { id: "q2", order: 2, label: "Country of Residence", type: "Dropdown list of countries", required: true, helpText: "Where do you currently legally reside?" },
  { id: "q3", order: 3, label: "Do you hold a valid residence visa for UAE?", type: "Yes / No", required: true, hasCondition: true },
  { id: "q4", order: 4, label: "Intended Travel Date", type: "Date picker", required: true },
  { id: "q5", order: 5, label: "Purpose of Visit", type: "Tourism / Visit family / Business / Other", required: true },
  { id: "q6", order: 6, label: "Intended Stay Duration", type: "Dropdown (based on product)", required: true },
  { id: "q7", order: 7, label: "Number of Travellers", type: "Numeric input", required: true },
  { id: "q8", order: 8, label: "Have you previously visited the UAE?", type: "Yes / No", required: false },
];

const INITIAL_RULES: ConditionalRule[] = [
  { id: "r1", order: 1, condition: "If Nationality = India", action: "Show", appliesTo: "Residence Visa Upload", active: true },
  { id: "r2", order: 2, condition: "If Residence Visa = No", action: "Hide", appliesTo: "UAE Residence Copy", active: true },
  { id: "r3", order: 3, condition: "If Stay Duration > 60 Days", action: "Show", appliesTo: "Additional Bank Statement", active: true },
  { id: "r4", order: 4, condition: "If Purpose = Visit Family", action: "Show", appliesTo: "Invitation Letter", active: true },
];

const INITIAL_DOCS: DocumentItem[] = [
  { id: "d1", order: 1, name: "Passport Copy", type: "Mandatory", requiredFor: "All Travellers", conditionalRule: "Always", active: true },
  { id: "d2", order: 2, name: "Recent Photograph", type: "Mandatory", requiredFor: "All Travellers", conditionalRule: "Always", active: true },
  { id: "d3", order: 3, name: "UAE Residence Visa Copy", type: "Conditional", requiredFor: "Non-UAE Nationals", conditionalRule: "If Residence Visa = Yes", active: true },
  { id: "d4", order: 4, name: "Return Flight Ticket", type: "Optional", requiredFor: "Recommended", conditionalRule: "Always", active: true },
  { id: "d5", order: 5, name: "Hotel Booking Proof", type: "Optional", requiredFor: "Recommended", conditionalRule: "Always", active: true },
];

export default function VisaEligibilityManager() {
  const [activeTab, setActiveTab] = useState<string>("questions");
  const [selectedVariant, setSelectedVariant] = useState("uae-30-single");
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [rules, setRules] = useState<ConditionalRule[]>(INITIAL_RULES);
  const [docs, setDocs] = useState<DocumentItem[]>(INITIAL_DOCS);

  // Selected for editing on right side
  const [activeQuestion, setActiveQuestion] = useState<Question>(INITIAL_QUESTIONS[0]);
  const [activeDoc, setActiveDoc] = useState<DocumentItem>(INITIAL_DOCS[0]);
  const [options, setOptions] = useState<string[]>(["India", "Pakistan", "Bangladesh", "United Kingdom", "United States"]);
  const [newOption, setNewOption] = useState("");
  const [saveToast, setSaveToast] = useState(false);

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    setOptions([...options, newOption.trim()]);
    setNewOption("");
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleToggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  };

  const handleToggleDoc = (id: string) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, active: !d.active } : d)));
  };

  const handleSaveAll = async () => {
    await saveEligibilityConfig(selectedVariant, { questions, rules, docs });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-masaar-black">Eligibility & Documents</h1>
          <p className="mt-1 text-sm text-masaar-black/60">
            Configure eligibility questions, rules and document requirements for online visa products.
          </p>
        </div>

        {/* Variant selector & Published Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-masaar-black/60">Select Product Variant</label>
            <div className="relative">
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                className="appearance-none rounded-lg border border-black/15 bg-white py-2 pl-3 pr-8 text-sm font-semibold text-masaar-black shadow-sm focus:border-amber-600 focus:outline-none"
              >
                <option value="uae-30-single">UAE Visa – 30 Days Single Entry</option>
                <option value="uae-30-multi">UAE Visa – 30 Days Multiple Entry</option>
                <option value="uae-60-single">UAE Visa – 60 Days Single Entry</option>
                <option value="uae-60-multi">UAE Visa – 60 Days Multiple Entry</option>
                <option value="saudi-30-single">Saudi Tourist Visa – 30 Days Single Entry</option>
                <option value="saudi-90-multi">Saudi Tourist Visa – 90 Days Multiple Entry</option>
                <option value="us-b1-b2">US Visa – B1/B2 Tourist Visa</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/50" />
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Published
          </span>
          <button
            onClick={handleSaveAll}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition"
          >
            Save Configuration
          </button>
        </div>
      </div>

      {saveToast && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Eligibility rules and document checklist successfully saved for {selectedVariant}!
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-black/10">
        {[
          { key: "questions", label: "Eligibility Questions" },
          { key: "documents", label: "Document Checklist" },
          { key: "rules", label: "Validation Rules" },
          { key: "preview", label: "Preview Flow" },
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

      {/* Main 2-column Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): Questions, Conditional Rules, Document Checklist */}
        <div className="space-y-6 lg:col-span-7">
          {/* Section 1: Eligibility Questions */}
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-masaar-black">Eligibility Questions</h3>
                <p className="text-xs text-masaar-black/60">
                  Collect traveller details to determine product eligibility and show the correct document requirements.
                </p>
              </div>
              <button
                onClick={() => {
                  const newQ: Question = {
                    id: `q-${Date.now()}`,
                    order: questions.length + 1,
                    label: "New Question",
                    type: "Dropdown list",
                    required: true,
                  };
                  setQuestions([...questions, newQ]);
                  setActiveQuestion(newQ);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-500/20"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Question
              </button>
            </div>

            <div className="space-y-2">
              {questions.map((q) => (
                <div
                  key={q.id}
                  onClick={() => setActiveQuestion(q)}
                  className={`flex items-center justify-between rounded-lg border p-3 transition cursor-pointer ${
                    activeQuestion.id === q.id
                      ? "border-amber-600/50 bg-amber-50/20 shadow-sm"
                      : "border-black/5 bg-neutral-50/40 hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-black/5 text-xs font-bold text-masaar-black/70">
                      {q.order}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-masaar-black">{q.label}</p>
                      <p className="text-xs text-masaar-black/50">{q.type}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {q.hasCondition && (
                      <span className="rounded p-1 text-black/40" title="Has conditional logic">
                        <GitBranch className="h-3.5 w-3.5 text-amber-600" />
                      </span>
                    )}
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        q.required ? "bg-amber-100 text-amber-800" : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {q.required ? "Required" : "Optional"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveQuestion(q);
                      }}
                      className="rounded p-1 text-black/40 hover:text-black"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuestions(questions.filter((item) => item.id !== q.id));
                      }}
                      className="rounded p-1 text-black/40 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Conditional Rules */}
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-masaar-black">Conditional Rules</h3>
                <p className="text-xs text-masaar-black/60">
                  Show or hide questions and documents based on traveller's answers.
                </p>
              </div>
              <button
                onClick={() => {
                  const newRule: ConditionalRule = {
                    id: `r-${Date.now()}`,
                    order: rules.length + 1,
                    condition: "If Nationality = UK",
                    action: "Show",
                    appliesTo: "Fast-track Option",
                    active: true,
                  };
                  setRules([...rules, newRule]);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-500/20"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Rule
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-black/5 bg-neutral-50/60 font-semibold text-masaar-black/50 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Condition</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Applies To</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {rules.map((r, i) => (
                    <tr key={r.id} className="hover:bg-neutral-50/50">
                      <td className="py-2 px-3 text-masaar-black/40">{i + 1}</td>
                      <td className="py-2 px-3 font-medium text-masaar-black">{r.condition}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            r.action === "Show" ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-800"
                          }`}
                        >
                          {r.action}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-masaar-black/70">{r.appliesTo}</td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => handleToggleRule(r.id)}
                          className={`h-4 w-7 rounded-full p-0.5 transition ${
                            r.active ? "bg-emerald-600" : "bg-neutral-300"
                          }`}
                        >
                          <div
                            className={`h-3 w-3 rounded-full bg-white transition transform ${
                              r.active ? "translate-x-3" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => setRules(rules.filter((rule) => rule.id !== r.id))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Document Checklist */}
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-masaar-black">Document Checklist</h3>
                <p className="text-xs text-masaar-black/60">
                  Define required, conditional and optional documents for this product.
                </p>
              </div>
              <button
                onClick={() => {
                  const newDoc: DocumentItem = {
                    id: `d-${Date.now()}`,
                    order: docs.length + 1,
                    name: "Additional Document",
                    type: "Optional",
                    requiredFor: "Recommended",
                    conditionalRule: "Always",
                    active: true,
                  };
                  setDocs([...docs, newDoc]);
                  setActiveDoc(newDoc);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-500/20"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Document
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-black/5 bg-neutral-50/60 font-semibold text-masaar-black/50 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Document</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Required For</th>
                    <th className="py-2.5 px-3">Conditional Rule</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {docs.map((d, i) => (
                    <tr
                      key={d.id}
                      onClick={() => setActiveDoc(d)}
                      className={`cursor-pointer transition ${
                        activeDoc.id === d.id ? "bg-amber-50/30" : "hover:bg-neutral-50/50"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-masaar-black/40">{i + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-masaar-black">{d.name}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            d.type === "Mandatory"
                              ? "bg-rose-100 text-rose-800"
                              : d.type === "Conditional"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {d.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-masaar-black/70">{d.requiredFor}</td>
                      <td className="py-2.5 px-3 text-masaar-black/60">{d.conditionalRule}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleDoc(d.id);
                          }}
                          className={`h-4 w-7 rounded-full p-0.5 transition ${
                            d.active ? "bg-emerald-600" : "bg-neutral-300"
                          }`}
                        >
                          <div
                            className={`h-3 w-3 rounded-full bg-white transition transform ${
                              d.active ? "translate-x-3" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDoc(d);
                            }}
                            className="rounded p-1 text-black/40 hover:text-black"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDocs(docs.filter((item) => item.id !== d.id));
                            }}
                            className="rounded p-1 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Question Settings & Document Settings */}
        <div className="space-y-6 lg:col-span-5">
          {/* Question Settings Card */}
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-masaar-black">Question Settings</h3>
            <p className="text-xs text-masaar-black/60">
              Editing: <span className="font-semibold text-amber-700">{activeQuestion.label}</span>
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-masaar-black/70">Question Type</label>
                <select
                  value={activeQuestion.type.includes("Dropdown") ? "Dropdown" : "Text"}
                  onChange={(e) =>
                    setActiveQuestion({ ...activeQuestion, type: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                >
                  <option value="Dropdown">Dropdown</option>
                  <option value="Text">Text Input</option>
                  <option value="Yes / No">Yes / No Toggle</option>
                  <option value="Date picker">Date picker</option>
                  <option value="Numeric input">Numeric input</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-masaar-black/70">
                  Question Label <span className="text-red-500">*</span>
                </label>
                <input
                  value={activeQuestion.label}
                  onChange={(e) => {
                    const next = { ...activeQuestion, label: e.target.value };
                    setActiveQuestion(next);
                    setQuestions(questions.map((q) => (q.id === activeQuestion.id ? next : q)));
                  }}
                  className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-masaar-black/70">Help Text</label>
                <input
                  value={activeQuestion.helpText || ""}
                  onChange={(e) => {
                    const next = { ...activeQuestion, helpText: e.target.value };
                    setActiveQuestion(next);
                    setQuestions(questions.map((q) => (q.id === activeQuestion.id ? next : q)));
                  }}
                  placeholder="Additional guidance for traveller"
                  className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                />
              </div>

              {/* Options list if dropdown */}
              <div>
                <label className="block text-xs font-semibold text-masaar-black/70">Options</label>
                <div className="mt-1 space-y-1.5">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-black/10 px-3 py-1.5 text-xs bg-neutral-50/50">
                      <span>{opt}</span>
                      <button
                        onClick={() => handleRemoveOption(idx)}
                        className="text-black/40 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex gap-2">
                  <input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="New option name"
                    className="flex-1 rounded-lg border border-black/15 px-3 py-1.5 text-xs focus:border-amber-600 focus:outline-none"
                  />
                  <button
                    onClick={handleAddOption}
                    type="button"
                    className="rounded-lg bg-black/5 px-3 py-1.5 text-xs font-semibold text-masaar-black hover:bg-black/10"
                  >
                    + Add Option
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-masaar-black cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeQuestion.required}
                    onChange={(e) => {
                      const next = { ...activeQuestion, required: e.target.checked };
                      setActiveQuestion(next);
                      setQuestions(questions.map((q) => (q.id === activeQuestion.id ? next : q)));
                    }}
                    className="h-4 w-4 rounded border-black/20 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Required Field</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-masaar-black cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    className="h-4 w-4 rounded border-black/20 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Show in Summary</span>
                </label>
              </div>
            </div>
          </div>

          {/* Document Settings Card */}
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-masaar-black">Document Settings</h3>
            <p className="text-xs text-masaar-black/60">
              Editing: <span className="font-semibold text-amber-700">{activeDoc.name}</span>
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-masaar-black/70">
                  Document Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={activeDoc.name}
                  onChange={(e) => {
                    const next = { ...activeDoc, name: e.target.value };
                    setActiveDoc(next);
                    setDocs(docs.map((d) => (d.id === activeDoc.id ? next : d)));
                  }}
                  className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-masaar-black/70">Document Type</label>
                  <select
                    value={activeDoc.type}
                    onChange={(e) => {
                      const next = { ...activeDoc, type: e.target.value as any };
                      setActiveDoc(next);
                      setDocs(docs.map((d) => (d.id === activeDoc.id ? next : d)));
                    }}
                    className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs focus:border-amber-600 focus:outline-none"
                  >
                    <option value="Mandatory">Mandatory</option>
                    <option value="Conditional">Conditional</option>
                    <option value="Optional">Optional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-masaar-black/70">Applies To</label>
                  <select
                    value={activeDoc.requiredFor}
                    onChange={(e) => {
                      const next = { ...activeDoc, requiredFor: e.target.value };
                      setActiveDoc(next);
                      setDocs(docs.map((d) => (d.id === activeDoc.id ? next : d)));
                    }}
                    className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs focus:border-amber-600 focus:outline-none"
                  >
                    <option value="All Travellers">All Travellers</option>
                    <option value="Non-UAE Nationals">Non-UAE Nationals</option>
                    <option value="Recommended">Recommended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-masaar-black/70">Conditional Rule</label>
                <select
                  value={activeDoc.conditionalRule}
                  onChange={(e) => {
                    const next = { ...activeDoc, conditionalRule: e.target.value };
                    setActiveDoc(next);
                    setDocs(docs.map((d) => (d.id === activeDoc.id ? next : d)));
                  }}
                  className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs focus:border-amber-600 focus:outline-none"
                >
                  <option value="Always">Always Required</option>
                  <option value="If Residence Visa = Yes">If Residence Visa = Yes</option>
                  <option value="If Stay Duration > 60 Days">If Stay Duration &gt; 60 Days</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-masaar-black/70">Accepted File Types</label>
                  <div className="mt-1 flex gap-1">
                    {["JPG", "PNG", "PDF"].map((ext) => (
                      <span key={ext} className="rounded bg-black/5 px-2 py-1 text-[11px] font-semibold text-masaar-black">
                        {ext}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-masaar-black/70">Max File Size (MB)</label>
                  <input
                    defaultValue={5}
                    type="number"
                    className="mt-1 w-full rounded-lg border border-black/15 px-3 py-1.5 text-xs focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-masaar-black/70">
                  Instructions for Traveller
                </label>
                <textarea
                  rows={3}
                  defaultValue="Upload a clear colour copy of your passport. The passport must be valid for at least 6 months from the date of travel."
                  className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-xs focus:border-amber-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
