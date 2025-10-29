"use client";
import { useState, useEffect } from "react";
import { COMMANDS, executeCommand, type CommandResult } from "@/lib/command-palette";

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<CommandResult | null>(null);

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      if (e.key === "Escape") {
        setIsOpen(false);
        setResult(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  if (!isOpen) {
    return null; // CopilotDock now handles the FAB
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 grid place-items-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800">
          <input
            type="text"
            placeholder="Search commands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              No commands found
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {filteredCommands.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => handleExecute(cmd.id)}
                  disabled={executing}
                  className="w-full text-left px-4 py-3 hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cmd.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-white">{cmd.label}</div>
                      <div className="text-sm text-neutral-400">
                        {cmd.description}
                      </div>
                    </div>
                    <span className="text-xs text-neutral-500 uppercase">
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
                <div className="font-medium text-white">{result.message}</div>
                {result.details && (
                  <pre className="mt-2 text-xs text-neutral-400 bg-black/30 rounded p-2 overflow-auto max-h-32">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 flex justify-between items-center text-xs text-neutral-500">
          <div>
            Press <kbd className="px-2 py-1 bg-neutral-800 rounded">Esc</kbd> to
            close
          </div>
          <div>{filteredCommands.length} commands</div>
        </div>
      </div>
    </div>
  );
}
