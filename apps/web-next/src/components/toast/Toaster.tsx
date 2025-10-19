"use client";
import { useState, useEffect } from "react";

type Toast = {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
  retryAfter?: string;
  duration?: number;
};

let toastCounter = 0;
const toastListeners: ((toast: Toast) => void)[] = [];

export function toast(toastData: Omit<Toast, "id">) {
  const id = `toast-${++toastCounter}`;
  const toast: Toast = {
    id,
    duration: 5000,
    ...toastData
  };
  
  toastListeners.forEach(listener => listener(toast));
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts(prev => [...prev, toast]);
      
      // Auto remove after duration
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, toast.duration || 5000);
    };

    toastListeners.push(listener);
    return () => {
      const index = toastListeners.indexOf(listener);
      if (index > -1) toastListeners.splice(index, 1);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, removeToast };
}

export default function Toaster() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg border shadow-lg max-w-sm ${
            toast.type === "success" ? "bg-green-900 border-green-700 text-green-100" :
            toast.type === "error" ? "bg-red-900 border-red-700 text-red-100" :
            toast.type === "warning" ? "bg-amber-900 border-amber-700 text-amber-100" :
            "bg-blue-900 border-blue-700 text-blue-100"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{toast.title}</div>
              {toast.description && (
                <div className="text-sm opacity-90 mt-1">{toast.description}</div>
              )}
              {toast.retryAfter && (
                <div className="text-xs opacity-75 mt-1">
                  Retry after: {toast.retryAfter}s
                </div>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-lg leading-none opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
