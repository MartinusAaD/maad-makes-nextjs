const typeColors = {
  normal: "#a8a878",
  fire: "#f08030",
  water: "#6890f0",
  electric: "#f8d030",
  grass: "#78c850",
  ice: "#98d8d8",
  fighting: "#c03028",
  poison: "#a040a0",
  ground: "#e0c068",
  flying: "#a890f0",
  psychic: "#f85888",
  bug: "#a8b820",
  rock: "#b8a038",
  ghost: "#705898",
  dragon: "#7038f8",
  dark: "#292522",
  steel: "#b8b8d0",
  fairy: "#ee99ac",
};

type PokemonTypeName = keyof typeof typeColors;

interface PokemonTypeProps {
  type?: string;
}

const PokemonType = ({ type }: PokemonTypeProps) => {
  if (!type) return null;

  const typeKey = type.toLowerCase().replace(/\s+/g, "-") as PokemonTypeName;
  const backgroundColor = typeColors[typeKey] ?? "#a8a878";

  return (
    <span
      className="inline-block px-2 py-1 rounded text-xs font-bold uppercase text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.3)]"
      style={{ backgroundColor }}
    >
      {type}
    </span>
  );
};

export default PokemonType;
