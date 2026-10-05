/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CrossTeamMatrixData, ResolvedEdge } from '../types';
import { ExternalLink, Trash2, X, Users, ArrowRight } from 'lucide-react';
import { GRAPH_SEMANTIC_PALETTE } from '../tokens';

interface DependencyMatrixProps {
  matrixData: CrossTeamMatrixData;
  onOpenDrawer: (issueKey: string) => void;
  onRemoveDependency?: (dependencyId: string) => void;
  isObserver: boolean;
}

export const DependencyMatrix: React.FC<DependencyMatrixProps> = ({
  matrixData,
  onOpenDrawer,
  onRemoveDependency,
  isObserver,
}) => {
  const [selectedCell, setSelectedCell] = useState<{
    sourceTeamId: string;
    targetTeamId: string;
    edges: ResolvedEdge[];
  } | null>(null);

  const { teams, matrix } = matrixData;

  if (teams.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-muted bg-surface-subtle">
        <Users className="w-10 h-10 text-border-strong mb-2" />
        <h3 className="text-sm font-semibold text-text-primary mb-1">No Teams Available</h3>
        <p className="text-xs text-text-secondary">
          Create teams and assign issues to visualize cross-team blocking relationships.
        </p>
      </div>
    );
  }

  const selectedSourceTeam = teams.find((t) => t.id === selectedCell?.sourceTeamId);
  const selectedTargetTeam = teams.find((t) => t.id === selectedCell?.targetTeamId);

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-surface-base">
      {/* Matrix Table Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <span>Cross-Team Dependency Matrix</span>
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Active blocking relationships crossing team boundaries. Rows represent the <strong>Blocking Team</strong> (upstream); columns represent the <strong>Blocked Team</strong> (downstream).
          </p>
        </div>

        <div className="border border-border rounded-[8px] overflow-hidden shadow-xs bg-surface-base inline-block max-w-full">
          <table
            className="w-full text-xs text-left border-collapse"
            role="grid"
            aria-label="Cross-Team Dependency Bottleneck Matrix"
          >
            <thead>
              <tr className="bg-surface-subtle border-b border-border">
                <th className="p-3 text-[11px] font-semibold text-text-muted border-r border-border min-w-[140px]">
                  Blocking ↓ / Blocked →
                </th>
                {teams.map((team) => (
                  <th
                    key={team.id}
                    scope="col"
                    className="p-3 text-center text-xs font-semibold text-text-primary border-r border-border min-w-[90px] last:border-r-0"
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-mono text-[11px] font-bold">{team.key}</span>
                      <span className="text-[10px] text-text-muted font-normal truncate max-w-[80px]">
                        {team.name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {teams.map((sourceTeam) => {
                const rowMap = matrix.get(sourceTeam.id);

                return (
                  <tr key={sourceTeam.id} className="hover:bg-surface-subtle/60 transition-colors">
                    {/* Row Header (Source / Blocking Team) */}
                    <th
                      scope="row"
                      className="p-3 text-xs font-semibold text-text-primary bg-surface-subtle/80 border-r border-border whitespace-nowrap"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: sourceTeam.color || GRAPH_SEMANTIC_PALETTE.fallbackTeam }}
                        />
                        <span className="font-mono font-bold">{sourceTeam.key}</span>
                        <span className="text-[11px] text-text-muted font-normal hidden sm:inline truncate max-w-[90px]">
                          {sourceTeam.name}
                        </span>
                      </div>
                    </th>

                    {/* Matrix Cells */}
                    {teams.map((targetTeam) => {
                      const isDiagonal = sourceTeam.id === targetTeam.id;
                      const cell = rowMap?.get(targetTeam.id);
                      const count = cell ? cell.activeEdgeCount : 0;
                      const matchingEdges = cell ? cell.matchingEdges.filter(e => e.isActive) : [];
                      const isSelected =
                        selectedCell?.sourceTeamId === sourceTeam.id &&
                        selectedCell?.targetTeamId === targetTeam.id;

                      let cellBg = 'bg-surface-base hover:bg-surface-subtle';
                      let textColor = 'text-text-muted';

                      if (isDiagonal) {
                        cellBg = 'bg-surface-muted text-text-muted/60 cursor-not-allowed';
                      } else if (count > 0) {
                        if (count === 1) {
                          cellBg = 'bg-blocker/10 text-blocker hover:bg-blocker/20 font-semibold';
                        } else if (count <= 3) {
                          cellBg = 'bg-blocker/20 text-blocker hover:bg-blocker/30 font-bold';
                        } else {
                          cellBg = 'bg-blocker/30 text-blocker hover:bg-blocker/40 font-black';
                        }
                        textColor = 'text-inherit';
                      }

                      if (isSelected) {
                        cellBg = 'bg-accent text-white ring-2 ring-accent font-bold';
                        textColor = 'text-white';
                      }

                      return (
                        <td
                          key={targetTeam.id}
                          className={`p-3 text-center border-r border-border last:border-r-0 select-none transition-colors ${cellBg}`}
                        >
                          {isDiagonal ? (
                            <span className="text-border-strong">—</span>
                          ) : (
                            <button
                              type="button"
                              disabled={count === 0}
                              onClick={() =>
                                setSelectedCell({
                                  sourceTeamId: sourceTeam.id,
                                  targetTeamId: targetTeam.id,
                                  edges: matchingEdges,
                                })
                              }
                              className={`w-full h-full flex items-center justify-center cursor-pointer disabled:cursor-default disabled:opacity-40 ${textColor}`}
                              aria-label={`${sourceTeam.name} blocks ${targetTeam.name}: ${count} active issues`}
                            >
                              <span>{count}</span>
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs text-text-muted">
          <span>Blocker Intensity:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded border border-blocker/30 bg-blocker/10 flex items-center justify-center text-[10px] text-blocker font-bold">1</span>
            <span>1 Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded border border-blocker/40 bg-blocker/20 flex items-center justify-center text-[10px] text-blocker font-bold">2-3</span>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded border border-blocker/60 bg-blocker/30 flex items-center justify-center text-[10px] text-blocker font-black">4+</span>
            <span>Severe</span>
          </div>
        </div>
      </div>

      {/* Drill-down Sidebar Panel */}
      {selectedCell && selectedSourceTeam && selectedTargetTeam && (
        <aside
          role="region"
          aria-label="Cross-Team Blocker Drilldown"
          className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-border bg-surface-subtle flex flex-col shrink-0"
        >
          {/* Panel Header */}
          <div className="p-3.5 border-b border-border bg-surface-base flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">
                Active Blocker Drill-Down
              </div>
              <div className="text-xs font-bold text-text-primary flex items-center gap-1.5 mt-0.5">
                <span>{selectedSourceTeam.key}</span>
                <ArrowRight className="w-3.5 h-3.5 text-blocker" />
                <span>{selectedTargetTeam.key}</span>
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-blocker/10 text-blocker font-bold border border-blocker/30">
                  {selectedCell.edges.length} {selectedCell.edges.length === 1 ? 'edge' : 'edges'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              className="p-1 hover:bg-surface-muted text-text-muted hover:text-text-primary rounded-[4px] cursor-pointer"
              title="Close drill-down panel"
              aria-label="Close drill-down panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Issue Relationship List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border p-3 space-y-2">
            {selectedCell.edges.map((edge) => (
              <div
                key={edge.dependencyId}
                className="bg-surface-base border border-border rounded-[6px] p-3 shadow-xs hover:border-border-strong transition-colors"
              >
                {/* Upstream blocker */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-blocker">Blocker:</span>
                    <button
                      onClick={() => onOpenDrawer(edge.upstreamIssue.key)}
                      className="font-mono font-bold text-xs text-text-primary hover:text-accent hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>{edge.upstreamIssue.key}</span>
                      <ExternalLink className="w-2.5 h-2.5 text-text-muted" />
                    </button>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-muted text-text-secondary font-medium border border-border">
                    {edge.upstreamIssue.state.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-[11px] text-text-primary line-clamp-1 mb-2 font-medium" title={edge.upstreamIssue.title}>
                  {edge.upstreamIssue.title}
                </div>

                <div className="w-full flex items-center justify-center my-1 text-[10px] font-bold text-blocker gap-1">
                  <ArrowRight className="w-3 h-3" />
                  <span>BLOCKS</span>
                  <ArrowRight className="w-3 h-3" />
                </div>

                {/* Downstream blocked */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-text-muted">Blocked:</span>
                    <button
                      onClick={() => onOpenDrawer(edge.downstreamIssue.key)}
                      className="font-mono font-bold text-xs text-text-primary hover:text-accent hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>{edge.downstreamIssue.key}</span>
                      <ExternalLink className="w-2.5 h-2.5 text-text-muted" />
                    </button>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blocker/10 text-blocker font-medium border border-blocker/30">
                    {edge.downstreamIssue.state.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-[11px] text-text-primary line-clamp-1 mb-2 font-medium" title={edge.downstreamIssue.title}>
                  {edge.downstreamIssue.title}
                </div>

                {/* Bottom metadata and mutation action */}
                <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[10px] text-text-muted">
                  <span>
                    Project: <strong className="text-text-primary">{edge.upstreamProject?.key || 'PRJ'}</strong> → <strong className="text-text-primary">{edge.downstreamProject?.key || 'PRJ'}</strong>
                  </span>
                  {!isObserver && onRemoveDependency && (
                    <button
                      onClick={() => {
                        onRemoveDependency(edge.dependencyId);
                        // update local cell edge list
                        setSelectedCell((prev) =>
                          prev
                            ? {
                                ...prev,
                                edges: prev.edges.filter((e) => e.dependencyId !== edge.dependencyId),
                              }
                            : null
                        );
                      }}
                      className="text-danger hover:underline flex items-center gap-0.5 cursor-pointer"
                      title="Remove this dependency"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
};
