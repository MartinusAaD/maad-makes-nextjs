import FormGroup from "@/components/Form/FormGroup";
import FormLabel from "@/components/Form/FormLabel";
import FormInput from "@/components/Form/FormInput";
import FormFieldset from "@/components/Form/FormFieldset";

const CategoryFilaments = ({ formData, handleChange }) => {
  return (
    <FormFieldset legend="Filament Related Data">
      <FormGroup>
        <FormLabel htmlFor="filamentData.type">Type:</FormLabel>
        <FormInput
          type="text"
          id="filamentData.type"
          name="filamentData.type"
          value={formData.filamentData.type}
          onChange={handleChange}
          placeholder="PLA, AMS, etc..."
        />
      </FormGroup>

      <FormGroup>
        <FormLabel htmlFor="filamentData.finish">Finish:</FormLabel>
        <FormInput
          type="text"
          id="filamentData.finish"
          name="filamentData.finish"
          value={formData.filamentData.finish}
          onChange={handleChange}
          placeholder="Matte, Basic, etc..."
        />
      </FormGroup>

      <FormGroup>
        <FormLabel htmlFor="filamentData.hexCode">Hex Code:</FormLabel>
        <FormInput
          type="text"
          id="filamentData.hexCode"
          name="filamentData.hexCode"
          value={formData.filamentData.hexCode}
          onChange={handleChange}
          placeholder="#113e53"
        />
      </FormGroup>

      <FormGroup>
        <FormLabel htmlFor="filamentData.diameter">Diameter:</FormLabel>
        <FormInput
          type="text"
          id="filamentData.diameter"
          name="filamentData.diameter"
          value={formData.filamentData.diameter}
          onChange={handleChange}
          placeholder="1,75mm +/- 0,03mm"
        />
      </FormGroup>

      <FormGroup>
        <FormLabel htmlFor="filamentData.printingTemp">
          Printing Temp:
        </FormLabel>
        <FormInput
          type="text"
          id="filamentData.printingTemp"
          name="filamentData.printingTemp"
          value={formData.filamentData.printingTemp}
          onChange={handleChange}
          placeholder="190 - 230°C"
        />
      </FormGroup>

      <FormGroup>
        <FormLabel htmlFor="filamentData.dryingConditions">
          Drying Conditions:
        </FormLabel>
        <FormInput
          type="text"
          id="filamentData.dryingConditions"
          name="filamentData.dryingConditions"
          value={formData.filamentData.dryingConditions}
          onChange={handleChange}
          placeholder="Enter the filaments drying condition details"
        />
      </FormGroup>
    </FormFieldset>
  );
};

export default CategoryFilaments;
