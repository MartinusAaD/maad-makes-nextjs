import pokemonTypingList from "@/data/pokemonTypingList";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import FormGroup from "@/components/Form/FormGroup";
import FormLabel from "@/components/Form/FormLabel";
import FormInput from "@/components/Form/FormInput";
import FormSelect from "@/components/Form/FormSelect";
import FormFieldset from "@/components/Form/FormFieldset";

const CategoryPokemon = ({ formData, handleChange }) => {
  return (
    <FormFieldset legend="Pokemon Related Data">
      <FormGroup>
        <FormLabel htmlFor="pokemonData.pokemon">Pokemon:</FormLabel>
        <FormInput
          type="text"
          id="pokemonData.pokemon"
          name="pokemonData.pokemon"
          value={formData.pokemonData.pokemon}
          onChange={handleChange}
          placeholder="Pikachu etc.."
        />
      </FormGroup>

      <FormGroup>
        <FormLabel htmlFor="pokemonData.pokedexNumber">
          Pokedex Number:
        </FormLabel>
        <FormInput
          type="text"
          id="pokemonData.pokedexNumber"
          name="pokemonData.pokedexNumber"
          value={formData.pokemonData.pokedexNumber}
          onChange={handleChange}
          placeholder="#0123"
        />
      </FormGroup>

      <FormGroup>
        <FormLabel htmlFor="pokemonData.pokedexEntry">Pokedex Entry:</FormLabel>
        <FormInput
          type="text"
          id="pokemonData.pokedexEntry"
          name="pokemonData.pokedexEntry"
          value={formData.pokemonData.pokedexEntry}
          onChange={handleChange}
          placeholder="Enter the pokemon pokedex entry"
        />
      </FormGroup>

      <FormGroup>
        <FormLabel htmlFor="pokemonData.generation">Generation:</FormLabel>
        <FormInput
          type="text"
          id="pokemonData.generation"
          name="pokemonData.generation"
          value={formData.pokemonData.generation}
          onChange={handleChange}
          placeholder="Gen 1"
        />
      </FormGroup>

      <FormGroup>
        <FormLabel htmlFor="pokemonData.typing">Typing:</FormLabel>
        <div className="flex flex-col gap-2">
          <FormSelect
            name="pokemonData.typing.typing1"
            id="pokemonData.typing.typing1"
            value={formData.pokemonData.typing.typing1}
            onChange={handleChange}
          >
            <option value="">Select Type 1</option>
            {pokemonTypingList.map((typing, i) => (
              <option key={i} value={typing}>
                {typing}
              </option>
            ))}
          </FormSelect>

          <FormSelect
            name="pokemonData.typing.typing2"
            id="pokemonData.typing.typing2"
            value={formData.pokemonData.typing.typing2}
            onChange={handleChange}
          >
            <option value="">Select Type 2</option>
            {pokemonTypingList.map((typing, i) => (
              <option key={i} value={typing}>
                {typing}
              </option>
            ))}
          </FormSelect>
        </div>
      </FormGroup>

      <div className="w-full flex flex-row items-center gap-1">
        <input
          type="checkbox"
          id="pokemonData.isShiny"
          name="pokemonData.isShiny"
          className="w-6 h-6 accent-primary"
          checked={formData.pokemonData.isShiny}
          onChange={handleChange}
        />
        <FormLabel htmlFor="pokemonData.isShiny">
          Check if the pokemon is shiny <FontAwesomeIcon icon={faStar} />
        </FormLabel>
      </div>
    </FormFieldset>
  );
};

export default CategoryPokemon;
