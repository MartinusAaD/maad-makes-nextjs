"use client";

import Button from "@/components/Button/Button";
import { useCategories } from "@/context/CategoriesContext";

const CategoryList = ({ categories, setCategories, setShowModal }) => {
  const { categories: fetchedCategories, loading } = useCategories();

  // Handle checkbox toggle
  const handleChange = (id) => {
    const category = fetchedCategories.find((cat) => cat.id === id);

    // Get all descendants of a category recursively
    const getAllDescendants = (catId) => {
      const descendants = [];
      const children = getSubcategories(catId);
      children.forEach((child) => {
        descendants.push(child.id);
        descendants.push(...getAllDescendants(child.id));
      });
      return descendants;
    };

    if (categories.includes(id)) {
      // Unchecking a category
      if (!category.parentId) {
        // If unchecking a parent, also uncheck all its subcategories (including nested)
        const descendantIds = getAllDescendants(id);
        setCategories(
          categories.filter(
            (catId) => catId !== id && !descendantIds.includes(catId),
          ),
        );
      } else {
        // Uncheck this subcategory and all its descendants
        const descendantIds = getAllDescendants(id);
        setCategories(
          categories.filter(
            (catId) => catId !== id && !descendantIds.includes(catId),
          ),
        );
      }
    } else {
      // Checking a category
      if (category.parentId) {
        // If checking a subcategory, also check all its parents up the chain
        const parentsToCheck = [];
        let currentCat = category;
        while (currentCat.parentId) {
          if (!categories.includes(currentCat.parentId)) {
            parentsToCheck.push(currentCat.parentId);
          }
          currentCat = fetchedCategories.find(
            (c) => c.id === currentCat.parentId,
          );
          if (!currentCat) break;
        }
        setCategories([...categories, ...parentsToCheck, id]);
      } else {
        // Just check the parent category
        setCategories([...categories, id]);
      }
    }
  };

  // Get parent categories (no parentId)
  const parentCategories = fetchedCategories.filter((cat) => !cat.parentId);

  // Get subcategories for a parent
  const getSubcategories = (parentId) => {
    return fetchedCategories.filter((cat) => cat.parentId === parentId);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col justify-center items-center bg-black/60 p-4">
      <div className="w-full max-w-md max-h-[80vh] flex flex-col bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary p-6 border-b-4 border-primary-darker">
          <h2 className="text-2xl font-bold text-light m-0">
            Select Categories
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <p className="text-center text-gray-500">Loading categories...</p>
          ) : (
            <div className="flex flex-col gap-3">
              {parentCategories?.map((parent) => {
                const subcategories = getSubcategories(parent.id);
                return (
                  <div key={parent.id} className="flex flex-col gap-2">
                    {/* Parent Category */}
                    <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-light transition-colors cursor-pointer group">
                      <input
                        type="checkbox"
                        name={parent.name}
                        checked={categories.includes(parent.id)}
                        onChange={() => handleChange(parent.id)}
                        className="w-5 h-5 rounded border-2 border-primary text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                      />
                      <span className="font-bold text-dark group-hover:text-primary transition-colors">
                        {parent.name}
                      </span>
                    </label>

                    {/* Subcategories */}
                    {subcategories.length > 0 && (
                      <div className="ml-8 flex flex-col gap-2 border-l-2 border-bg-grey pl-4">
                        {subcategories.map((sub) => (
                          <label
                            key={sub.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-light transition-colors cursor-pointer group"
                          >
                            <input
                              type="checkbox"
                              name={sub.name}
                              checked={categories.includes(sub.id)}
                              onChange={() => handleChange(sub.id)}
                              className="w-4 h-4 rounded border-2 border-primary text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                            />
                            <span className="text-sm text-dark group-hover:text-primary transition-colors">
                              {sub.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-bg-grey bg-bg-light">
          <Button onClick={() => setShowModal(false)}>Done</Button>
        </div>
      </div>
    </div>
  );
};

export default CategoryList;
