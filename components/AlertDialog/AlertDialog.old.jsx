import Button from "@/components/Button/Button";

const AlertDialog = ({
  title,
  alertTitle,
  message,
  alertMessage,
  onConfirm,
  confirmAction,
  onCancel,
  setShowModal,
}) => {
  const displayTitle = title || alertTitle || "Alert Title";
  const displayMessage = message || alertMessage || "Alert Message";
  const handleConfirm = onConfirm || confirmAction;
  const handleCancel = onCancel || setShowModal;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/50 overflow-hidden">
      <div className="p-8 max-w-md w-full mx-4 bg-light rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.3)] border-2 border-primary/40">
        <h1 className="text-2xl font-bold text-dark mb-4">{displayTitle}</h1>
        <p className="text-dark mb-6">{displayMessage}</p>
        <div className="flex gap-2">
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;
