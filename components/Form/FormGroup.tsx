import { ReactNode } from "react";

interface FormGroupProps {
  children?: ReactNode;
  className?: string;
}

const FormGroup = ({ children, className = "" }: FormGroupProps) => (
  <div className={`w-full flex flex-col gap-1 ${className}`}>{children}</div>
);

export default FormGroup;
