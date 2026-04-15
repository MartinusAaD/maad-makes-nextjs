import { ComponentPropsWithoutRef, ReactNode } from "react";

interface FormLabelProps extends ComponentPropsWithoutRef<"label"> {
  htmlFor?: string;
  children?: ReactNode;
  title?: string;
}

const FormLabel = ({ htmlFor, children, title, ...props }: FormLabelProps) => (
  <label htmlFor={htmlFor} className="font-bold" title={title} {...props}>
    {children}
  </label>
);

export default FormLabel;
