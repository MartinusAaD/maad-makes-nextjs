import styles from "./PokemonType.module.css";

const PokemonType = ({ type }) => {
  if (!type) return null;

  const typeClass = type.toLowerCase().replace(/\s+/g, "-");

  return (
    <span
      className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.3)] ${styles[typeClass]}`}
    >
      {type}
    </span>
  );
};

export default PokemonType;
