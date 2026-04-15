import { ComponentPropsWithoutRef, ReactNode } from "react";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  className?: string;
  children?: ReactNode;
  type?: "button" | "submit" | "reset";
}

const Button = ({
  className = "",
  children = "Click",
  type = "button",
  ...props
}: ButtonProps) => {
  return (
    <button
      className={`w-full text-base px-2 py-1 rounded border-2 border-primary/50 text-light font-bold bg-primary hover:bg-primary-lighter active:[&>p]:scale-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      type={type}
      {...props}
    >
      <p>{children}</p>
    </button>
  );
};

export default Button;
