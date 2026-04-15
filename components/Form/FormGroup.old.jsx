const FormGroup = ({ children, className = "" }) => (
  <div className={`w-full flex flex-col gap-1 ${className}`}>{children}</div>
);

export default FormGroup;
