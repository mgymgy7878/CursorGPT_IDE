'use client';

import { ReactNode, useState } from 'react';
import { Maximize2, Minimize2, PanelRightClose, PanelRightOpen } from 'lucide-react';

interface ShellProps {
  editorSlot: ReactNode;
  copilotSlot: ReactNode;
  resultsSlot: ReactNode;
}

export function Shell({ editorSlot, copilotSlot, resultsSlot }: ShellProps) {
  const [copilotVisible, setCopilotVisible] = useState(true);
  const [resultsExpanded, setResultsExpanded] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">⚡ Strategy Lab</h1>
          <span className="text-xs text-gray-400">v1.9-p3</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCopilotVisible(!copilotVisible)}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title={copilotVisible ? 'Copilot Gizle' : 'Copilot Göster'}
          >
            {copilotVisible ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </button>
          
          <button
            onClick={() => setResultsExpanded(!resultsExpanded)}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title={resultsExpanded ? 'Sonuçları Küçült' : 'Sonuçları Genişlet'}
          >
            {resultsExpanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor + Results */}
        <div className="flex-1 flex flex-col">
          {/* Editor */}
          <div 
            className={`${
              resultsExpanded ? 'h-32' : 'flex-1'
            } transition-all duration-300 border-b border-gray-700`}
          >
            {editorSlot}
          </div>

          {/* Results Panel */}
          <div 
            className={`${
              resultsExpanded ? 'flex-1' : 'h-64'
            } transition-all duration-300 bg-gray-950`}
          >
            {resultsSlot}
          </div>
        </div>

        {/* Right: Copilot Panel */}
        {copilotVisible && (
          <div className="w-96 border-l border-gray-700 bg-gray-800 flex flex-col">
            {copilotSlot}
          </div>
        )}
      </div>
    </div>
  );
}

