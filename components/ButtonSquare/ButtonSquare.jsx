const ButtonSquare = ({ className = "", children = "Click", ...props }) => {
  return (
    <button
      className={`text-base p-2 rounded border-none text-light font-bold bg-primary hover:bg-primary-lighter active:[&>p]:scale-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      <p>{children}</p>
    </button>
  );
};

export default ButtonSquare;
