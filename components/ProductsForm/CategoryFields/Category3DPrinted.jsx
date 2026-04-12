import Button from "@/components/Button/Button";
import ButtonSquare from "@/components/ButtonSquare/ButtonSquare";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";
import FormGroup from "@/components/Form/FormGroup";
import FormLabel from "@/components/Form/FormLabel";
import FormInput from "@/components/Form/FormInput";
import FormFieldset from "@/components/Form/FormFieldset";
import FilamentSelector from "@/components/FilamentSelector/FilamentSelector";
import FormTextarea from "@/components/Form/FormTextarea";

const Category3DPrinted = ({
  formData,
  handleChange,
  handleAddColor,
  handleRemoveColor,
}) => {
  return (
    <FormFieldset legend="3D-Printed Model Related Data">
      <FormGroup>
        <FormLabel htmlFor="printedModal.printTime">
          Print Time: (HH:MM)
        </FormLabel>
        <div className="flex justify-between gap-2">
          <FormInput
            type="number"
            id="printedModel.printTime.hours"
            name="printedModel.printTime.hours"
            value={formData.printedModel.printTime.hours}
            onChange={handleChange}
            placeholder="HH"
            min={0}
          />
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
      </FormGroup>

      <FormGroup>
        <FormLabel>Printing Description:</FormLabel>
        <FormTextarea
          id="printedModel.description"
          name="printedModel.description"
          value={formData.printedModel.description}
          onChange={handleChange}
          placeholder="Enter print setting changes etc..."
        />
      </FormGroup>

      <FormGroup>
        <FormLabel>Filament & Grams Requirement</FormLabel>

        {formData.printedModel.printColors.map((item, index) => {
          return (
            <div key={index} className="flex justify-between gap-2 items-end">
              <div className="flex-1">
                <FormLabel
                  htmlFor={`printedModel.printColors.${index}.filamentId`}
                >
                  Select Filament:
                </FormLabel>
                <FilamentSelector
                  id={`printedModel.printColors.${index}.filamentId`}
                  name={`printedModel.printColors.${index}.filamentId`}
                  value={item.filamentId || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="flex-1">
                <FormLabel htmlFor={`printedModel.printColors.${index}.grams`}>
                  Grams Requirement:
                </FormLabel>
                <FormInput
                  type="number"
                  id={`printedModel.printColors.${index}.grams`}
                  name={`printedModel.printColors.${index}.grams`}
                  value={item.grams}
                  onChange={handleChange}
                  placeholder="Grams"
                  min={0}
                  step="0.1"
                />
              </div>

              <ButtonSquare
                type="button"
                onClick={() => handleRemoveColor(index)}
                className="h-[42px] w-[42px]"
              >
                <FontAwesomeIcon icon={faX} />
              </ButtonSquare>
            </div>
          );
        })}

        <Button type="button" onClick={handleAddColor} className="mt-2">
          Add Filament
        </Button>
      </FormGroup>
    </FormFieldset>
  );
};

export default Category3DPrinted;
