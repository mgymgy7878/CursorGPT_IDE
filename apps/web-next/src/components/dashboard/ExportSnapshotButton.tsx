"use client";
import { useState } from "react";
import { toast } from "@/components/toast/Toaster";

type Props = {
  hours?: number;
  label?: string;
};

export default function ExportSnapshotButton({ hours = 24, label = "📤 Dışa Aktar" }: Props) {
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<"json" | "csv">("json");

  async function exportSnapshot(selectedFormat: "json" | "csv") {
    setLoading(true);
    try {
      const res = await fetch("/api/snapshot/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: selectedFormat, hours })
      });

      if (selectedFormat === "csv") {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snapshot-${hours}h-${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        
        if (data._err) {
          toast({
            type: "error",
            title: "Export Hatası",
            description: data._err
          });
          return;
        }
        
        // Download JSON
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snapshot-${hours}h-${Date.now()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      toast({
        type: "success",
        title: "Export Başarılı",
        description: `${selectedFormat.toUpperCase()} dosyası indirildi (${hours}h)`
      });
    } catch (e: any) {
      toast({
        type: "error",
        title: "Export Hatası",
        description: e?.message || "Bilinmeyen hata"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => exportSnapshot("json")}
        disabled={loading}
        className="btn btn-xs btn-secondary"
        title={`Son ${hours} saat JSON`}
      >
        {loading ? "⏳" : "📄"} JSON
      </button>
      <button
        onClick={() => exportSnapshot("csv")}
        disabled={loading}
        className="btn btn-xs btn-secondary"
        title={`Son ${hours} saat CSV`}
      >
        {loading ? "⏳" : "📊"} CSV
      </button>
    </div>
  );
}

