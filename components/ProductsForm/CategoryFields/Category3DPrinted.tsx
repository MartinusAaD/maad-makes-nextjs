import React from "react";
import Button from "@/components/Button/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";
import FormInput from "@/components/Form/FormInput";
import FormTextarea from "@/components/Form/FormTextarea";
import FilamentSelector from "@/components/FilamentSelector/FilamentSelector";
import { SectionCard, FieldLabel } from "../SectionCard";
import type { Product } from "@/types/product";

interface Category3DPrintedProps {
  formData: Product;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  handleFieldChange: (name: string, value: string) => void;
  handleAddColor: () => void;
  handleRemoveColor: (index: number) => void;
}

const Category3DPrinted = ({
  formData,
  handleChange,
  handleFieldChange,
  handleAddColor,
  handleRemoveColor,
}: Category3DPrintedProps) => {
  return (
    <SectionCard title="3D-Printed Model">
      {/* Print Time */}
      <div className="flex flex-col gap-2">
        <FieldLabel>Print Time (HH:MM)</FieldLabel>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-dark/40">Hours</span>
            <FormInput
              type="number"
              id="printedModel.printTime.hours"
              name="printedModel.printTime.hours"
              value={formData.printedModel.printTime.hours}
              onChange={handleChange}
              placeholder="HH"
              min={0}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-dark/40">Minutes</span>
            <FormInput
              type="number"
              id="printedModel.printTime.minutes"
              name="printedModel.printTime.minutes"
              value={formData.printedModel.printTime.minutes}
              onChange={handleChange}
              placeholder="MM"
              min={0}
            />
          </div>
        </div>
      </div>

      {/* Printing Description */}
      <div className="flex flex-col gap-1">
        <FieldLabel htmlFor="printedModel.description">
          Printing Description
        </FieldLabel>
        <FormTextarea
          id="printedModel.description"
          name="printedModel.description"
          value={formData.printedModel.description}
          onChange={handleChange}
          placeholder="Enter print setting changes etc..."
        />
      </div>

      {/* Filament & Grams */}
      <div className="flex flex-col gap-3">
        <FieldLabel>Filament & Grams Requirement</FieldLabel>

        {formData.printedModel.printColors.map((item, index) => (
          <div key={index} className="flex gap-3 items-end">
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-xs text-dark/40">Filament</span>
              <FilamentSelector
                id={`printedModel.printColors.${index}.filamentId`}
                name={`printedModel.printColors.${index}.filamentId`}
                value={item.filamentId || ""}
                onChange={handleFieldChange}
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-xs text-dark/40">Grams</span>
              <FormInput
                type="number"
                id={`printedModel.printColors.${index}.grams`}
                name={`printedModel.printColors.${index}.grams`}
                value={item.grams}
                onChange={handleChange}
                placeholder="g"
                min={0}
                step="0.1"
              />
            </div>
            <button
              type="button"
              className="flex items-center justify-center w-9 h-9 rounded-lg border-2 border-red/30 bg-white text-red hover:bg-red hover:text-white transition-colors shrink-0"
              onClick={() => handleRemoveColor(index)}
            >
              <FontAwesomeIcon icon={faX} className="w-3 h-3" />
            </button>
          </div>
        ))}

        <Button type="button" onClick={handleAddColor} className="mt-1">
          Add Filament
        </Button>
      </div>
    </SectionCard>
  );
};

export default Category3DPrinted;
