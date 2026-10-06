/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ProjectDeliveryHealth, TeamDeliveryHealth, DeliveryHealth } from '../types';
import { Activity, ShieldCheck, AlertTriangle, ShieldAlert, FolderKanban, Users } from 'lucide-react';

interface DeliveryHealthPanelProps {
  projectHealth: ProjectDeliveryHealth[];
  teamHealth: TeamDeliveryHealth[];
}

export const DeliveryHealthPanel: React.FC<DeliveryHealthPanelProps> = ({
  projectHealth,
  teamHealth,
}) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'teams'>('projects');

  const getHealthBadge = (health: DeliveryHealth) => {
    switch (health) {
      case 'AT_RISK':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-3 h-3" />
            <span>At Risk</span>
          </span>
        );
      case 'WATCH':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            <span>Watch</span>
          </span>
        );
      case 'HEALTHY':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3 h-3" />
            <span>Healthy</span>
          </span>
        );
    }
  };

  return (
    <div className="p-3.5 rounded-lg bg-surface-card border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-semibold text-text-primary tracking-tight">Delivery Health</h2>
        </div>

        {/* Tab switcher: Projects vs Teams */}
        <div className="flex items-center gap-1 p-0.5 rounded bg-surface-base border border-border">
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'projects'
                ? 'bg-surface-elevated text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Projects ({projectHealth.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'teams'
                ? 'bg-surface-elevated text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Teams ({teamHealth.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'projects' ? (
        <div className="space-y-2">
          {projectHealth.map(p => (
            <div
              key={p.projectId}
              className="p-2.5 rounded bg-surface-base border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-text-primary">
                    {p.projectKey}
                  </span>
                  <span className="text-xs font-medium text-text-primary">{p.projectName}</span>
                  <span className="text-[11px] text-text-muted">({p.teamName})</span>
                  {getHealthBadge(p.health)}
                </div>
                <div className="text-[11px] text-text-secondary mt-0.5">
                  {p.reasons.join(' • ')}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-text-secondary flex-shrink-0 self-end sm:self-center font-mono">
                <span>{p.activeIssueCount} active</span>
                <span>•</span>
                <span className={p.blockedIssueCount > 0 ? 'text-amber-400 font-semibold' : ''}>
                  {p.blockedIssueCount} blocked ({Math.round(p.blockedRatio * 100)}%)
                </span>
                {p.highRiskCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-rose-400 font-semibold">{p.highRiskCount} high risk</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {teamHealth.map(t => (
            <div
              key={t.teamId}
              className="p-2.5 rounded bg-surface-base border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-text-primary">{t.teamKey}</span>
                  <span className="text-xs font-medium text-text-primary">{t.teamName}</span>
                  {getHealthBadge(t.health)}
                </div>
                <div className="text-[11px] text-text-secondary mt-0.5">
                  {t.reasons.join(' • ')}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-text-secondary flex-shrink-0 self-end sm:self-center font-mono">
                <span>{t.projectCount} {t.projectCount === 1 ? 'proj' : 'projs'}</span>
                <span>•</span>
                <span>{t.activeIssueCount} active</span>
                <span>•</span>
                <span className={t.blockedIssueCount > 0 ? 'text-amber-400 font-semibold' : ''}>
                  {t.blockedIssueCount} blocked ({Math.round(t.blockedRatio * 100)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
