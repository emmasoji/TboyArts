import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useAdminToast,
  type AdminToastType,
} from "../../contexts/AdminToastContext";
import { useAdminTheme } from "../../contexts/AdminThemeContext";

function ToastCard({
  id,
  type,
  message,
  onDismiss,
}: {
  id: string;
  type: AdminToastType;
  message: string;
  onDismiss: (id: string) => void;
}) {
  const [phase, setPhase] = useState<"enter" | "shown" | "exit">("enter");
  const { theme } = useAdminTheme();
  const isLight = theme === "light";
  const isSuccess = type === "success";

  useEffect(() => {
    const enterId = window.setTimeout(() => setPhase("shown"), 20);
    return () => window.clearTimeout(enterId);
  }, []);

  // Parent removes after duration; start exit a bit earlier for animation
  useEffect(() => {
    const exitId = window.setTimeout(() => setPhase("exit"), 2600);
    return () => window.clearTimeout(exitId);
  }, []);

  useEffect(() => {
    if (phase !== "exit") return;
    const done = window.setTimeout(() => onDismiss(id), 420);
    return () => window.clearTimeout(done);
  }, [phase, id, onDismiss]);

  return (
    <div
      role="status"
      className={[
        "admin-toast",
        isSuccess ? "admin-toast--success" : "admin-toast--error",
        isLight ? "admin-toast--light" : "admin-toast--dark",
        phase === "enter" && "admin-toast--enter",
        phase === "shown" && "admin-toast--shown",
        phase === "exit" && "admin-toast--exit",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className={[
          "admin-toast-icon",
          isSuccess && "admin-toast-icon--flutter",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {isSuccess ? <Check size={16} strokeWidth={2.5} /> : <X size={16} strokeWidth={2.5} />}
      </span>
      <p className="admin-toast-message">{message}</p>
      <button
        type="button"
        className="admin-toast-close"
        aria-label="Dismiss"
        onClick={() => setPhase("exit")}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function AdminToast() {
  const { toasts, dismissToast } = useAdminToast();

  return (
    <div className="admin-toast-viewport" aria-live="polite">
      {toasts.map((t) => (
        <ToastCard
          key={t.id}
          id={t.id}
          type={t.type}
          message={t.message}
          onDismiss={dismissToast}
        />
      ))}
    </div>
  );
}

