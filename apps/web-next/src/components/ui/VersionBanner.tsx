"use client";
import { useState } from "react";
import { toast } from "@/components/toast/Toaster";

export default function VersionBanner() {
  // Bu değerler normalde build time'da env'den veya manifest'ten gelir
  const featureVersion = process.env.NEXT_PUBLIC_FEATURE_VERSION || "v2.0";
  const modelVersion = process.env.NEXT_PUBLIC_MODEL_VERSION || "ml-fusion-1.2";
  const buildSha = process.env.NEXT_PUBLIC_BUILD_SHA || "dev";
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();

  const copyBuildSha = async () => {
    try {
      await navigator.clipboard.writeText(buildSha);
      toast({
        type: "success",
        title: "Build SHA Kopyalandı",
        description: buildSha.slice(0, 12)
      });
    } catch (e) {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = buildSha;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      
      toast({
        type: "success",
        title: "Build SHA Kopyalandı",
        description: buildSha.slice(0, 12)
      });
    }
  };

  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-500">
        <div className="flex flex-wrap gap-4">
          <div>
            <span className="font-medium text-neutral-400">Feature:</span> {featureVersion}
          </div>
          <div>
            <span className="font-medium text-neutral-400">Model:</span> {modelVersion}
          </div>
          <div>
            <span className="font-medium text-neutral-400">Build:</span>{" "}
            <button
              onClick={copyBuildSha}
              className="font-mono text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              title="Click to copy full SHA"
            >
              {buildSha.slice(0, 7)}
            </button>
          </div>
          <div suppressHydrationWarning>
            <span className="font-medium text-neutral-400">Built:</span>{" "}
            {typeof window !== 'undefined' ? new Date(buildTime).toLocaleString('tr-TR') : buildTime}
          </div>
        </div>
        
        <div className="text-neutral-600">
          © {new Date().getFullYear()} Spark Trading Platform
        </div>
      </div>
    </footer>
  );
}

