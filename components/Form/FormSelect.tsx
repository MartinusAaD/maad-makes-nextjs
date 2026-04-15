import { ComponentPropsWithoutRef, ReactNode } from "react";

interface FormSelectProps extends ComponentPropsWithoutRef<"select"> {
  className?: string;
  error?: boolean;
  children?: ReactNode;
}

const FormSelect = ({
  className = "",
  error = false,
  children,
  ...props
}: FormSelectProps) => (
  <select
    className={`w-full p-2 rounded border-2 ${
      error
        ? "border-red-500 focus:border-red-600 focus:ring-red-200"
        : "border-primary/50 focus:border-primary focus:ring-primary/20"
    } bg-white disabled:bg-bg-light disabled:text-dark/50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 transition-colors ${className}`}
    aria-invalid={error ? "true" : "false"}
    {...props}
  >
    {children}
  </select>
);

export default FormSelect;
