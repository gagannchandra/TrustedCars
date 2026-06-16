import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info" | "warning";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

let _id = 0;
const listeners = new Set<(toasts: Toast[]) => void>();
let _toasts: Toast[] = [];

const emit = () => listeners.forEach((l) => l([..._toasts]));

function add(message: string, type: ToastType) {
  const id = ++_id;
  _toasts = [..._toasts, { id, message, type }];
  emit();
  setTimeout(() => {
    _toasts = _toasts.filter((t) => t.id !== id);
    emit();
  }, 3500);
}

export const toast = {
  success: (m: string) => add(m, "success"),
  error: (m: string) => add(m, "error"),
  info: (m: string) => add(m, "info"),
  warning: (m: string) => add(m, "warning"),
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>(_toasts);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:left-auto sm:right-6 sm:translate-x-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-slide-up flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-lg"
        >
          <div
            className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-white ${
              t.type === "success"
                ? "bg-brand-500"
                : t.type === "error"
                ? "bg-red-500"
                : t.type === "warning"
                ? "bg-amber-500"
                : "bg-slate-700"
            }`}
          >
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : t.type === "warning" ? "!" : "i"}
          </div>
          <div className="text-sm font-medium text-slate-900">{t.message}</div>
        </div>
      ))}
    </div>
  );
}
