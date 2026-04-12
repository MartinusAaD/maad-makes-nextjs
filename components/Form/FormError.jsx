import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";

const FormError = ({ error, className = "" }) => {
  if (!error) return null;
  return (
    <div
      className={`text-red-600 text-sm flex items-center gap-1 mt-1 ${className}`}
      role="alert"
    >
      <FontAwesomeIcon icon={faExclamationCircle} className="text-xs" />
      <span>{error}</span>
    </div>
  );
};

export default FormError;
