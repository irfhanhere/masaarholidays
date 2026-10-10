"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  toggleVehicleActive,
  saveVehicle,
} from "./actions";

export interface VehicleItem {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  slug?: string | null;
  vehicle_type?: string | null;
  model_year?: string | null;
  description?: string | null;
  detailed_description?: string | null;
  image_url?: string | null;
  passenger_capacity?: number | null;
  luggage_capacity?: number | null;
  features?: string[] | null;
  spec_verified?: boolean | null;
}

const APPROVED_VEHICLE_ASSETS = [
  { label: "Toyota Camry (Sedan)", url: "/vehicles/TOYOTA CAMERY.webp" },
  { label: "Hyundai Staria (MPV)", url: "/vehicles/Hyundai Staria.webp" },
  { label: "GMC Yukon XL (Luxury SUV)", url: "/vehicles/gmc-yukon-suburban.webp" },
  { label: "Toyota Hiace Grand Cabin (Van)", url: "/vehicles/Toyota Hiace Grand Cabin.webp" },
  { label: "Toyota Coaster (Coach)", url: "/vehicles/Toyota Coaster.webp" },
  { label: "GMC Yukon Alternate", url: "/vehicles/GMC Yukon.jpg" },
  { label: "Sedan Alternate", url: "/vehicles/sedan.jpg" },
  { label: "Staria Alternate", url: "/vehicles/staria.jpg" },
];

export function VehiclesManagerClient({
  initialVehicles,
  totalRoutesCount,
}: {
  initialVehicles: VehicleItem[];
  totalRoutesCount: number;
}) {
  const [vehicles, setVehicles] = useState<VehicleItem[]>(initialVehicles);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [editingVehicle, setEditingVehicle] = useState<VehicleItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states for editor
  const [editName, setEditName] = useState("");
  const [editModelYear, setEditModelYear] = useState("");
  const [editShortDesc, setEditShortDesc] = useState("");
  const [editDetailedDesc, setEditDetailedDesc] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editPassengers, setEditPassengers] = useState(3);
  const [editLuggage, setEditLuggage] = useState(3);
  const [editFeatures, setEditFeatures] = useState<string[]>([]);
  const [newFeatureInput, setNewFeatureInput] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editDisplayOrder, setEditDisplayOrder] = useState(1);

  // Filtered vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(search.toLowerCase())) ||
      (v.vehicle_type && v.vehicle_type.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && v.is_active) ||
      (statusFilter === "inactive" && !v.is_active);

    return matchesSearch && matchesStatus;
  });

  const totalCount = vehicles.length;
  const activeCount = vehicles.filter((v) => v.is_active).length;
  const inactiveCount = vehicles.filter((v) => !v.is_active).length;

  const startEdit = (v: VehicleItem) => {
    setEditingVehicle(v);
    setIsAddingNew(false);
    setEditName(v.name);
    setEditModelYear(v.model_year || "2023 – 2026");
    setEditShortDesc(v.description || "");
    setEditDetailedDesc(v.detailed_description || "");
    setEditImageUrl(v.image_url || "/vehicles/TOYOTA CAMERY.webp");
    setEditPassengers(v.passenger_capacity ?? 3);
    setEditLuggage(v.luggage_capacity ?? 3);
    setEditFeatures(v.features && v.features.length > 0 ? v.features : ["Air-conditioned", "Professional driver"]);
    setEditIsActive(v.is_active);
    setEditDisplayOrder(v.display_order);

    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const startAddNew = () => {
    setIsAddingNew(true);
    setEditingVehicle(null);
    setEditName("");
    setEditModelYear("2024 – 2026");
    setEditShortDesc("");
    setEditDetailedDesc("");
    setEditImageUrl("/vehicles/TOYOTA CAMERY.webp");
    setEditPassengers(4);
    setEditLuggage(3);
    setEditFeatures(["Air-conditioned", "Professional driver", "Clean interior"]);
    setEditIsActive(true);
    setEditDisplayOrder(vehicles.length + 1);

    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingVehicle(null);
    setIsAddingNew(false);
  };

  const handleToggleActive = (id: string, current: boolean) => {
    startTransition(async () => {
      const res = await toggleVehicleActive(id, !current);
      if (res.success) {
        setVehicles((prev) =>
          prev.map((v) => (v.id === id ? { ...v, is_active: !current } : v))
        );
        setNotification({ type: "success", text: `Vehicle status updated to ${!current ? "Active" : "Inactive"}.` });
      } else {
        setNotification({ type: "error", text: res.error || "Failed to update status." });
      }
      setTimeout(() => setNotification(null), 4000);
    });
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setNotification({ type: "error", text: "Vehicle name is required." });
      return;
    }

    const formData = new FormData();
    if (editingVehicle) {
      formData.append("id", editingVehicle.id);
    }
    formData.append("name", editName.trim());
    formData.append("model_year", editModelYear.trim());
    formData.append("short_description", editShortDesc.trim());
    formData.append("detailed_description", editDetailedDesc.trim());
    formData.append("image_url", editImageUrl.trim());
    formData.append("passenger_capacity", String(editPassengers));
    formData.append("luggage_capacity", String(editLuggage));
    formData.append("features", JSON.stringify(editFeatures));
    formData.append("is_active", String(editIsActive));
    formData.append("display_order", String(editDisplayOrder));

    startTransition(async () => {
      const res = await saveVehicle(formData);
      if (res.success) {
        setNotification({ type: "success", text: "Vehicle details saved successfully!" });
        if (editingVehicle) {
          setVehicles((prev) =>
            prev.map((v) =>
              v.id === editingVehicle.id
                ? {
                    ...v,
                    name: editName,
                    model_year: editModelYear,
                    description: editShortDesc,
                    detailed_description: editDetailedDesc,
                    image_url: editImageUrl,
                    passenger_capacity: editPassengers,
                    luggage_capacity: editLuggage,
                    features: editFeatures,
                    is_active: editIsActive,
                    display_order: editDisplayOrder,
                  }
                : v
            )
          );
        } else {
          setVehicles((prev) => [
            ...prev,
            {
              id: "temp-" + Date.now(),
              name: editName,
              model_year: editModelYear,
              description: editShortDesc,
              detailed_description: editDetailedDesc,
              image_url: editImageUrl,
              passenger_capacity: editPassengers,
              luggage_capacity: editLuggage,
              features: editFeatures,
              is_active: editIsActive,
              display_order: editDisplayOrder,
            },
          ]);
        }
        setEditingVehicle(null);
        setIsAddingNew(false);
      } else {
        setNotification({ type: "error", text: res.error || "Failed to save vehicle." });
      }
      setTimeout(() => setNotification(null), 4000);
    });
  };

  const addFeature = () => {
    if (!newFeatureInput.trim()) return;
    if (!editFeatures.includes(newFeatureInput.trim())) {
      setEditFeatures([...editFeatures, newFeatureInput.trim()]);
    }
    setNewFeatureInput("");
  };

  const removeFeature = (idx: number) => {
    setEditFeatures(editFeatures.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed right-6 top-20 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            notification.type === "success"
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {notification.type === "success" ? (
            <svg className="size-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="size-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Top Banner / Breadcrumb & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-masaar-black/50">
            <Link href="/admin" className="hover:underline">Dashboard</Link>
            <span>›</span>
            <Link href="/admin/transfers" className="hover:underline">Transfers</Link>
            <span>›</span>
            <span className="font-semibold text-masaar-black">Vehicles & Fleet</span>
          </div>
          <h1 className="mt-1 font-serif text-3xl font-bold text-masaar-black">Vehicles & Fleet</h1>
          <p className="mt-1 text-sm text-masaar-black/60">
            Manage the vehicle types used for transfers. These vehicles can be assigned to routes in the Rate Card.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/transfers/rate-card"
            className="flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3.5 py-2 text-sm font-medium text-masaar-black transition hover:bg-black/5"
          >
            <span>Rate Card Matrix</span>
          </Link>
          <button
            onClick={startAddNew}
            className="flex items-center gap-1.5 rounded-lg bg-pure-gold px-4 py-2 text-sm font-semibold text-masaar-black shadow-sm transition hover:bg-pure-gold/90"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-masaar-black">{totalCount}</p>
              <p className="text-xs text-masaar-black/55">Total Vehicles</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-masaar-black">{activeCount}</p>
              <p className="text-xs text-masaar-black/55">Active Vehicles</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-masaar-black">{inactiveCount}</p>
              <p className="text-xs text-masaar-black/55">Inactive Vehicles</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-masaar-black">{totalRoutesCount}</p>
              <p className="text-xs text-masaar-black/55">Used in Routes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-masaar-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vehicles by name, type, or description..."
            className="w-full rounded-lg border border-black/15 bg-white py-2 pl-10 pr-4 text-sm text-masaar-black outline-hidden focus:border-pure-gold focus:ring-1 focus:ring-pure-gold"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-masaar-black outline-hidden focus:border-pure-gold focus:ring-1 focus:ring-pure-gold"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {(search || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className="flex items-center gap-1 rounded-lg border border-black/10 px-3 py-2 text-xs font-medium text-masaar-black/60 hover:bg-black/5"
            >
              <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 bg-black/2 text-xs font-semibold uppercase tracking-wider text-masaar-black/60">
              <tr>
                <th className="px-4 py-3 text-center">#</th>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Vehicle Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-center">Passengers</th>
                <th className="px-4 py-3 text-center">Luggage</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Order</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-masaar-black/50">
                    No vehicles match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle, idx) => {
                  const imageSrc = vehicle.image_url || "/vehicles/TOYOTA CAMERY.webp";
                  return (
                    <tr
                      key={vehicle.id}
                      className={`transition-colors hover:bg-black/[0.015] ${
                        editingVehicle?.id === vehicle.id ? "bg-amber-50/50" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center text-xs font-medium text-masaar-black/40">
                        {idx + 1}
                      </td>

                      {/* Vehicle Image Thumbnail */}
                      <td className="px-4 py-3.5">
                        <div className="relative size-16 overflow-hidden rounded-lg border border-black/10 bg-white p-1">
                          <Image
                            src={imageSrc}
                            alt={vehicle.name}
                            fill
                            className="object-contain"
                            sizes="64px"
                          />
                        </div>
                      </td>

                      {/* Name & Model Year */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-masaar-black">{vehicle.name}</div>
                        <div className="text-xs text-masaar-black/50">
                          {vehicle.model_year || "2023 – 2026"}
                          {vehicle.vehicle_type ? ` • ${vehicle.vehicle_type}` : ""}
                        </div>
                      </td>

                      {/* Description */}
                      <td className="max-w-xs px-4 py-3.5 text-xs text-masaar-black/70">
                        <p className="line-clamp-2">
                          {vehicle.description || "No description configured yet."}
                        </p>
                      </td>

                      {/* Passengers */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                          <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>{vehicle.passenger_capacity ?? 3}</span>
                        </span>
                      </td>

                      {/* Luggage */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                          <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>{vehicle.luggage_capacity ?? 3}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleToggleActive(vehicle.id, vehicle.is_active)}
                          disabled={isPending}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                            vehicle.is_active
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              vehicle.is_active ? "bg-emerald-500" : "bg-gray-400"
                            }`}
                          />
                          <span>{vehicle.is_active ? "Active" : "Inactive"}</span>
                        </button>
                      </td>

                      {/* Display Order */}
                      <td className="px-4 py-3.5 text-center text-xs font-medium text-masaar-black/70">
                        {vehicle.display_order}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => startEdit(vehicle)}
                            title="Edit Vehicle"
                            className="rounded-md border border-black/10 p-1.5 text-masaar-black/70 transition hover:bg-black/5 hover:text-masaar-black"
                          >
                            <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              startAddNew();
                              setEditName(`${vehicle.name} (Copy)`);
                              setEditShortDesc(vehicle.description || "");
                              setEditImageUrl(vehicle.image_url || "/vehicles/TOYOTA CAMERY.webp");
                              setEditPassengers(vehicle.passenger_capacity ?? 3);
                              setEditLuggage(vehicle.luggage_capacity ?? 3);
                            }}
                            title="Duplicate"
                            className="rounded-md border border-black/10 p-1.5 text-masaar-black/70 transition hover:bg-black/5 hover:text-masaar-black"
                          >
                            <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit or Add Vehicle Form Panel (Matches ADMIN - Vehicle manager.png layout) */}
      {(editingVehicle || isAddingNew) && (
        <div className="rounded-xl border-2 border-pure-gold/30 bg-white p-6 shadow-md">
          <div className="mb-6 flex items-center justify-between border-b border-black/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
                </svg>
              </span>
              <h2 className="font-serif text-xl font-bold text-masaar-black">
                {isAddingNew ? "Add New Vehicle to Fleet" : `Edit Vehicle: ${editingVehicle?.name}`}
              </h2>
            </div>
            <button
              onClick={cancelEdit}
              className="text-xs font-medium text-masaar-black/60 hover:text-masaar-black hover:underline"
            >
              ← Back to List
            </button>
          </div>

          <form onSubmit={handleSaveForm} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left Column: Vehicle Image & Selection */}
              <div className="lg:col-span-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-masaar-black/60">
                  Vehicle Image
                </h3>

                <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-black/15 bg-gray-50">
                  <Image
                    src={editImageUrl || "/vehicles/TOYOTA CAMERY.webp"}
                    alt={editName || "Vehicle Preview"}
                    fill
                    className="object-contain p-2"
                    sizes="400px"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-masaar-black">
                    Select from Approved Assets:
                  </label>
                  <select
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black outline-hidden focus:border-pure-gold"
                  >
                    {APPROVED_VEHICLE_ASSETS.map((asset) => (
                      <option key={asset.url} value={asset.url}>
                        {asset.label} ({asset.url})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-masaar-black/60">
                    Or custom image URL:
                  </label>
                  <input
                    type="text"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="/vehicles/... or https://..."
                    className="w-full rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs text-masaar-black outline-hidden focus:border-pure-gold"
                  />
                  <p className="text-[11px] text-masaar-black/45">
                    Recommended size: 1200 × 800 px transparent or neutral background WebP.
                  </p>
                </div>
              </div>

              {/* Middle Column: Basic Information */}
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-masaar-black/60">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-masaar-black">
                      Vehicle Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Toyota Camry"
                      className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-masaar-black outline-hidden focus:border-pure-gold focus:ring-1 focus:ring-pure-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-masaar-black">
                      Model Year (Optional)
                    </label>
                    <input
                      type="text"
                      value={editModelYear}
                      onChange={(e) => setEditModelYear(e.target.value)}
                      placeholder="e.g. 2023 – 2026"
                      className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-masaar-black outline-hidden focus:border-pure-gold focus:ring-1 focus:ring-pure-gold"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-masaar-black">
                      Short Description <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-masaar-black/40">
                      {editShortDesc.length}/300
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={editShortDesc}
                    onChange={(e) => setEditShortDesc(e.target.value)}
                    placeholder="Brief description for customer vehicle card..."
                    className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-masaar-black outline-hidden focus:border-pure-gold focus:ring-1 focus:ring-pure-gold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-masaar-black">
                      Detailed Fleet Notes (Optional)
                    </label>
                    <span className="text-[11px] text-masaar-black/40">
                      {editDetailedDesc.length}/1000
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={editDetailedDesc}
                    onChange={(e) => setEditDetailedDesc(e.target.value)}
                    placeholder="Full vehicle notes, amenities, comfort specs, VIP services..."
                    className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-masaar-black outline-hidden focus:border-pure-gold focus:ring-1 focus:ring-pure-gold"
                  />
                </div>
              </div>

              {/* Right Column: Specifications & Status */}
              <div className="lg:col-span-3 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-masaar-black/60">
                  Vehicle Specifications
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-masaar-black">
                      Passengers <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      <svg className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-masaar-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        required
                        value={editPassengers}
                        onChange={(e) => setEditPassengers(Number(e.target.value))}
                        className="w-full rounded-lg border border-black/15 py-1.5 pl-8 pr-2 text-sm font-semibold text-masaar-black outline-hidden focus:border-pure-gold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-masaar-black">
                      Suitcases <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      <svg className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-masaar-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        required
                        value={editLuggage}
                        onChange={(e) => setEditLuggage(Number(e.target.value))}
                        className="w-full rounded-lg border border-black/15 py-1.5 pl-8 pr-2 text-sm font-semibold text-masaar-black outline-hidden focus:border-pure-gold"
                      />
                    </div>
                  </div>
                </div>

                {/* Features Tags */}
                <div>
                  <label className="block text-xs font-semibold text-masaar-black">
                    Features / Badges
                  </label>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {editFeatures.map((feat, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-md bg-black/5 px-2 py-0.5 text-xs text-masaar-black"
                      >
                        <span>{feat}</span>
                        <button
                          type="button"
                          onClick={() => removeFeature(i)}
                          className="text-masaar-black/40 hover:text-red-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="mt-2 flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newFeatureInput}
                      onChange={(e) => setNewFeatureInput(e.target.value)}
                      placeholder="Add feature tag..."
                      className="w-full rounded-md border border-black/15 px-2 py-1 text-xs outline-hidden focus:border-pure-gold"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addFeature();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addFeature}
                      className="shrink-0 rounded-md border border-black/15 px-2 py-1 text-xs font-medium hover:bg-black/5"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Display & Status */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-masaar-black/60">
                    Display & Status
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-masaar-black">
                      Website Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={String(editIsActive)}
                      onChange={(e) => setEditIsActive(e.target.value === "true")}
                      className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-medium text-masaar-black outline-hidden focus:border-pure-gold"
                    >
                      <option value="true">● Active (Selectable on Routes)</option>
                      <option value="false">○ Inactive (Hidden)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-masaar-black">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={editDisplayOrder}
                      onChange={(e) => setEditDisplayOrder(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-black/15 px-3 py-1.5 text-sm text-masaar-black outline-hidden focus:border-pure-gold"
                    />
                    <p className="mt-1 text-[11px] text-masaar-black/45">
                      Lower number appears first in lists and wizards.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-black/10 pt-4">
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium text-masaar-black/70 hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 rounded-lg bg-pure-gold px-6 py-2 text-sm font-bold text-masaar-black shadow-sm transition hover:bg-pure-gold/90 disabled:opacity-50"
              >
                {isPending ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
