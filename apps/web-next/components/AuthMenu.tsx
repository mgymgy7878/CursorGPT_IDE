"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiSignOut } from "../lib/api";

export default function AuthMenu() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSignOut() {
    setLoading(true);
    try { await apiSignOut(); } finally {
      setLoading(false);
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onSignOut}
        disabled={loading}
        className="px-3 py-1 rounded-xl border shadow-sm hover:shadow transition"
        title="Oturumu kapat"
      >
        {loading ? "Çıkış..." : "Çıkış yap"}
      </button>
    </div>
  );
} 
