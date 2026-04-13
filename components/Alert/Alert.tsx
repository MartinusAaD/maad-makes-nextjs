"use client";

import { useCallback, useEffect, useState } from "react";

type AlertType = "info" | "success" | "error" | "warning";

interface AlertProps {
  alertMessage?: string;
  onClose?: () => void;
  duration?: number;
  type?: AlertType;
}

const Alert = ({
  alertMessage = "Something happened!",
  onClose,
  duration = 4000,
  type = "info",
}: AlertProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
    const dismissTimer = setTimeout(() => {
      handleClose();
    }, duration);
    return () => {
      clearTimeout(dismissTimer);
    };
  }, [duration, handleClose]);

  const typeStyles: Record<AlertType, string> = {
    info: "bg-primary text-light",
    success: "bg-green text-light",
    error: "bg-red text-light",
    warning: "bg-yellow text-light",
  };

  return (
    <div
      className={`fixed top-35 left-1/2 -translate-x-1/2 z-9999 min-w-75 max-w-125 px-6 py-4 rounded-lg shadow-[0_0_10px_5px_rgba(0,0,0,0.4)] transition-all duration-300 ${
        typeStyles[type]
      } ${
        isVisible && !isExiting
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="m-0 font-semibold">{alertMessage}</p>
        <button
          onClick={handleClose}
          className="text-current opacity-70 hover:opacity-100 text-xl leading-none border-none bg-transparent cursor-pointer p-0"
          aria-label="Close alert"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Alert;
