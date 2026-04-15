import pokemonTypingList from "@/data/pokemonTypingList";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import FormInput from "@/components/Form/FormInput";
import FormSelect from "@/components/Form/FormSelect";
import { SectionCard, FieldLabel } from "../SectionCard";
import type { Product } from "@/types/product";
import React from "react";

interface CategoryPokemonProps {
  formData: Product;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
}

const CategoryPokemon = ({ formData, handleChange }: CategoryPokemonProps) => {
  return (
    <SectionCard title="Pokemon">
      {/* Pokemon + Pokedex Number */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor="pokemonData.pokemon">Pokemon</FieldLabel>
          <FormInput
            type="text"
            id="pokemonData.pokemon"
            name="pokemonData.pokemon"
            value={formData.pokemonData.pokemon}
            onChange={handleChange}
            placeholder="Pikachu, Bulbasaur..."
          />
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor="pokemonData.pokedexNumber">
            Pokédex Number
          </FieldLabel>
          <FormInput
            type="text"
            id="pokemonData.pokedexNumber"
            name="pokemonData.pokedexNumber"
            value={formData.pokemonData.pokedexNumber}
            onChange={handleChange}
            placeholder="#0025"
          />
        </div>
      </div>

      {/* Pokedex Entry */}
      <div className="flex flex-col gap-1">
        <FieldLabel htmlFor="pokemonData.pokedexEntry">
          Pokédex Entry
        </FieldLabel>
        <FormInput
          type="text"
          id="pokemonData.pokedexEntry"
          name="pokemonData.pokedexEntry"
          value={formData.pokemonData.pokedexEntry}
          onChange={handleChange}
          placeholder="Enter the Pokédex entry"
        />
      </div>

      {/* Generation + Typing */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor="pokemonData.generation">Generation</FieldLabel>
          <FormInput
            type="text"
            id="pokemonData.generation"
            name="pokemonData.generation"
            value={formData.pokemonData.generation}
            onChange={handleChange}
            placeholder="Gen 1"
          />
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor="pokemonData.typing.typing1">Type 1</FieldLabel>
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
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor="pokemonData.typing.typing2">Type 2</FieldLabel>
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
      </div>

      {/* Shiny toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div className="relative shrink-0">
          <input
            type="checkbox"
            className="sr-only"
            id="pokemonData.isShiny"
            name="pokemonData.isShiny"
            checked={formData.pokemonData.isShiny}
            onChange={handleChange}
          />
          <div
            className={`w-11 h-6 rounded-full transition-colors duration-200 ${
              formData.pokemonData.isShiny ? "bg-yellow-400" : "bg-gray-200"
            }`}
          />
          <div
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
              formData.pokemonData.isShiny ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-dark leading-tight">
            Shiny{" "}
            <FontAwesomeIcon
              icon={faStar}
              className="text-yellow-400 w-3 h-3"
            />
          </p>
          <p className="text-xs text-dark/45 leading-tight">
            Check if this is a shiny variant
          </p>
        </div>
      </label>
    </SectionCard>
  );
};

export default CategoryPokemon;
