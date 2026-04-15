import { ReactNode } from "react";

interface ResponsiveWidthWrapperProps {
  children?: ReactNode;
  classNameWrapper?: string;
  classNameContainer?: string;
}

const ResponsiveWidthWrapper = ({
  children,
  classNameWrapper,
  classNameContainer,
}: ResponsiveWidthWrapperProps) => {
  return (
    <div className={`w-full flex justify-center ${classNameWrapper || ""}`}>
      <div
        className={`w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${
          classNameContainer || ""
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default ResponsiveWidthWrapper;
