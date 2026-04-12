import styles from "./PokemonType.module.css";

const PokemonType = ({ type }) => {
  if (!type) return null;

  const typeClass = type.toLowerCase().replace(/\s+/g, "-");

  return (
    <span className={`${styles.typeTag} ${styles[typeClass]}`}>{type}</span>
  );
};

export default PokemonType;
