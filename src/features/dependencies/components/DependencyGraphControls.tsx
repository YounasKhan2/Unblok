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
      <div className="flex items-center bg-surface-base/95 backdrop-blur-xs border border-border rounded-[6px] shadow-xs p-0.5">
        <button
          onClick={onZoomIn}
          className="p-1.5 hover:bg-surface-subtle text-text-secondary hover:text-text-primary rounded-[4px] cursor-pointer transition-colors"
          title="Zoom in (+ key)"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="text-[11px] font-mono text-text-muted px-1.5 min-w-[3rem] text-center select-none">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={onZoomOut}
          className="p-1.5 hover:bg-surface-subtle text-text-secondary hover:text-text-primary rounded-[4px] cursor-pointer transition-colors"
          title="Zoom out (- key)"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-[1px] h-3.5 bg-border mx-0.5" />
        <button
          onClick={onResetView}
          className="p-1.5 hover:bg-surface-subtle text-text-secondary hover:text-text-primary rounded-[4px] cursor-pointer transition-colors"
          title="Reset zoom and pan (0 key)"
          aria-label="Reset zoom and pan"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onFitView}
          className="p-1.5 hover:bg-surface-subtle text-text-secondary hover:text-text-primary rounded-[4px] cursor-pointer transition-colors"
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
            ? 'bg-blocker/15 border-blocker/50 text-blocker font-semibold ring-1 ring-blocker/40'
            : 'bg-surface-base/95 border-border text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
        }`}
        title="Toggle Longest Active Chain (Critical Path based on active dependency depth, not duration estimates)"
      >
        <GitFork className="w-3.5 h-3.5 text-blocker" />
        <span>Critical Path (dependency depth)</span>
        {criticalChainCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blocker/20 text-blocker font-bold">
            {criticalChainCount}
          </span>
        )}
      </button>

      {/* Honest wording info badge */}
      <div
        className="hidden md:flex items-center gap-1 px-2 py-1 text-[11px] text-text-muted bg-surface-base/90 backdrop-blur-xs border border-border rounded-[6px]"
        title="Based on active dependency depth, not duration estimates."
      >
        <Info className="w-3 h-3 text-text-muted" />
        <span>Topological depth</span>
      </div>
    </div>
  );
};
