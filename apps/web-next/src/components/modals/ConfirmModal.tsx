"use client";
import { useState } from "react";

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Onayla",
  cancelText = "İptal",
  variant = "info",
  isLoading = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: "border-red-800 bg-red-900/20",
    warning: "border-yellow-800 bg-yellow-900/20",
    info: "border-blue-800 bg-blue-900/20"
  };

  const buttonStyles = {
    danger: "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-yellow-600 hover:bg-yellow-700 text-white",
    info: "bg-blue-600 hover:bg-blue-700 text-white"
  };

  const iconStyles = {
    danger: "🔴",
    warning: "⚠️",
    info: "ℹ️"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative rounded-2xl border p-6 max-w-md w-full mx-4 ${variantStyles[variant]}`}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{iconStyles[variant]}</span>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        
        <p className="text-sm text-neutral-300 mb-6 leading-relaxed">
          {message}
        </p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm rounded-lg ${buttonStyles[variant]} disabled:opacity-50`}
          >
            {isLoading ? "⏳" : "✓"} {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
