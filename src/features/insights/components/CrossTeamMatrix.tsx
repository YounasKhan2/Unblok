/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { CrossTeamMatrixData } from '../../dependencies/types';
import { Network, ExternalLink } from 'lucide-react';

interface CrossTeamMatrixProps {
  matrixData: CrossTeamMatrixData;
  scopeLabel?: string;
}

export const CrossTeamMatrix: React.FC<CrossTeamMatrixProps> = ({ matrixData, scopeLabel }) => {
  const { teams, matrix, totalCrossTeamActiveEdges } = matrixData;

  if (teams.length === 0) return null;

  return (
    <div className="p-3.5 rounded-lg bg-surface-card border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Network className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-semibold text-text-primary tracking-tight">
            Cross-Team Execution Pressure
          </h2>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-surface-base text-text-secondary border border-border font-mono">
            {totalCrossTeamActiveEdges} active edges
          </span>
          {scopeLabel && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-base text-text-secondary border border-border">
              {scopeLabel}
            </span>
          )}
        </div>
        <Link
          to="/dependencies?view=matrix"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent-hover transition-colors"
        >
          <span>Matrix View</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <p className="text-[11px] text-text-muted mb-2.5">
        Active dependency edges from upstream (blocking) team to downstream (blocked) team.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse text-xs">
          <thead>
            <tr className="border-b border-border text-[11px] text-text-muted font-semibold">
              <th className="text-left py-1.5 px-2 font-normal text-text-secondary">
                <span className="text-[10px] uppercase tracking-wider">Blocking ↓ / Blocked →</span>
              </th>
              {teams.map(t => (
                <th key={t.id} className="py-1.5 px-2 font-mono text-text-primary">
                  {t.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-mono">
            {teams.map(sourceTeam => {
              const row = matrix.get(sourceTeam.id);
              return (
                <tr key={sourceTeam.id} className="hover:bg-surface-base/50 transition-colors">
                  <td className="text-left py-1.5 px-2 text-text-primary font-medium font-sans">
                    {sourceTeam.name}
                  </td>
                  {teams.map(targetTeam => {
                    const isSelf = sourceTeam.id === targetTeam.id;
                    const cell = row?.get(targetTeam.id);
                    const activeCount = cell?.activeEdgeCount || 0;

                    if (isSelf) {
                      return (
                        <td key={targetTeam.id} className="py-1.5 px-2 text-text-muted/40">
                          —
                        </td>
                      );
                    }

                    const cellClasses =
                      activeCount >= 3
                        ? 'bg-danger/15 text-danger font-bold'
                        : activeCount > 0
                        ? 'bg-warning/15 text-warning font-semibold'
                        : 'text-text-muted';

                    return (
                      <td key={targetTeam.id} className="py-1.5 px-2">
                        <span className={`inline-block w-6 py-0.5 rounded ${cellClasses}`}>
                          {activeCount}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
