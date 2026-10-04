import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { calculateDagGraph, GraphNode, GraphEdge } from '../../domain/dependency';
import { PriorityIcon } from '../ui/PriorityIcon';
import { StatePill } from '../ui/StatePill';
import { Avatar } from '../ui/Avatar';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Zap,
  ShieldAlert,
  GitFork,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export const DagGraphCanvas: React.FC = () => {
  const {
    issues,
    dependencies,
    users,
    teams,
    selectedIssueId,
    setSelectedIssueId,
    setIsDrawerOpen,
    filters,
  } = useProject();

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 40 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [highlightCriticalPathOnly, setHighlightCriticalPathOnly] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate DAG graph layout
  const graphData = useMemo(() => {
    return calculateDagGraph(issues, dependencies, filters.teamId);
  }, [issues, dependencies, filters.teamId]);

  // Mouse drag pan handler
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on canvas background, not when clicking directly on a node card
    if ((e.target as HTMLElement).closest('.dag-node-card')) return;

    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom(prev => Math.min(2, Math.max(0.4, prev * zoomFactor)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 40, y: 40 });
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className="relative flex-1 w-full h-full bg-[#fafaf9] overflow-hidden select-none cursor-grab active:cursor-grabbing"
      style={{
        backgroundImage: `radial-gradient(#d4d0c9 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-4 z-20 flex items-center gap-3">
        {/* Critical Path Indicator */}
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-[#e5e3df] shadow-xs text-xs text-[#37352f]">
          <Zap className="w-4 h-4 text-[#dd5b00]" />
          <span className="font-semibold text-[#1a1a1a]">Critical Path:</span>
          {graphData.criticalPathKeys.length > 0 ? (
            <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-[#dd5b00]">
              {graphData.criticalPathKeys.map((key, idx) => (
                <React.Fragment key={key}>
                  {idx > 0 && <ArrowRight className="w-3 h-3 text-[#a4a097]" />}
                  <span className="px-1.5 py-0.5 rounded bg-[#ffe8d4]">{key}</span>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <span className="text-[#787671]">No active blocker bottleneck</span>
          )}
        </div>

        {/* Toggle Critical Path Isolation */}
        <button
          onClick={() => setHighlightCriticalPathOnly(prev => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium shadow-xs transition-colors cursor-pointer ${
            highlightCriticalPathOnly
              ? 'bg-[#dd5b00] text-white border-[#dd5b00]'
              : 'bg-white text-[#37352f] border-[#e5e3df] hover:bg-[#f6f5f4]'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Isolate Critical Path</span>
        </button>
      </div>

      {/* Floating Canvas Controls Bottom Right */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-xs p-1 rounded-lg border border-[#e5e3df] shadow-md text-xs text-[#37352f]">
        <button
          onClick={() => setZoom(prev => Math.min(2, prev + 0.15))}
          className="p-1.5 hover:bg-[#f6f5f4] rounded text-[#787671] hover:text-[#1a1a1a] transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="font-mono text-[11px] w-12 text-center text-[#787671]">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(prev => Math.max(0.4, prev - 0.15))}
          className="p-1.5 hover:bg-[#f6f5f4] rounded text-[#787671] hover:text-[#1a1a1a] transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="h-4 w-[1px] bg-[#e5e3df] mx-0.5" />
        <button
          onClick={resetView}
          className="p-1.5 hover:bg-[#f6f5f4] rounded text-[#787671] hover:text-[#1a1a1a] transition-colors cursor-pointer"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Legend Bottom Left */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-4 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-[#e5e3df] shadow-xs text-[11px] text-[#787671]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-[#dd5b00]" />
          <span>Active Blocker (Prerequisite)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-[#1aae39]" />
          <span>Resolved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 bg-[#5645d4] rounded" />
          <span className="font-semibold text-[#5645d4]">Critical Path</span>
        </div>
      </div>

      {/* Pan & Zoom Canvas Plane */}
      <div
        className="absolute top-0 left-0 w-full h-full origin-top-left transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          width: `${graphData.width}px`,
          height: `${graphData.height}px`,
        }}
      >
        {/* SVG Bezier Vector Edges Layer */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={graphData.width}
          height={graphData.height}
        >
          <defs>
            {/* Standard arrow marker */}
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
              id="arrow-resolved"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#1aae39" />
            </marker>

            <marker
              id="arrow-critical"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#5645d4" />
            </marker>
          </defs>

          {/* Render dependency connecting curves */}
          {graphData.edges.map(edge => {
            const isFaded = highlightCriticalPathOnly && !edge.inCriticalPath;

            let strokeColor = edge.isActive ? '#dd5b00' : '#1aae39';
            let strokeWidth = 2;
            let marker = edge.isActive ? 'url(#arrow-active)' : 'url(#arrow-resolved)';

            if (edge.inCriticalPath) {
              strokeColor = '#5645d4';
              strokeWidth = 3;
              marker = 'url(#arrow-critical)';
            }

            return (
              <path
                key={edge.id}
                d={edge.svgPath}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={edge.inCriticalPath ? '6 4' : undefined}
                markerEnd={marker}
                className={`transition-opacity duration-200 ${isFaded ? 'opacity-15' : 'opacity-90'}`}
              />
            );
          })}
        </svg>

        {/* Nodes Layer */}
        {graphData.nodes.map(node => {
          const isSelected = selectedIssueId === node.id;
          const isFaded = highlightCriticalPathOnly && !node.inCriticalPath;
          const assignee = users.find(u => u.id === node.issue.assigneeId);
          const team = teams.find(t => t.id === node.issue.teamId);

          return (
            <div
              key={node.id}
              onClick={() => {
                setSelectedIssueId(node.id);
                setIsDrawerOpen(true);
              }}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: '260px',
              }}
              className={`dag-node-card absolute bg-white rounded-lg p-3 cursor-pointer shadow-md transition-all duration-150 select-none border ${
                isSelected
                  ? 'ring-2 ring-[#5645d4] border-transparent shadow-lg scale-102 z-30'
                  : node.inCriticalPath
                  ? 'border-[#5645d4] ring-1 ring-[#5645d4]/40 z-20'
                  : node.activeBlockersCount > 0
                  ? 'border-[#dd5b00]/60 z-10'
                  : 'border-[#e5e3df] hover:border-[#5645d4]/60 z-10'
              } ${isFaded ? 'opacity-25' : 'opacity-100'}`}
            >
              {/* Header row: Priority, Key, Status */}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <PriorityIcon priority={node.issue.priority} size="sm" />
                  <span className="font-mono text-xs font-bold text-[#5645d4]">
                    {node.issue.key}
                  </span>
                  {node.inCriticalPath && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#5645d4] text-white rounded-[3px] uppercase tracking-wide">
                      Critical
                    </span>
                  )}
                </div>
                <StatePill state={node.issue.state} size="sm" showLabel={false} />
              </div>

              {/* Title */}
              <div className="text-xs font-medium text-[#1a1a1a] truncate mb-2" title={node.issue.title}>
                {node.issue.title}
              </div>

              {/* Footer: Blocker stats & Assignee */}
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#f0eeec]">
                <div className="flex items-center gap-2">
                  {node.activeBlockersCount > 0 ? (
                    <span className="flex items-center gap-1 text-[#dd5b00] font-semibold">
                      <ShieldAlert className="w-3 h-3" />
                      <span>{node.activeBlockersCount} blocked</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[#1aae39]">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Ready</span>
                    </span>
                  )}

                  {node.downstreamCount > 0 && (
                    <span className="text-[#787671] flex items-center gap-0.5" title={`Blocks ${node.downstreamCount} downstream task(s)`}>
                      <GitFork className="w-2.5 h-2.5" />
                      <span>{node.downstreamCount}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#a4a097] font-mono mr-0.5">
                    {team?.key}
                  </span>
                  <Avatar user={assignee} size="sm" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
