"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { COMMANDS, executeCommand, type CommandResult } from "@/lib/command-palette";

export default function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<CommandResult | null>(null);

  // SSR-safe portal mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Body scroll lock when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  const handleClose = () => {
    close();
    setResult(null);
  };

  const filteredCommands = COMMANDS.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleExecute = async (commandId: string) => {
    setExecuting(true);
    setResult(null);

    try {
      const result = await executeCommand(commandId);
      setResult(result);
    } catch (err) {
      setResult({
        success: false,
        message: `Execution failed: ${err}`,
      });
    } finally {
      setExecuting(false);
    }
  };

  // Don't render anything until mounted (SSR-safe)
  if (!mounted) {
    return null;
  }

  // Don't render modal if closed
  if (!isOpen) {
    return null;
  }

  // Portal to document.body for global modal layer
  const modalContent = (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-start justify-center p-4 pt-[88px]"
      onClick={(e) => {
        // Close on overlay click
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Komut paleti"
    >
      <div
        className="bg-popover text-popover-foreground border border-border rounded-xl w-full max-w-[720px] min-w-[min(640px,calc(100vw-32px))] shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: 'min(70vh, 640px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-border shrink-0">
          <input
            type="text"
            placeholder="Komut ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-popover-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                handleClose();
              }
            }}
          />
        </div>

        {/* Commands List */}
        <div className="overflow-y-auto bg-popover flex-1 min-h-0" style={{ maxHeight: 'calc(min(70vh, 640px) - 200px)' }}>
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="text-sm font-medium mb-1">Komut bulunamadı</div>
              <div className="text-xs text-muted-foreground/70">Yazmaya başlayın veya farklı bir terim deneyin</div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredCommands.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => handleExecute(cmd.id)}
                  disabled={executing}
                  className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-popover-foreground"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cmd.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-popover-foreground">{cmd.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {cmd.description}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground uppercase">
                      {cmd.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Result Display */}
        {result && (
          <div
            className={`p-4 border-t ${
              result.success
                ? "bg-green-950/50 border-green-800"
                : "bg-red-950/50 border-red-800"
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-xl">
                {result.success ? "✅" : "❌"}
              </span>
              <div className="flex-1">
                <div className="font-medium text-popover-foreground">{result.message}</div>
                {result.details && (
                  <pre className="mt-2 text-xs text-muted-foreground bg-muted/30 rounded p-2 overflow-auto max-h-32">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground shrink-0">
          <div>
            Kapatmak için <kbd className="px-2 py-1 bg-muted rounded border border-border">Esc</kbd> tuşuna basın
          </div>
          <div>{filteredCommands.length} komut</div>
        </div>
      </div>
    </div>
  );

  // Portal to document.body to ensure it's above all layout elements
  return createPortal(modalContent, document.body);
}
