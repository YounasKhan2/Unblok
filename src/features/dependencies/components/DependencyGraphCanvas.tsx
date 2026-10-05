/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ShieldAlert, Flame, CheckCircle2, Trash2, ExternalLink } from 'lucide-react';
import { GraphLayoutData, CriticalChainResult } from '../types';
import { DependencyGraphControls } from './DependencyGraphControls';

interface DependencyGraphCanvasProps {
  layout: GraphLayoutData;
  criticalChain: CriticalChainResult;
  selectedIssueId: string | null;
  onSelectIssue: (issueId: string | null) => void;
  onOpenDrawer: (issueKey: string) => void;
  onRemoveDependency?: (dependencyId: string) => void;
  isObserver: boolean;
}

const STATE_CLASSES: Record<string, string> = {
  BACKLOG: 'bg-[#f6f5f4] text-[#787671] border-[#e5e3df]',
  TODO: 'bg-[#f6f5f4] text-[#5d5b54] border-[#e5e3df]',
  IN_PROGRESS: 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]',
  IN_REVIEW: 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]',
  DONE: 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]',
  CANCELLED: 'bg-[#f6f5f4] text-[#a4a097] border-[#e5e3df]',
};

export const DependencyGraphCanvas: React.FC<DependencyGraphCanvasProps> = ({
  layout,
  criticalChain,
  selectedIssueId,
  onSelectIssue,
  onOpenDrawer,
  onRemoveDependency,
  isObserver,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [showCriticalChain, setShowCriticalChain] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Critical chain edges set
  const criticalEdgeIds = useMemo(() => {
    return new Set(criticalChain.activeEdgeIds);
  }, [criticalChain]);

  const criticalNodeIds = useMemo(() => {
    return new Set(criticalChain.orderedIssueIds);
  }, [criticalChain]);

  const nodesById = useMemo(() => {
    return new Map(layout.nodes.map((n) => [n.id, n]));
  }, [layout.nodes]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(2.0, Number((z + 0.15).toFixed(2))));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.3, Number((z - 0.15).toFixed(2))));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 40, y: 40 });
    setSelectedEdgeId(null);
  }, []);

  const handleFitView = useCallback(() => {
    if (!containerRef.current || layout.nodes.length === 0) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const padding = 60;
    const scaleX = (clientWidth - padding * 2) / layout.width;
    const scaleY = (clientHeight - padding * 2) / layout.height;
    const newZoom = Math.min(1.2, Math.max(0.4, Math.min(scaleX, scaleY)));
    setZoom(Number(newZoom.toFixed(2)));
    setPan({
      x: Math.max(20, (clientWidth - layout.width * newZoom) / 2),
      y: Math.max(20, (clientHeight - layout.height * newZoom) / 2),
    });
  }, [layout]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-interactive="true"]')) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = -e.deltaY * 0.001;
    setZoom((z) => Math.min(2.0, Math.max(0.3, Number((z + zoomFactor).toFixed(2)))));
  };

  // Keyboard navigation (+/-)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetView();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleResetView]);

  if (layout.nodes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#787671] bg-[#fafaf9]">
        <ShieldAlert className="w-10 h-10 text-[#a4a097] mb-2" />
        <h3 className="text-sm font-semibold text-[#1a1a1a] mb-1">No Dependencies to Display</h3>
        <p className="text-xs max-w-md text-[#5d5b54]">
          There are no dependencies matching the current filters, or no dependency relationships have been created yet.
        </p>
      </div>
    );
  }

  const selectedEdge = layout.edges.find((e) => e.dependencyId === selectedEdgeId);
  const selectedUpstreamNode = selectedEdge ? nodesById.get(selectedEdge.upstreamId) : null;
  const selectedDownstreamNode = selectedEdge ? nodesById.get(selectedEdge.downstreamId) : null;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className={`relative flex-1 w-full h-full overflow-hidden bg-[#fbfbfa] select-none ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Grid Pattern Background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="graph-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#c8c4be" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#graph-grid)" />
      </svg>

      {/* Floating Canvas Controls */}
      <DependencyGraphControls
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onFitView={handleFitView}
        showCriticalChain={showCriticalChain}
        onToggleCriticalChain={() => setShowCriticalChain((prev) => !prev)}
        criticalChainCount={criticalChain.chainLength}
      />

      {/* Edge Inspector / Remove Callout if Edge Selected */}
      {selectedEdge && (
        <div
          data-interactive="true"
          className="absolute top-16 left-4 z-20 bg-white border border-[#e5e3df] rounded-[8px] shadow-md p-3 text-xs flex items-center gap-3 animate-in fade-in"
        >
          <div>
            <div className="text-[11px] font-semibold text-[#787671] mb-0.5">
              {selectedEdge.isActive ? 'Active Blocker Relationship' : 'Resolved Relationship'}
            </div>
            <div className="font-mono text-xs flex items-center gap-1.5 font-bold text-[#1a1a1a]">
              <span>{selectedUpstreamNode?.issue.key || selectedEdge.upstreamId}</span>
              <span className="text-[#dd5b00]">BLOCKS</span>
              <span>{selectedDownstreamNode?.issue.key || selectedEdge.downstreamId}</span>
            </div>
          </div>
          {!isObserver && onRemoveDependency && (
            <button
              onClick={() => {
                onRemoveDependency(selectedEdge.dependencyId);
                setSelectedEdgeId(null);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[#fee2e2] hover:bg-[#fecaca] text-[#b91c1c] text-xs font-semibold cursor-pointer transition-colors"
              title="Remove this dependency edge"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Edge</span>
            </button>
          )}
          <button
            onClick={() => setSelectedEdgeId(null)}
            className="text-[#787671] hover:text-[#1a1a1a] text-xs px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Zoomable & Pannable Graph World */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: layout.width,
          height: layout.height,
        }}
        className="relative transition-transform duration-75 ease-out"
      >
        {/* SVG Bezier Edges */}
        <svg
          width={layout.width}
          height={layout.height}
          className="absolute inset-0 pointer-events-none"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Arrowhead markers */}
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#dd5b00" />
            </marker>
            <marker
              id="arrow-critical"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#e03e3e" />
            </marker>
            <marker
              id="arrow-resolved"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#a4a097" />
            </marker>
            <marker
              id="arrow-selected"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#5645d4" />
            </marker>
          </defs>

          {layout.edges.map((edge) => {
            const isSelected = selectedEdgeId === edge.dependencyId;
            const isCritical = showCriticalChain && criticalEdgeIds.has(edge.dependencyId);

            let strokeColor = '#dd5b00';
            let strokeDash = 'none';
            let strokeWidth = isSelected ? 3.5 : isCritical ? 3 : 2;
            let marker = 'url(#arrow-active)';

            if (!edge.isActive) {
              strokeColor = '#a4a097';
              strokeDash = '5,4';
              marker = 'url(#arrow-resolved)';
            }

            if (isCritical) {
              strokeColor = '#e03e3e';
              marker = 'url(#arrow-critical)';
            }

            if (isSelected) {
              strokeColor = '#5645d4';
              marker = 'url(#arrow-selected)';
            }

            return (
              <g key={edge.dependencyId} className="pointer-events-auto cursor-pointer">
                {/* Thick invisible hit area for easy click selection */}
                <path
                  d={edge.svgPath}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="14"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEdgeId(edge.dependencyId);
                  }}
                />
                {/* Visible curve */}
                <path
                  d={edge.svgPath}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDash}
                  markerEnd={marker}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEdgeId(edge.dependencyId);
                  }}
                  className="transition-all hover:stroke-[#5645d4]"
                />
              </g>
            );
          })}
        </svg>

        {/* Node Cards */}
        {layout.nodes.map((node) => {
          const isSelected = selectedIssueId === node.id;
          const isCritical = showCriticalChain && criticalNodeIds.has(node.id);
          const isBottleneck = node.transitiveBlastRadius >= 2;
          const teamColor = node.team?.color || '#5645d4';
          const teamName = node.team?.name || 'Unassigned';
          const teamKey = node.team?.key || 'TEAM';

          return (
            <div
              key={node.id}
              data-interactive="true"
              onClick={(e) => {
                e.stopPropagation();
                onSelectIssue(node.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onOpenDrawer(node.issue.key);
              }}
              style={{
                position: 'absolute',
                left: node.x,
                top: node.y,
                width: 210,
                height: 76,
              }}
              className={`rounded-[8px] bg-white border text-xs shadow-xs transition-all cursor-pointer flex flex-col justify-between p-2.5 group ${
                isSelected
                  ? 'ring-2 ring-[#5645d4] border-[#5645d4] shadow-md z-30'
                  : isCritical
                  ? 'border-[#f5b38a] ring-2 ring-[#f5b38a] bg-[#fffaf5] z-20'
                  : node.isBlocked
                  ? 'border-[#ffd8be] hover:border-[#dd5b00]'
                  : 'border-[#e5e3df] hover:border-[#c8c4be]'
              }`}
            >
              {/* Header: Key, State, and Drawer Action */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  {/* Team badge / dot */}
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: teamColor }}
                    title={`Team: ${teamName} (${teamKey})`}
                  />
                  <span className="font-mono font-bold text-[#1a1a1a] truncate text-xs">
                    {node.issue.key}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded border uppercase font-medium ${
                      STATE_CLASSES[node.issue.state] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {node.issue.state.replace('_', ' ')}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDrawer(node.issue.key);
                    }}
                    className="p-1 hover:bg-[#ede9e4] text-[#787671] hover:text-[#1a1a1a] rounded-[4px] opacity-70 group-hover:opacity-100 transition-opacity"
                    title={`Open ${node.issue.key} drawer`}
                    aria-label={`Open ${node.issue.key} drawer`}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className="text-[11px] text-[#37352f] line-clamp-1 font-medium" title={node.issue.title}>
                {node.issue.title}
              </div>

              {/* Footer Signals: Blocked status / Bottleneck / Blast radius */}
              <div className="flex items-center justify-between text-[10px] text-[#787671] pt-1 border-t border-[#f6f5f4]">
                <div className="flex items-center gap-1">
                  {node.isBlocked ? (
                    <span
                      className="inline-flex items-center gap-0.5 text-[#dd5b00] font-semibold"
                      title={`Blocked by ${node.activeBlockersCount} active upstream issue(s)`}
                    >
                      <ShieldAlert className="w-3 h-3 text-[#dd5b00]" />
                      <span>Blocked ({node.activeBlockersCount})</span>
                    </span>
                  ) : (
                    <span className="text-[#0f7b6c] inline-flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3 text-[#0f7b6c]" />
                      <span>Unblocked</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {isBottleneck && (
                    <span
                      className="inline-flex items-center gap-0.5 text-[#e03e3e] font-semibold"
                      title={`Bottleneck: blocks ${node.transitiveBlastRadius} downstream issues`}
                    >
                      <Flame className="w-3 h-3 text-[#e03e3e]" />
                      <span>{node.transitiveBlastRadius}</span>
                    </span>
                  )}
                  <span className="text-[#a4a097] text-[9px] font-mono">
                    {teamKey}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Canvas Legend at Bottom Right */}
      <div
        role="region"
        aria-label="Dependency Graph Legend"
        className="absolute bottom-4 right-4 z-10 bg-white/95 backdrop-blur-xs border border-[#e5e3df] rounded-[8px] shadow-xs px-3 py-2 text-xs flex flex-col gap-1.5 max-w-xs"
      >
        <div className="text-[11px] font-bold text-[#1a1a1a] flex items-center justify-between">
          <span>DAG Legend</span>
          <span className="font-mono text-[10px] text-[#787671]">A BLOCKS B</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-[#5d5b54]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#dd5b00]" />
            <span>Active Blocker</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-b border-dashed border-[#a4a097]" />
            <span>Resolved History</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3 text-[#dd5b00]" />
            <span>Blocked Issue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame className="w-3 h-3 text-[#e03e3e]" />
            <span>Bottleneck</span>
          </div>
        </div>
      </div>
    </div>
  );
};
