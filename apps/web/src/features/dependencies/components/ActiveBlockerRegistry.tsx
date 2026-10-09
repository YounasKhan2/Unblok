/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, CheckCircle2, ArrowRight, Trash2, ExternalLink, Users, GitFork, Clock } from 'lucide-react';
import { ResolvedEdge } from '../types';
import { formatBlockerAge } from '../selectors';
import { DEPENDENCY_STATE_CLASSES, GRAPH_SEMANTIC_PALETTE } from '../tokens';
import { formatUserDate } from '../../../components/ui/formatDate';

interface ActiveBlockerRegistryProps {
  edges: ResolvedEdge[];
  onOpenDrawer: (issueKey: string) => void;
  onRemoveDependency?: (dependencyId: string) => void;
  isObserver: boolean;
}

export const ActiveBlockerRegistry: React.FC<ActiveBlockerRegistryProps> = ({
  edges,
  onOpenDrawer,
  onRemoveDependency,
  isObserver,
}) => {
  if (edges.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-muted bg-surface-subtle">
        <ShieldAlert className="w-10 h-10 text-border-strong mb-2" />
        <h3 className="text-sm font-semibold text-text-primary mb-1">No Dependencies Found</h3>
        <p className="text-xs text-text-secondary max-w-sm">
          No dependency relationships match the current filters. Clear filters or add new dependencies.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-surface-base">
      <table
        className="w-full text-left text-xs border-collapse"
        aria-label="Active Blocker and Dependency Registry"
      >
        <thead className="bg-surface-subtle border-b border-border sticky top-0 z-10">
          <tr>
            <th scope="col" className="py-2 px-3 font-semibold text-text-muted text-[11px] min-w-[200px]">
              Blocker (Upstream)
            </th>
            <th scope="col" className="py-2 px-2 font-semibold text-text-muted text-[11px] text-center w-28">
              Scope
            </th>
            <th scope="col" className="py-2 px-3 font-semibold text-text-muted text-[11px] min-w-[200px]">
              Blocked (Downstream)
            </th>
            <th scope="col" className="py-2 px-2 font-semibold text-text-muted text-[11px] w-24">
              Status
            </th>
            <th scope="col" className="py-2 px-2 font-semibold text-text-muted text-[11px] w-24">
              Age
            </th>
            <th scope="col" className="py-2 px-2 font-semibold text-text-muted text-[11px] text-right w-20">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {edges.map((edge) => {
            const ageString = formatBlockerAge(edge.createdAt);

            return (
              <tr
                key={edge.dependencyId}
                className="hover:bg-surface-subtle/80 transition-colors h-[38px] group"
              >
                {/* Upstream / Blocker */}
                <td className="py-1.5 px-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: edge.upstreamTeam?.color || GRAPH_SEMANTIC_PALETTE.fallbackTeam }}
                      title={`Team: ${edge.upstreamTeam?.name || 'Unassigned'}`}
                    />
                    <button
                      onClick={() => onOpenDrawer(edge.upstreamIssue.key)}
                      className="font-mono font-bold text-xs text-text-primary hover:text-accent hover:underline cursor-pointer shrink-0"
                    >
                      {edge.upstreamIssue.key}
                    </button>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded border uppercase font-medium shrink-0 ${
                        DEPENDENCY_STATE_CLASSES[edge.upstreamIssue.state] || 'bg-surface-muted text-text-muted border-border'
                      }`}
                    >
                      {edge.upstreamIssue.state.replace('_', ' ')}
                    </span>
                    <span
                      className="text-text-primary truncate max-w-[220px] font-medium"
                      title={edge.upstreamIssue.title}
                    >
                      {edge.upstreamIssue.title}
                    </span>
                  </div>
                </td>

                {/* Scope */}
                <td className="py-1.5 px-2 text-center">
                  {edge.isCrossTeam ? (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] bg-accent/10 text-accent text-[10px] font-semibold border border-accent/30"
                      title="Cross-Team dependency"
                    >
                      <Users className="w-2.5 h-2.5" />
                      <span>Cross-Team</span>
                    </span>
                  ) : edge.isCrossProject ? (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] bg-surface-muted text-text-secondary text-[10px] font-medium border border-border"
                      title="Cross-Project dependency (same team)"
                    >
                      <GitFork className="w-2.5 h-2.5" />
                      <span>Cross-Project</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-text-muted">Same Project</span>
                  )}
                </td>

                {/* Downstream / Blocked */}
                <td className="py-1.5 px-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: edge.downstreamTeam?.color || GRAPH_SEMANTIC_PALETTE.fallbackTeam }}
                      title={`Team: ${edge.downstreamTeam?.name || 'Unassigned'}`}
                    />
                    <button
                      onClick={() => onOpenDrawer(edge.downstreamIssue.key)}
                      className="font-mono font-bold text-xs text-text-primary hover:text-accent hover:underline cursor-pointer shrink-0"
                    >
                      {edge.downstreamIssue.key}
                    </button>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded border uppercase font-medium shrink-0 ${
                        DEPENDENCY_STATE_CLASSES[edge.downstreamIssue.state] || 'bg-surface-muted text-text-muted border-border'
                      }`}
                    >
                      {edge.downstreamIssue.state.replace('_', ' ')}
                    </span>
                    <span
                      className="text-text-primary truncate max-w-[220px]"
                      title={edge.downstreamIssue.title}
                    >
                      {edge.downstreamIssue.title}
                    </span>
                  </div>
                </td>

                {/* Relationship Status */}
                <td className="py-1.5 px-2">
                  {edge.isActive ? (
                    <span
                      className="inline-flex items-center gap-1 text-blocker font-semibold text-[11px]"
                      title="Active blocker: upstream issue is not yet DONE or CANCELLED"
                    >
                      <ShieldAlert className="w-3 h-3 text-blocker" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-success text-[11px]"
                      title="Resolved: upstream is completed, relationship historically persisted"
                    >
                      <CheckCircle2 className="w-3 h-3 text-success" />
                      <span>Resolved</span>
                    </span>
                  )}
                </td>

                {/* Honest Age */}
                <td className="py-1.5 px-2 text-text-muted text-[11px]">
                  <span className="inline-flex items-center gap-1" title={`Created: ${formatUserDate(edge.createdAt)}`}>
                    <Clock className="w-3 h-3 text-border-strong" />
                    <span>{ageString}</span>
                  </span>
                </td>

                {/* Actions */}
                <td className="py-1.5 px-2 text-right">
                  {!isObserver && onRemoveDependency ? (
                    <button
                      onClick={() => onRemoveDependency(edge.dependencyId)}
                      className="p-1 hover:bg-danger/10 text-text-muted hover:text-danger rounded-[4px] cursor-pointer transition-colors opacity-60 group-hover:opacity-100"
                      title="Remove dependency relationship"
                      aria-label={`Remove dependency between ${edge.upstreamIssue.key} and ${edge.downstreamIssue.key}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-border-strong">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
