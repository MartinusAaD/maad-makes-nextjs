"use client";

import React, { useState, useRef } from "react";
import { useCategories } from "@/context/CategoriesContext";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { database } from "@/lib/firestoreConfig";
import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";
import FormGroup from "@/components/Form/FormGroup";
import FormLabel from "@/components/Form/FormLabel";
import FormInput from "@/components/Form/FormInput";
import FormSelect from "@/components/Form/FormSelect";
import Alert from "@/components/Alert/Alert";
import AlertDialog from "@/components/AlertDialog/AlertDialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faXmark,
  faPencil,
  faTrash,
  faChevronRight,
  faTag,
} from "@fortawesome/free-solid-svg-icons";
import type { Category } from "@/types/category";

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

export default function CategoriesPage() {
  const { categories, loading } = useCategories();

  const formRef = useRef<HTMLFormElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState | null>(
    null,
  );
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    parentId: null,
  });

  const parentCategories = categories.filter((cat: Category) => !cat.parentId);

  const getSubcategories = (parentId: string) => {
    return categories.filter((cat: Category) => cat.parentId === parentId);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? null : value,
    }));
  };

  const resetForm = () => {
    setFormData({ name: "", parentId: null });
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setAlert({ alertMessage: "Category name is required!", type: "error" });
      return;
    }

    try {
      if (editingCategory) {
        await updateDoc(doc(database, "categories", editingCategory.id), {
          name: formData.name.trim(),
          parentId: formData.parentId || null,
        });
        setAlert({
          alertMessage: "Category updated successfully!",
          type: "success",
        });
      } else {
        await addDoc(collection(database, "categories"), {
          name: formData.name.trim(),
          parentId: formData.parentId || null,
        });
        setAlert({
          alertMessage: "Category created successfully!",
          type: "success",
        });
      }
      resetForm();
    } catch (error) {
      console.error("Error saving category:", error);
      setAlert({ alertMessage: "Error saving category!", type: "error" });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      parentId: category.parentId || null,
    });
    setShowForm(true);
    setTimeout(() => {
      if (formRef.current) {
        const yOffset = -110;
        const y =
          formRef.current.getBoundingClientRect().top +
          window.pageYOffset +
          yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }, 100);
  };

  const handleDelete = async (categoryId: string) => {
    const hasSubcategories = categories.some(
      (cat) => cat.parentId === categoryId,
    );

    if (hasSubcategories) {
      setAlert({
        alertMessage:
          "Cannot delete category with subcategories. Delete subcategories first.",
        type: "error",
      });
      setDeleteDialog(null);
      return;
    }

    try {
      await deleteDoc(doc(database, "categories", categoryId));
      setAlert({
        alertMessage: "Category deleted successfully!",
        type: "success",
      });
      setDeleteDialog(null);
    } catch (error) {
      console.error("Error deleting category:", error);
      setAlert({ alertMessage: "Error deleting category!", type: "error" });
      setDeleteDialog(null);
    }
  };

  const confirmDelete = (category: Category) => {
    setDeleteDialog({
      title: "Delete Category",
      message: `Are you sure you want to delete "${category.name}"?`,
      onConfirm: () => handleDelete(category.id),
      onCancel: () => setDeleteDialog(null),
    });
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

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

      {/* Page header */}
      <div className="w-full bg-primary">
        <ResponsiveWidthWrapper>
          <div className="flex items-center justify-between py-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-light tracking-tight">
                Categories
              </h1>
              <p className="text-light/50 text-sm mt-0.5">
                {categories.length} categor
                {categories.length !== 1 ? "ies" : "y"} total
              </p>
            </div>
            <button
              onClick={() => {
                if (showForm && editingCategory) resetForm();
                else setShowForm((v) => !v);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-light/10 hover:bg-light/20 text-light rounded-lg border border-light/20 transition-colors text-sm font-medium shrink-0"
            >
              <FontAwesomeIcon
                icon={showForm ? faXmark : faPlus}
                className="w-3.5 h-3.5"
              />
              {showForm ? "Cancel" : "Add Category"}
            </button>
          </div>
        </ResponsiveWidthWrapper>
      </div>

      <ResponsiveWidthWrapper>
        <div className="w-full flex flex-col gap-6 py-8">
          {/* Add / Edit form */}
          {showForm && (
            <div className="bg-white rounded-xl border border-bg-grey shadow-sm p-6">
              <h2 className="text-base font-semibold text-dark mb-4">
                {editingCategory ? "Edit Category" : "New Category"}
              </h2>
              <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="flex flex-col gap-4"
              >
                <FormGroup>
                  <FormLabel htmlFor="name">Category Name *</FormLabel>
                  <FormInput
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Pokemon, Plushies…"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel htmlFor="parentId">
                    Parent Category (optional)
                  </FormLabel>
                  <FormSelect
                    id="parentId"
                    name="parentId"
                    value={formData.parentId || ""}
                    onChange={handleInputChange}
                  >
                    <option value="">None — top-level category</option>
                    {parentCategories.map((cat) => (
                      <option
                        key={cat.id}
                        value={cat.id}
                        disabled={editingCategory?.id === cat.id}
                      >
                        {cat.name}
                      </option>
                    ))}
                  </FormSelect>
                </FormGroup>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-sm bg-primary text-light border-none rounded-lg font-bold transition-colors hover:bg-primary-lighter"
                  >
                    {editingCategory ? "Update Category" : "Create Category"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-sm bg-bg-grey text-dark border-none rounded-lg font-bold transition-colors hover:bg-bg-grey/70"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Category list */}
          <div className="rounded-xl border border-bg-grey overflow-hidden bg-white shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-dark/40 text-sm">Loading categories...</p>
              </div>
            ) : parentCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-bg-grey flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faTag}
                    className="w-4 h-4 text-dark/25"
                  />
                </div>
                <p className="text-dark/50 font-medium text-sm">
                  No categories yet
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="text-primary text-sm underline underline-offset-2 hover:text-primary-lighter transition-colors"
                >
                  Create your first category
                </button>
              </div>
            ) : (
              <ul className="list-none p-0 m-0 divide-y divide-bg-grey">
                {parentCategories.map((parent) => {
                  const subcategories = getSubcategories(parent.id);
                  const isExpanded = expandedCategories.includes(parent.id);
                  return (
                    <li key={parent.id}>
                      {/* Parent row */}
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-bg-light/60 transition-colors">
                        <button
                          onClick={() =>
                            subcategories.length > 0 &&
                            toggleCategory(parent.id)
                          }
                          className={`w-6 h-6 flex items-center justify-center rounded transition-colors shrink-0 ${subcategories.length > 0 ? "text-primary/50 hover:text-primary hover:bg-primary/10 cursor-pointer" : "text-transparent cursor-default"}`}
                          aria-label="Toggle subcategories"
                        >
                          <FontAwesomeIcon
                            icon={faChevronRight}
                            className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                          />
                        </button>

                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-dark text-sm">
                            {parent.name}
                          </span>
                          {subcategories.length > 0 && (
                            <span className="ml-2 text-xs text-dark/40">
                              {subcategories.length} sub
                              {subcategories.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleEdit(parent)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary/10 text-primary border-none rounded-lg font-bold transition-colors hover:bg-primary/20"
                          >
                            <FontAwesomeIcon
                              icon={faPencil}
                              className="w-3 h-3"
                            />
                            Edit
                          </button>
                          <button
                            onClick={() => confirmDelete(parent)}
                            className="flex items-center justify-center p-1.5 bg-red/10 text-red border-none rounded-lg transition-colors hover:bg-red hover:text-light"
                          >
                            <FontAwesomeIcon
                              icon={faTrash}
                              className="w-3 h-3"
                            />
                          </button>
                        </div>
                      </div>

                      {/* Subcategories */}
                      {isExpanded && subcategories.length > 0 && (
                        <ul className="list-none p-0 m-0 divide-y divide-bg-grey bg-bg-light/40">
                          {subcategories.map((sub) => (
                            <li
                              key={sub.id}
                              className="flex items-center gap-3 pl-12 pr-4 py-2.5 hover:bg-bg-light transition-colors"
                            >
                              <div className="w-1 h-1 rounded-full bg-primary/30 shrink-0" />
                              <span className="flex-1 text-sm text-dark/80">
                                {sub.name}
                              </span>
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => handleEdit(sub)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary/10 text-primary border-none rounded-lg font-bold transition-colors hover:bg-primary/20"
                                >
                                  <FontAwesomeIcon
                                    icon={faPencil}
                                    className="w-3 h-3"
                                  />
                                  Edit
                                </button>
                                <button
                                  onClick={() => confirmDelete(sub)}
                                  className="flex items-center justify-center p-1.5 bg-red/10 text-red border-none rounded-lg transition-colors hover:bg-red hover:text-light"
                                >
                                  <FontAwesomeIcon
                                    icon={faTrash}
                                    className="w-3 h-3"
                                  />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </ResponsiveWidthWrapper>
    </div>
  );
}
