"use client";

import { useState, useRef, useEffect } from "react";
import { useFilaments } from "@/context/FilamentsContext";

const FilamentSelector = ({ value, onChange, name, id }) => {
  const { filaments, loading } = useFilaments();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Find selected filament
  const selectedFilament = filaments.find((f) => f.id === value);

  // Filter filaments based on search
  const filteredFilaments = filaments.filter((filament) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      filament.brand?.toLowerCase().includes(searchLower) ||
      filament.material?.toLowerCase().includes(searchLower) ||
      filament.color?.toLowerCase().includes(searchLower) ||
      filament.name?.toLowerCase().includes(searchLower)
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (filamentId) => {
    onChange({
      target: {
        name,
        value: filamentId,
      },
    });
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Display Selected Value */}
      <button
        type="button"
        id={id}
        onClick={handleOpen}
        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      >
        {loading ? (
          <span className="text-gray-400">Loading filaments...</span>
        ) : selectedFilament ? (
          <span>
            {selectedFilament.brand} - {selectedFilament.material} -{" "}
            {selectedFilament.color}
          </span>
        ) : (
          <span className="text-gray-400">-- Select a filament --</span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 flex flex-col">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search filaments..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Options List */}
          <div className="overflow-y-auto flex-1">
            {filteredFilaments.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-sm">
                No filaments found
              </div>
            ) : (
              <>
                {/* Clear Selection Option */}
                {value && (
                  <button
                    type="button"
                    onClick={() => handleSelect("")}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b border-gray-200 text-gray-500 italic"
                  >
                    -- Clear selection --
                  </button>
                )}

                {/* Filament Options */}
                {filteredFilaments.map((filament) => {
                  const isSelected = filament.id === value;
                  return (
                    <button
                      key={filament.id}
                      type="button"
                      onClick={() => handleSelect(filament.id)}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${
                        isSelected ? "bg-primary/10 font-semibold" : ""
                      }`}
                    >
                      {/* Color swatch */}
                      <div
                        className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: filament.hexColor }}
                      />
                      <span>
                        {filament.brand} - {filament.material} -{" "}
                        {filament.color}
                      </span>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilamentSelector;
