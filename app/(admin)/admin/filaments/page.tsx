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
import Button from "@/components/Button/Button";
import FormGroup from "@/components/Form/FormGroup";
import FormLabel from "@/components/Form/FormLabel";
import FormInput from "@/components/Form/FormInput";
import FormSelect from "@/components/Form/FormSelect";
import FormTextarea from "@/components/Form/FormTextarea";
import FormFieldset from "@/components/Form/FormFieldset";
import Alert from "@/components/Alert/Alert";
import AlertDialog from "@/components/AlertDialog/AlertDialog";
import useDebounce from "@/hooks/useDebounce";
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
  const [displayLimit, setDisplayLimit] = useState(10);

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

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

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

  const handleLoadMore = () => {
    setDisplayLimit((prev) => prev + 10);
  };

  const lowStockFilaments = filaments.filter(
    (f) => f.weightRemaining !== null && f.weightRemaining < 400,
  );

  const totalWeightInStock = filaments.reduce((total, filament) => {
    return total + (filament.weightRemaining || 0);
  }, 0);

  const totalWeightEver = filaments.reduce((total, filament) => {
    return total + (filament.weightTotal || 0);
  }, 0);

  return (
    <div className="w-full flex flex-col items-center gap-4 bg-bg-light py-6 min-h-screen">
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

      <ResponsiveWidthWrapper>
        <div className="w-full flex flex-col gap-6 mt-8">
          <div className="flex flex-col gap-5 items-center">
            <h1 className="text-4xl font-bold text-dark m-0">
              Filament Inventory Manager
            </h1>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "Add New Filament"}
            </Button>
          </div>

          {!loading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-md text-center">
                <p className="text-2xl font-bold text-primary">
                  {filaments.length}
                </p>
                <p className="text-sm text-gray-600">Total Filaments</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md text-center">
                <p className="text-2xl font-bold text-primary">
                  {formatNumber(Math.round(totalWeightInStock))}g
                </p>
                <p className="text-sm text-gray-600">Total Weight in Stock</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md text-center">
                <p className="text-2xl font-bold text-red-600">
                  {lowStockFilaments.length}
                </p>
                <p className="text-sm text-gray-600">Low Stock (&lt;400g)</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md text-center">
                <p className="text-2xl font-bold text-green-600">
                  {formatNumber(Math.round(totalWeightEver))}g
                </p>
                <p className="text-sm text-gray-600">Total Weight Ever</p>
              </div>
            </div>
          )}

          {showForm && (
            <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/50 overflow-y-auto p-4">
              <div className="bg-white rounded-lg shadow-2xl border-2 border-primary/40 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6">
                  <FormFieldset
                    legend={
                      editingFilament ? "Edit Filament" : "Add New Filament"
                    }
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormGroup>
                        <FormLabel htmlFor="name">Display Name:</FormLabel>
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
                        <FormLabel htmlFor="brand">Brand: *</FormLabel>
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
                        <FormLabel htmlFor="material">Material: *</FormLabel>
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
                        <FormLabel htmlFor="finish">Finish:</FormLabel>
                        <FormSelect
                          id="finish"
                          name="finish"
                          value={formData.finish}
                          onChange={handleInputChange}
                        >
                          <option value="">Select finish (optional)</option>
                          <option value="Basic">Basic</option>
                          <option value="Matte">Matte</option>
                          <option value="Silk">Silk</option>
                          <option value="Translucent">Translucent</option>
                          <option value="Metallic">Metallic</option>
                          <option value="Glow in the Dark">
                            Glow in the Dark
                          </option>
                          <option value="Wood">Wood</option>
                          <option value="Marble">Marble</option>
                          <option value="Other">Other</option>
                        </FormSelect>
                      </FormGroup>

                      <FormGroup>
                        <FormLabel htmlFor="color">Color:</FormLabel>
                        <FormInput
                          type="text"
                          id="color"
                          name="color"
                          value={formData.color}
                          onChange={handleInputChange}
                          placeholder="e.g., Red, Blue, Black"
                        />
                      </FormGroup>

                      <FormGroup>
                        <FormLabel htmlFor="hexColor">Hex Color:</FormLabel>
                        <div className="flex gap-2 items-center">
                          <FormInput
                            type="color"
                            id="hexColor"
                            name="hexColor"
                            value={formData.hexColor}
                            onChange={handleInputChange}
                            className="h-10 w-20"
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
                        <FormLabel htmlFor="diameter">Diameter (mm):</FormLabel>
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
                        <FormLabel htmlFor="settingsLink">
                          Settings Link:
                        </FormLabel>
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
                          Weight in Storage (g):
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
                          Total Weight Ever (g):
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
                          className="bg-gray-100"
                          title="This field is automatically calculated based on weight added over time"
                        />
                      </FormGroup>

                      <FormGroup>
                        <FormLabel htmlFor="gramsOrdered">
                          Grams Ordered:
                        </FormLabel>
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
                        <FormLabel htmlFor="costPerKg">
                          Cost per Kg (kr):
                        </FormLabel>
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
                          Storage Location:
                        </FormLabel>
                        <FormInput
                          type="text"
                          id="storageLocation"
                          name="storageLocation"
                          value={formData.storageLocation}
                          onChange={handleInputChange}
                          placeholder="e.g., Shelf A, Box 3"
                        />
                      </FormGroup>
                    </div>

                    <FormGroup>
                      <FormLabel htmlFor="notes">Notes:</FormLabel>
                      <FormTextarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Any additional notes about this filament..."
                        rows={3}
                      />
                    </FormGroup>

                    <div className="flex gap-2">
                      <Button onClick={resetForm} type="button">
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingFilament ? "Update Filament" : "Add Filament"}
                      </Button>
                    </div>
                  </FormFieldset>
                </form>
              </div>
            </div>
          )}

          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-dark mb-3">
              Search & Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormGroup>
                <FormLabel htmlFor="filterBrand">Filter by Brand:</FormLabel>
                <FormSelect
                  id="filterBrand"
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                >
                  <option value="">All Brands</option>
                  {uniqueBrands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </FormSelect>
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="filterMaterial">
                  Filter by Material:
                </FormLabel>
                <FormSelect
                  id="filterMaterial"
                  value={filterMaterial}
                  onChange={(e) => setFilterMaterial(e.target.value)}
                >
                  <option value="">All Materials</option>
                  {uniqueMaterials.map((material) => (
                    <option key={material} value={material}>
                      {material}
                    </option>
                  ))}
                </FormSelect>
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="filterLowStock">Low Stock Only:</FormLabel>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="filterLowStock"
                    checked={filterLowStock}
                    onChange={(e) => setFilterLowStock(e.target.checked)}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">
                    Show only filaments with less than 400g remaining
                  </span>
                </div>
              </FormGroup>
            </div>

            <FormGroup className="mt-4">
              <FormLabel htmlFor="searchQuery">Search Filaments:</FormLabel>
              <FormInput
                type="text"
                id="searchQuery"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, brand, color, or material..."
              />
            </FormGroup>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-2 border-primary/40">
            <h2 className="text-2xl font-bold text-primary mb-4">
              Filament Inventory ({filteredFilaments.length})
            </h2>

            {loading ? (
              <p>Loading filaments...</p>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredFilaments.length === 0 ? (
                  <p className="text-gray-500">
                    {filterBrand || filterMaterial
                      ? "No filaments match the selected filters."
                      : "No filaments yet. Add your first filament!"}
                  </p>
                ) : (
                  <>
                    {displayedFilaments.map((filament) => {
                      const isLowStock =
                        filament.weightRemaining !== null &&
                        filament.weightRemaining < 400;

                      return (
                        <div
                          key={filament.id}
                          className={`border rounded-lg p-4 ${
                            isLowStock
                              ? "border-red-500 bg-red-50"
                              : "border-bg-grey"
                          }`}
                        >
                          <div className="flex flex-col gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <div
                                  className="w-8 h-8 rounded border-2 border-gray-300 shrink-0"
                                  style={{ backgroundColor: filament.hexColor }}
                                  title={filament.hexColor}
                                />
                                <h3 className="text-lg md:text-xl font-bold text-dark m-0">
                                  {filament.name}
                                </h3>
                                {isLowStock && (
                                  <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                                    LOW STOCK
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                <p>
                                  <span className="font-bold">Brand:</span>{" "}
                                  {filament.brand}
                                </p>
                                <p>
                                  <span className="font-bold">Material:</span>{" "}
                                  {filament.material}
                                </p>
                                {filament.finish && (
                                  <p>
                                    <span className="font-bold">Finish:</span>{" "}
                                    {filament.finish}
                                  </p>
                                )}
                                <p>
                                  <span className="font-bold">Color:</span>{" "}
                                  {filament.color || "N/A"}
                                </p>
                                <p>
                                  <span className="font-bold">Diameter:</span>{" "}
                                  {filament.diameter}mm
                                </p>
                                {filament.weightRemaining !== null && (
                                  <p>
                                    <span className="font-bold">
                                      Weight in Storage:
                                    </span>{" "}
                                    {filament.weightRemaining}g
                                  </p>
                                )}
                                {filament.weightTotal !== null &&
                                  filament.weightTotal !== undefined && (
                                    <p>
                                      <span className="font-bold">
                                        Total Ever:
                                      </span>{" "}
                                      <span className="text-green-600 font-semibold">
                                        {filament.weightTotal}g
                                      </span>
                                    </p>
                                  )}
                                {filament.gramsOrdered !== null &&
                                  !isNaN(filament.gramsOrdered) && (
                                    <p>
                                      <span className="font-bold">
                                        Ordered:
                                      </span>{" "}
                                      <span className="text-blue-600 font-semibold">
                                        {filament.gramsOrdered}g
                                      </span>
                                    </p>
                                  )}
                                {filament.settingsLink && (
                                  <p>
                                    <span className="font-bold">Settings:</span>{" "}
                                    <a
                                      href={filament.settingsLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      View Recommended Settings
                                    </a>
                                  </p>
                                )}
                                {filament.storageLocation && (
                                  <p>
                                    <span className="font-bold">Location:</span>{" "}
                                    {filament.storageLocation}
                                  </p>
                                )}
                              </div>

                              {filament.notes && (
                                <p className="text-sm text-gray-600 mt-2">
                                  <span className="font-bold">Notes:</span>{" "}
                                  {filament.notes}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-200">
                              <Button onClick={() => handleEdit(filament)}>
                                Edit
                              </Button>
                              <Button onClick={() => handleDuplicate(filament)}>
                                Duplicate
                              </Button>
                              <Button
                                onClick={() => confirmDelete(filament)}
                                className="bg-red-500 hover:bg-red-600 text-white border-none"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {hasMoreFilaments && (
                      <div className="flex justify-center mt-4">
                        <Button onClick={handleLoadMore}>
                          Load More ({filteredFilaments.length - displayLimit}{" "}
                          remaining)
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </ResponsiveWidthWrapper>
    </div>
  );
}
