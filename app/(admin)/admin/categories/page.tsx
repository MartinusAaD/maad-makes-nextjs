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
import Button from "@/components/Button/Button";
import FormGroup from "@/components/Form/FormGroup";
import FormLabel from "@/components/Form/FormLabel";
import FormInput from "@/components/Form/FormInput";
import FormSelect from "@/components/Form/FormSelect";
import FormFieldset from "@/components/Form/FormFieldset";
import Alert from "@/components/Alert/Alert";
import AlertDialog from "@/components/AlertDialog/AlertDialog";
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
              Category Manager
            </h1>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "Add New Category"}
            </Button>
          </div>

          {showForm && (
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <FormFieldset
                legend={
                  editingCategory ? "Edit Category" : "Create New Category"
                }
              >
                <FormGroup>
                  <FormLabel htmlFor="name">Category Name: *</FormLabel>
                  <FormInput
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Pokemon, Plushies, etc."
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel htmlFor="parentId">
                    Parent Category (optional):
                  </FormLabel>
                  <FormSelect
                    id="parentId"
                    name="parentId"
                    value={formData.parentId || ""}
                    onChange={handleInputChange}
                  >
                    <option value="">None (Top-level category)</option>
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

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingCategory ? "Update Category" : "Create Category"}
                  </Button>
                  <Button onClick={resetForm} type="button">
                    Cancel
                  </Button>
                </div>
              </FormFieldset>
            </form>
          )}

          <div className="bg-white p-6 rounded-lg shadow-md border-2 border-primary/40">
            <h2 className="text-2xl font-bold text-primary mb-4">
              Existing Categories
            </h2>

            {loading ? (
              <p>Loading categories...</p>
            ) : (
              <div className="flex flex-col gap-4">
                {parentCategories.length === 0 ? (
                  <p className="text-gray-500">
                    No categories yet. Create your first category!
                  </p>
                ) : (
                  parentCategories.map((parent) => {
                    const subcategories = getSubcategories(parent.id);
                    const isExpanded = expandedCategories.includes(parent.id);
                    return (
                      <div
                        key={parent.id}
                        className="border border-bg-grey rounded-lg overflow-hidden"
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleCategory(parent.id)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && toggleCategory(parent.id)
                          }
                          className="w-full flex justify-between items-center p-4 bg-bg-light hover:bg-gray-100 transition-colors duration-200 cursor-pointer text-left"
                        >
                          <div className="flex-1 flex items-center gap-2 transition-all duration-200">
                            <span
                              className={`text-primary font-bold text-lg transition-transform duration-300 ${isExpanded ? "rotate-90" : "rotate-0"}`}
                            >
                              ▶
                            </span>
                            <h3 className="text-xl font-bold text-dark m-0">
                              {parent.name}
                            </h3>
                            {subcategories.length > 0 && (
                              <span className="text-sm text-gray-500 ml-2">
                                ({subcategories.length} subcategor
                                {subcategories.length === 1 ? "y" : "ies"})
                              </span>
                            )}
                          </div>
                          <div
                            className="flex gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button onClick={() => handleEdit(parent)}>
                              Edit
                            </Button>
                            <Button onClick={() => confirmDelete(parent)}>
                              Delete
                            </Button>
                          </div>
                        </div>

                        <div
                          className={`border-t border-bg-grey overflow-hidden transition-all duration-300 ease-in-out ${
                            isExpanded && subcategories.length > 0
                              ? "max-h-500 opacity-100"
                              : "max-h-0 opacity-0"
                          }`}
                        >
                          <div className="p-4 ml-8 flex flex-col gap-2">
                            <p className="text-sm font-semibold text-gray-600">
                              Subcategories:
                            </p>
                            {subcategories.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex justify-between items-center bg-white p-3 rounded border-l-4 border-primary"
                              >
                                <div className="flex-1">
                                  <p className="font-semibold text-dark m-0">
                                    {sub.name}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button onClick={() => handleEdit(sub)}>
                                    Edit
                                  </Button>
                                  <Button onClick={() => confirmDelete(sub)}>
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </ResponsiveWidthWrapper>
    </div>
  );
}
