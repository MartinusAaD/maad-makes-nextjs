"use client";

import React, { useState } from "react";
import { useFilaments } from "@/context/FilamentsContext";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { database } from "@/lib/firestoreConfig";
import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";
import FormGroup from "@/components/Form/FormGroup";
import FormLabel from "@/components/Form/FormLabel";
import FormInput from "@/components/Form/FormInput";
import FormSelect from "@/components/Form/FormSelect";
import FormTextarea from "@/components/Form/FormTextarea";
import Alert from "@/components/Alert/Alert";
import AlertDialog from "@/components/AlertDialog/AlertDialog";
import useDebounce from "@/hooks/useDebounce";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faXmark,
  faPencil,
  faTrash,
  faCopy,
  faMagnifyingGlass,
  faBoxOpen,
  faTriangleExclamation,
  faArrowUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import type { Filament, FilamentMaterial } from "@/types/filament";

interface AlertState {
  alertMessage: string;
  type: "success" | "error";
}

interface DeleteDialogState {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface FilamentFormData {
  name: string;
  brand: string;
  material: FilamentMaterial;
  finish: string;
  color: string;
  hexColor: string;
  weightRemaining: string;
  weightTotal: string;
  diameter: string;
  settingsLink: string;
  gramsOrdered: string;
  storageLocation: string;
  costPerKg: string;
  notes: string;
}

const defaultFormData: FilamentFormData = {
  name: "",
  brand: "",
  material: "PLA",
  finish: "",
  color: "",
  hexColor: "#000000",
  weightRemaining: "",
  weightTotal: "",
  diameter: "1.75",
  settingsLink: "",
  gramsOrdered: "",
  storageLocation: "",
  costPerKg: "",
  notes: "",
};

export default function FilamentsPage() {
  const { filaments, loading } = useFilaments();
  const [showForm, setShowForm] = useState(false);
  const [editingFilament, setEditingFilament] = useState<Filament | null>(null);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState | null>(
    null,
  );
  const [filterBrand, setFilterBrand] = useState("");
  const [filterMaterial, setFilterMaterial] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [displayLimit, setDisplayLimit] = useState(20);

  const [formData, setFormData] = useState(defaultFormData);

  const brandOptions = ["Bambu Lab"];

  const materialTypes = [
    "PLA",
    "PLA+",
    "PETG",
    "ABS",
    "TPU",
    "FLEX",
    "Nylon",
    "ASA",
    "PC",
    "PVA",
    "HIPS",
    "Carbon Fiber",
    "Other",
  ];

  const formatNumber = (num: number): string =>
    num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingFilament(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.brand.trim() || !formData.material.trim()) {
      setAlert({
        alertMessage: "Brand and Material are required!",
        type: "error",
      });
      return;
    }
    try {
      const filamentData = {
        name:
          formData.name.trim() ||
          `${formData.brand} ${formData.material} ${formData.color}`.trim(),
        brand: formData.brand.trim(),
        material: formData.material,
        finish: formData.finish.trim(),
        color: formData.color.trim(),
        hexColor: formData.hexColor,
        weightRemaining:
          formData.weightRemaining !== ""
            ? parseFloat(formData.weightRemaining)
            : null,
        diameter: formData.diameter ? parseFloat(formData.diameter) : 1.75,
        settingsLink: formData.settingsLink.trim(),
        gramsOrdered:
          formData.gramsOrdered !== ""
            ? parseFloat(formData.gramsOrdered)
            : null,
        storageLocation: formData.storageLocation.trim(),
        costPerKg:
          formData.costPerKg !== "" ? parseFloat(formData.costPerKg) : null,
        notes: formData.notes.trim(),
        weightTotal: null as number | null,
        updatedAt: serverTimestamp(),
      };
      if (editingFilament) {
        const currentWeight = editingFilament.weightRemaining || 0;
        const newWeight = filamentData.weightRemaining || 0;
        const weightDifference = newWeight - currentWeight;
        if (
          editingFilament.weightTotal === undefined ||
          editingFilament.weightTotal === null
        ) {
          filamentData.weightTotal = newWeight;
        } else {
          filamentData.weightTotal =
            editingFilament.weightTotal + Math.max(0, weightDifference);
        }
        await updateDoc(
          doc(database, "filaments", editingFilament.id),
          filamentData,
        );
        setAlert({
          alertMessage: "Filament updated successfully!",
          type: "success",
        });
      } else {
        filamentData.weightTotal = filamentData.weightRemaining || 0;
        await addDoc(collection(database, "filaments"), {
          ...filamentData,
          createdAt: serverTimestamp(),
        });
        setAlert({
          alertMessage: "Filament added successfully!",
          type: "success",
        });
      }
      resetForm();
    } catch (error) {
      console.error("Error saving filament:", error);
      setAlert({ alertMessage: "Error saving filament!", type: "error" });
    }
  };

  const handleEdit = (filament: Filament) => {
    setEditingFilament(filament);
    setFormData({
      name: filament.name || "",
      brand: filament.brand || "",
      material: filament.material || "PLA",
      finish: filament.finish || "",
      color: filament.color || "",
      hexColor: filament.hexColor || "#000000",
      weightRemaining:
        filament.weightRemaining != null && !isNaN(filament.weightRemaining)
          ? String(filament.weightRemaining)
          : "",
      weightTotal:
        filament.weightTotal != null && !isNaN(filament.weightTotal)
          ? String(filament.weightTotal)
          : "",
      diameter: filament.diameter ? String(filament.diameter) : "1.75",
      settingsLink: filament.settingsLink || "",
      gramsOrdered:
        filament.gramsOrdered != null && !isNaN(filament.gramsOrdered)
          ? String(filament.gramsOrdered)
          : "",
      storageLocation: filament.storageLocation || "",
      costPerKg:
        filament.costPerKg != null && !isNaN(filament.costPerKg)
          ? String(filament.costPerKg)
          : "",
      notes: filament.notes || "",
    });
    setShowForm(true);
  };

  const handleDuplicate = (filament: Filament) => {
    setEditingFilament(null);
    setFormData({
      name: filament.name ? `${filament.name} (Copy)` : "",
      brand: filament.brand || "",
      material: filament.material || "PLA",
      finish: filament.finish || "",
      color: filament.color || "",
      hexColor: filament.hexColor || "#000000",
      weightRemaining:
        filament.weightRemaining != null && !isNaN(filament.weightRemaining)
          ? String(filament.weightRemaining)
          : "",
      weightTotal: "",
      diameter: filament.diameter ? String(filament.diameter) : "1.75",
      settingsLink: filament.settingsLink || "",
      gramsOrdered:
        filament.gramsOrdered != null && !isNaN(filament.gramsOrdered)
          ? String(filament.gramsOrdered)
          : "",
      storageLocation: filament.storageLocation || "",
      costPerKg:
        filament.costPerKg != null && !isNaN(filament.costPerKg)
          ? String(filament.costPerKg)
          : "",
      notes: filament.notes || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (filamentId: string) => {
    try {
      await deleteDoc(doc(database, "filaments", filamentId));
      setAlert({
        alertMessage: "Filament deleted successfully!",
        type: "success",
      });
      setDeleteDialog(null);
    } catch (error) {
      console.error("Error deleting filament:", error);
      setAlert({ alertMessage: "Error deleting filament!", type: "error" });
      setDeleteDialog(null);
    }
  };

  const confirmDelete = (filament: Filament) => {
    setDeleteDialog({
      title: "Delete Filament",
      message: `Are you sure you want to delete "${filament.name}"?`,
      onConfirm: () => handleDelete(filament.id),
      onCancel: () => setDeleteDialog(null),
    });
  };

  const uniqueBrands: string[] = [
    ...new Set((filaments as Filament[]).map((f) => f.brand)),
  ].sort();
  const uniqueMaterials: string[] = [
    ...new Set((filaments as Filament[]).map((f) => f.material)),
  ].sort();

  const filteredFilaments = filaments.filter((filament) => {
    const brandMatch = !filterBrand || filament.brand === filterBrand;
    const materialMatch =
      !filterMaterial || filament.material === filterMaterial;
    const lowStockMatch =
      !filterLowStock ||
      (filament.weightRemaining !== null && filament.weightRemaining < 400);
    const searchMatch =
      !debouncedSearchQuery ||
      filament.name
        ?.toLowerCase()
        .includes(debouncedSearchQuery.toLowerCase()) ||
      filament.brand
        ?.toLowerCase()
        .includes(debouncedSearchQuery.toLowerCase()) ||
      filament.color
        ?.toLowerCase()
        .includes(debouncedSearchQuery.toLowerCase()) ||
      filament.material
        ?.toLowerCase()
        .includes(debouncedSearchQuery.toLowerCase());
    return brandMatch && materialMatch && lowStockMatch && searchMatch;
  });

  const displayedFilaments = filteredFilaments.slice(0, displayLimit);
  const hasMoreFilaments = filteredFilaments.length > displayLimit;
  const handleLoadMore = () => setDisplayLimit((prev) => prev + 20);

  const lowStockFilaments = filaments.filter(
    (f) => f.weightRemaining !== null && f.weightRemaining < 400,
  );
  const totalWeightInStock = filaments.reduce(
    (total, f) => total + (f.weightRemaining || 0),
    0,
  );
  const totalWeightEver = filaments.reduce(
    (total, f) => total + (f.weightTotal || 0),
    0,
  );

  return (
    <div className="w-full min-h-screen bg-bg-light">
      {alert && (
        <Alert
          alertMessage={alert.alertMessage}
          type={alert.type}
          duration={4000}
          onClose={() => setAlert(null)}
        />
      )}
      {deleteDialog && (
        <AlertDialog
          title={deleteDialog.title}
          message={deleteDialog.message}
          onConfirm={deleteDialog.onConfirm}
          onCancel={deleteDialog.onCancel}
        />
      )}

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-center items-start bg-black/50 overflow-y-auto p-4 pt-12">
          <div className="bg-white rounded-xl shadow-2xl border border-bg-grey w-full max-w-3xl mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-bg-grey">
              <h2 className="text-base font-semibold text-dark">
                {editingFilament ? "Edit Filament" : "Add New Filament"}
              </h2>
              <button
                onClick={resetForm}
                className="text-dark/40 hover:text-dark/70 transition-colors border-none bg-transparent cursor-pointer"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormGroup>
                  <FormLabel htmlFor="name">Display Name</FormLabel>
                  <FormInput
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Auto-generated if left empty"
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="brand">Brand *</FormLabel>
                  <FormSelect
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select brand</option>
                    {brandOptions.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </FormSelect>
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="material">Material *</FormLabel>
                  <FormSelect
                    id="material"
                    name="material"
                    value={formData.material}
                    onChange={handleInputChange}
                    required
                  >
                    {materialTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </FormSelect>
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="finish">Finish</FormLabel>
                  <FormSelect
                    id="finish"
                    name="finish"
                    value={formData.finish}
                    onChange={handleInputChange}
                  >
                    <option value="">Select finish (optional)</option>
                    {[
                      "Basic",
                      "Matte",
                      "Silk",
                      "Translucent",
                      "Metallic",
                      "Glow in the Dark",
                      "Wood",
                      "Marble",
                      "Other",
                    ].map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </FormSelect>
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="color">Color</FormLabel>
                  <FormInput
                    type="text"
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    placeholder="e.g. Red, Blue, Black"
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="hexColor">Hex Color</FormLabel>
                  <div className="flex gap-2 items-center">
                    <FormInput
                      type="color"
                      id="hexColor"
                      name="hexColor"
                      value={formData.hexColor}
                      onChange={handleInputChange}
                      className="h-10 w-16 p-1 cursor-pointer"
                    />
                    <FormInput
                      type="text"
                      value={formData.hexColor}
                      onChange={handleInputChange}
                      name="hexColor"
                      placeholder="#000000"
                    />
                  </div>
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="diameter">Diameter (mm)</FormLabel>
                  <FormSelect
                    id="diameter"
                    name="diameter"
                    value={formData.diameter}
                    onChange={handleInputChange}
                  >
                    <option value="1.75">1.75mm</option>
                    <option value="2.85">2.85mm</option>
                    <option value="3.0">3.0mm</option>
                  </FormSelect>
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="settingsLink">Settings Link</FormLabel>
                  <FormInput
                    type="url"
                    id="settingsLink"
                    name="settingsLink"
                    value={formData.settingsLink}
                    onChange={handleInputChange}
                    placeholder="https://..."
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="weightRemaining">
                    Weight in Storage (g)
                  </FormLabel>
                  <FormInput
                    type="number"
                    id="weightRemaining"
                    name="weightRemaining"
                    value={formData.weightRemaining}
                    onChange={handleInputChange}
                    placeholder="800"
                    min="0"
                    step="1"
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="weightTotal">
                    Total Weight Ever (g)
                  </FormLabel>
                  <FormInput
                    type="number"
                    id="weightTotal"
                    name="weightTotal"
                    value={formData.weightTotal}
                    onChange={handleInputChange}
                    placeholder="Auto-calculated"
                    min="0"
                    step="1"
                    disabled
                    title="Auto-calculated based on weight added over time"
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="gramsOrdered">Grams Ordered</FormLabel>
                  <FormInput
                    type="number"
                    id="gramsOrdered"
                    name="gramsOrdered"
                    value={formData.gramsOrdered}
                    onChange={handleInputChange}
                    placeholder="Enter grams ordered"
                    min="0"
                    step="1"
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="costPerKg">Cost per Kg (kr)</FormLabel>
                  <FormInput
                    type="number"
                    id="costPerKg"
                    name="costPerKg"
                    value={formData.costPerKg}
                    onChange={handleInputChange}
                    placeholder="20.00"
                    min="0"
                    step="0.01"
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="storageLocation">
                    Storage Location
                  </FormLabel>
                  <FormInput
                    type="text"
                    id="storageLocation"
                    name="storageLocation"
                    value={formData.storageLocation}
                    onChange={handleInputChange}
                    placeholder="e.g. Shelf A, Box 3"
                  />
                </FormGroup>
              </div>
              <FormGroup className="mt-4">
                <FormLabel htmlFor="notes">Notes</FormLabel>
                <FormTextarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional notes about this filament..."
                  rows={3}
                />
              </FormGroup>
              <div className="flex gap-2 pt-4 border-t border-bg-grey mt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm bg-primary text-light border-none rounded-lg font-bold transition-colors hover:bg-primary-lighter cursor-pointer"
                >
                  {editingFilament ? "Update Filament" : "Add Filament"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm bg-bg-grey text-dark border-none rounded-lg font-bold transition-colors hover:bg-bg-grey/70 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="w-full bg-primary">
        <ResponsiveWidthWrapper>
          <div className="flex items-center justify-between py-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-light tracking-tight">
                Filament Inventory
              </h1>
              <p className="text-light/50 text-sm mt-0.5">
                {filaments.length} spool{filaments.length !== 1 ? "s" : ""} ·{" "}
                {formatNumber(Math.round(totalWeightInStock))}g in stock
              </p>
            </div>
            <button
              onClick={() => {
                if (showForm) resetForm();
                else setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-light/10 hover:bg-light/20 text-light rounded-lg border border-light/20 transition-colors text-sm font-medium shrink-0 cursor-pointer"
            >
              <FontAwesomeIcon
                icon={showForm ? faXmark : faPlus}
                className="w-3.5 h-3.5"
              />
              {showForm ? "Cancel" : "Add Filament"}
            </button>
          </div>
        </ResponsiveWidthWrapper>
      </div>

      <ResponsiveWidthWrapper>
        <div className="w-full flex flex-col gap-6 py-8">
          {/* Stats row */}
          {!loading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-bg-grey p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {filaments.length}
                </p>
                <p className="text-xs text-dark/50 mt-0.5">Total Spools</p>
              </div>
              <div className="bg-white rounded-xl border border-bg-grey p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {formatNumber(Math.round(totalWeightInStock))}g
                </p>
                <p className="text-xs text-dark/50 mt-0.5">In Stock</p>
              </div>
              <div
                className={`rounded-xl border p-4 text-center ${lowStockFilaments.length > 0 ? "bg-red/5 border-red/20" : "bg-white border-bg-grey"}`}
              >
                <p
                  className={`text-2xl font-bold ${lowStockFilaments.length > 0 ? "text-red" : "text-green"}`}
                >
                  {lowStockFilaments.length}
                </p>
                <p className="text-xs text-dark/50 mt-0.5">
                  Low Stock (&lt;400g)
                </p>
              </div>
              <div className="bg-white rounded-xl border border-bg-grey p-4 text-center">
                <p className="text-2xl font-bold text-green">
                  {formatNumber(Math.round(totalWeightEver))}g
                </p>
                <p className="text-xs text-dark/50 mt-0.5">Total Ever Used</p>
              </div>
            </div>
          )}

          {/* Search + filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 w-4 h-4 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, brand, color, material…"
                className="w-full pl-10 pr-4 p-2 rounded border-2 border-primary/50 bg-white text-dark focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors text-sm"
              />
            </div>
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="p-2 rounded border-2 border-primary/50 bg-white text-dark text-sm cursor-pointer hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
            >
              <option value="">All Brands</option>
              {uniqueBrands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
            <select
              value={filterMaterial}
              onChange={(e) => setFilterMaterial(e.target.value)}
              className="p-2 rounded border-2 border-primary/50 bg-white text-dark text-sm cursor-pointer hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
            >
              <option value="">All Materials</option>
              {uniqueMaterials.map((material) => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 px-3 py-2 rounded border-2 border-primary/50 bg-white cursor-pointer hover:border-primary transition-colors text-sm font-medium text-dark">
              <input
                type="checkbox"
                checked={filterLowStock}
                onChange={(e) => setFilterLowStock(e.target.checked)}
                className="accent-primary w-4 h-4"
              />
              Low stock only
            </label>
          </div>

          {/* Filament list */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-dark/40 text-sm">Loading filaments...</p>
            </div>
          ) : filteredFilaments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center bg-white rounded-xl border border-bg-grey">
              <div className="w-12 h-12 rounded-full bg-bg-grey flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faBoxOpen}
                  className="w-5 h-5 text-dark/25"
                />
              </div>
              <p className="text-dark/50 font-medium text-sm">
                {filterBrand || filterMaterial || filterLowStock || searchQuery
                  ? "No filaments match the current filters"
                  : "No filaments yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {displayedFilaments.map((filament) => {
                  const isLowStock =
                    filament.weightRemaining !== null &&
                    filament.weightRemaining < 400;
                  const weightPercent =
                    filament.weightTotal && filament.weightTotal > 0
                      ? Math.min(
                          100,
                          Math.round(
                            ((filament.weightRemaining || 0) /
                              filament.weightTotal) *
                              100,
                          ),
                        )
                      : null;

                  return (
                    <div
                      key={filament.id}
                      className={`bg-white rounded-xl border flex flex-col gap-0 overflow-hidden ${isLowStock ? "border-red/30" : "border-bg-grey"}`}
                    >
                      {/* Main row */}
                      <div className="flex items-center gap-3 px-4 py-3">
                        {/* Color swatch */}
                        <div
                          className="w-9 h-9 rounded-lg border border-black/10 shrink-0"
                          style={{
                            backgroundColor: filament.hexColor || "#ccc",
                          }}
                          title={filament.hexColor}
                        />

                        {/* Name + brand/material */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-dark">
                              {filament.name}
                            </span>
                            {isLowStock && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-red/10 text-red whitespace-nowrap shrink-0">
                                <FontAwesomeIcon
                                  icon={faTriangleExclamation}
                                  className="w-2.5 h-2.5"
                                />
                                Low stock
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-dark/40 mt-0.5">
                            {filament.brand}
                            {filament.material ? ` · ${filament.material}` : ""}
                            {filament.finish ? ` · ${filament.finish}` : ""}
                            {filament.diameter
                              ? ` · ${filament.diameter}mm`
                              : ""}
                          </p>
                        </div>

                        {/* Weight summary */}
                        <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0 w-28 text-right">
                          {filament.weightRemaining !== null ? (
                            <>
                              <span className="text-sm font-semibold text-dark">
                                {filament.weightRemaining}g
                              </span>
                              <span className="text-xs text-dark/40">
                                {filament.weightTotal
                                  ? `of ${filament.weightTotal}g`
                                  : "remaining"}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-dark/25 italic">
                              No weight
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1.5 shrink-0 ml-1">
                          <button
                            onClick={() => handleEdit(filament)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-none cursor-pointer"
                            title="Edit"
                          >
                            <FontAwesomeIcon
                              icon={faPencil}
                              className="w-3 h-3"
                            />
                          </button>
                          <button
                            onClick={() => handleDuplicate(filament)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-none cursor-pointer"
                            title="Duplicate"
                          >
                            <FontAwesomeIcon
                              icon={faCopy}
                              className="w-3 h-3"
                            />
                          </button>
                          {filament.settingsLink && (
                            <a
                              href={filament.settingsLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                              title="Slicer settings"
                            >
                              <FontAwesomeIcon
                                icon={faArrowUpRightFromSquare}
                                className="w-3 h-3"
                              />
                            </a>
                          )}
                          <button
                            onClick={() => confirmDelete(filament)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-red/10 text-red hover:bg-red hover:text-light transition-colors border-none cursor-pointer"
                            title="Delete"
                          >
                            <FontAwesomeIcon
                              icon={faTrash}
                              className="w-3 h-3"
                            />
                          </button>
                        </div>
                      </div>

                      {/* Weight bar + extra details strip */}
                      {(weightPercent !== null ||
                        filament.storageLocation ||
                        filament.costPerKg != null ||
                        filament.notes) && (
                        <div className="border-t border-bg-grey px-4 py-2 flex flex-col gap-1.5">
                          {weightPercent !== null && (
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-1.5 bg-bg-grey rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${weightPercent < 30 ? "bg-red" : weightPercent < 60 ? "bg-yellow" : "bg-green"}`}
                                  style={{ width: `${weightPercent}%` }}
                                />
                              </div>
                              <span className="text-xs text-dark/40 shrink-0">
                                {weightPercent}% remaining
                              </span>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-dark/50">
                            {filament.storageLocation && (
                              <span>
                                <span className="text-dark/30">Location:</span>{" "}
                                {filament.storageLocation}
                              </span>
                            )}
                            {filament.costPerKg != null && (
                              <span>
                                <span className="text-dark/30">Cost:</span>{" "}
                                {filament.costPerKg} kr/kg
                              </span>
                            )}
                            {filament.gramsOrdered != null &&
                              !isNaN(filament.gramsOrdered) && (
                                <span>
                                  <span className="text-dark/30">Ordered:</span>{" "}
                                  {filament.gramsOrdered}g
                                </span>
                              )}
                            {filament.color && (
                              <span>
                                <span className="text-dark/30">Color:</span>{" "}
                                {filament.color}
                              </span>
                            )}
                            {filament.notes && (
                              <span className="italic text-dark/40">
                                {filament.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {hasMoreFilaments && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-dark/40 text-sm">
                    Showing {displayedFilaments.length} of{" "}
                    {filteredFilaments.length}
                  </p>
                  <button
                    onClick={handleLoadMore}
                    className="px-6 py-2 text-sm bg-primary text-light border-none rounded-lg font-bold transition-colors hover:bg-primary-lighter cursor-pointer"
                  >
                    Load More ({filteredFilaments.length - displayLimit}{" "}
                    remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </ResponsiveWidthWrapper>
    </div>
  );
}
