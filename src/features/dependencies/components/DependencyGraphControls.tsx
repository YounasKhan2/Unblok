/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, GitFork, Info } from 'lucide-react';

interface DependencyGraphControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFitView: () => void;
  showCriticalChain: boolean;
  onToggleCriticalChain: () => void;
  criticalChainCount?: number;
}

export const DependencyGraphControls: React.FC<DependencyGraphControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
  onFitView,
  showCriticalChain,
  onToggleCriticalChain,
  criticalChainCount = 0,
}) => {
  return (
    <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
      {/* Zoom / Pan Navigation Controls */}
      <div className="flex items-center bg-white/95 backdrop-blur-xs border border-[#e5e3df] rounded-[6px] shadow-xs p-0.5">
        <button
          onClick={onZoomIn}
          className="p-1.5 hover:bg-[#fafaf9] text-[#5d5b54] hover:text-[#1a1a1a] rounded-[4px] cursor-pointer transition-colors"
          title="Zoom in (+ key)"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="text-[11px] font-mono text-[#787671] px-1.5 min-w-[3rem] text-center select-none">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={onZoomOut}
          className="p-1.5 hover:bg-[#fafaf9] text-[#5d5b54] hover:text-[#1a1a1a] rounded-[4px] cursor-pointer transition-colors"
          title="Zoom out (- key)"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-[1px] h-3.5 bg-[#e5e3df] mx-0.5" />
        <button
          onClick={onResetView}
          className="p-1.5 hover:bg-[#fafaf9] text-[#5d5b54] hover:text-[#1a1a1a] rounded-[4px] cursor-pointer transition-colors"
          title="Reset zoom and pan"
          aria-label="Reset zoom and pan"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onFitView}
          className="p-1.5 hover:bg-[#fafaf9] text-[#5d5b54] hover:text-[#1a1a1a] rounded-[4px] cursor-pointer transition-colors"
          title="Fit graph to canvas"
          aria-label="Fit graph to canvas"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Critical Path Toggle with honest labeling */}
      <button
        onClick={onToggleCriticalChain}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] border text-xs font-medium cursor-pointer shadow-xs transition-colors backdrop-blur-xs ${
          showCriticalChain
            ? 'bg-[#ffe8d4]/95 border-[#f5b38a] text-[#c24e00] font-semibold ring-1 ring-[#f5b38a]'
            : 'bg-white/95 border-[#e5e3df] text-[#5d5b54] hover:text-[#1a1a1a] hover:bg-[#fafaf9]'
        }`}
        title="Toggle Longest Active Chain (Critical Path based on active dependency depth, not duration estimates)"
      >
        <GitFork className="w-3.5 h-3.5 text-[#dd5b00]" />
        <span>Critical Path (dependency depth)</span>
        {criticalChainCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#ffd8be] text-[#dd5b00] font-bold">
            {criticalChainCount}
          </span>
        )}
      </button>

      {/* Honest wording info badge */}
      <div
        className="hidden md:flex items-center gap-1 px-2 py-1 text-[11px] text-[#787671] bg-white/90 backdrop-blur-xs border border-[#e5e3df] rounded-[6px]"
        title="Based on active dependency depth, not duration estimates."
      >
        <Info className="w-3 h-3 text-[#787671]" />
        <span>Topological depth</span>
      </div>
    </div>
  );
};
