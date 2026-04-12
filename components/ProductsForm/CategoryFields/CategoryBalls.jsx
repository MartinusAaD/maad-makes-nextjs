import FormGroup from "@/components/Form/FormGroup";
import FormLabel from "@/components/Form/FormLabel";
import FormInput from "@/components/Form/FormInput";
import FormFieldset from "@/components/Form/FormFieldset";

const CategoryBalls = ({ formData, handleChange }) => {
  return (
    <FormFieldset legend="Ball Related Data">
      <FormGroup>
        <FormLabel htmlFor="ballData.type">Ball Type:</FormLabel>
        <FormInput
          type="text"
          id="ballData.type"
          name="ballData.type"
          value={formData.ballData.type}
          onChange={handleChange}
          placeholder="Pokeball, Greatball, etc..."
        />
      </FormGroup>

      <FormGroup>
        <FormLabel htmlFor="ballData.diameter">Diameter: {"(mm)"}</FormLabel>
        <FormInput
          type="text"
          id="ballData.diameter"
          name="ballData.diameter"
          value={formData.ballData.diameter}
          onChange={handleChange}
          placeholder="Enter the balls diameter"
        />
      </FormGroup>
    </FormFieldset>
  );
};

export default CategoryBalls;
