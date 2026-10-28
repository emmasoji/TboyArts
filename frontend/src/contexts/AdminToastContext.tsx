import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AdminToastType = "success" | "error";

export type AdminToastPayload = {
  type: AdminToastType;
  message: string;
  duration?: number;
};

type AdminToastItem = AdminToastPayload & {
  id: string;
};

type AdminToastContextValue = {
  toasts: AdminToastItem[];
  showToast: (payload: AdminToastPayload) => void;
  dismissToast: (id: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

const AdminToastContext =
  createContext<AdminToastContextValue | null>(null);

export function AdminToastProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [toasts, setToasts] = useState<AdminToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (payload: AdminToastPayload) => {
      const id = `\( {Date.now()}- \){Math.random().toString(36).slice(2, 8)}`;
      const duration = payload.duration ?? 3200;

      setToasts((prev) => [...prev, { ...payload, id }]);

      window.setTimeout(() => {
        dismissToast(id);
      }, duration);
    },
    [dismissToast],
  );

  const success = useCallback(
    (message: string) => showToast({ type: "success", message }),
    [showToast],
  );

  const error = useCallback(
    (message: string) => showToast({ type: "error", message }),
    [showToast],
  );

  const value = useMemo(
    () => ({ toasts, showToast, dismissToast, success, error }),
    [toasts, showToast, dismissToast, success, error],
  );

  return (
    <AdminToastContext.Provider value={value}>
      {children}
    </AdminToastContext.Provider>
  );
}

export function useAdminToast() {
  const ctx = useContext(AdminToastContext);
  if (!ctx) {
    throw new Error("useAdminToast must be used within AdminToastProvider");
  }
  return ctx;
}
