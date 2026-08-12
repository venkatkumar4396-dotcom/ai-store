"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
  error: <XCircle className="h-5 w-5 text-rose-400" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-400" />,
  info: <Info className="h-5 w-5 text-indigo-400" />,
};

const TOAST_STYLES: Record<ToastType, string> = {
  success: "border-emerald-500/20 bg-emerald-950/80",
  error: "border-rose-500/20 bg-rose-950/80",
  warning: "border-amber-500/20 bg-amber-950/80",
  info: "border-indigo-500/20 bg-indigo-950/80",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  React.useEffect(() => {
    const timeout = setTimeout(onDismiss, toast.duration || 4000);
    return () => clearTimeout(timeout);
  }, [toast.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className={`relative flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl shadow-black/20 max-w-sm w-full ${TOAST_STYLES[toast.type]}`}
    >
      <div className="shrink-0 mt-0.5">{TOAST_ICONS[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-white">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{toast.description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors p-0.5 rounded-md hover:bg-white/5"
      >
        <X className="h-4 w-4" />
      </button>
      {/* Auto-dismiss progress bar */}
      <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full overflow-hidden bg-white/5">
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: (toast.duration || 4000) / 1000, ease: "linear" }}
          className={`h-full rounded-full ${
            toast.type === "success" ? "bg-emerald-500/50" :
            toast.type === "error" ? "bg-rose-500/50" :
            toast.type === "warning" ? "bg-amber-500/50" :
            "bg-indigo-500/50"
          }`}
        />
      </div>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]); // Max 5 visible
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onDismiss={() => removeToast(toast.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
