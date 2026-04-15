const FormLabel = ({ htmlFor, children, title, ...props }) => (
  <label htmlFor={htmlFor} className="font-bold" title={title} {...props}>
    {children}
  </label>
);

export default FormLabel;
