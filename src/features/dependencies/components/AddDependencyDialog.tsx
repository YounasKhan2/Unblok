/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Issue, Team, Project, Dependency } from '../../../types';
import { Search, ArrowDown, AlertCircle, ShieldAlert, Check } from 'lucide-react';
import { wouldCreateCycle } from '../../../domain/dependency';

interface AddDependencyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  issues: Issue[];
  teams: Team[];
  projects: Project[];
  dependencies: Dependency[];
  onAddDependency: (upstreamId: string, downstreamId: string) => boolean;
}

export const AddDependencyDialog: React.FC<AddDependencyDialogProps> = ({
  isOpen,
  onClose,
  issues,
  teams,
  projects,
  dependencies,
  onAddDependency,
}) => {
  const [upstreamId, setUpstreamId] = useState<string>('');
  const [downstreamId, setDownstreamId] = useState<string>('');
  const [upstreamSearch, setUpstreamSearch] = useState<string>('');
  const [downstreamSearch, setDownstreamSearch] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const issuesMap = useMemo(() => new Map(issues.map((i) => [i.id, i])), [issues]);
  const teamsMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const projectsMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  // Existing edges set
  const existingEdgeSet = useMemo(() => {
    const set = new Set<string>();
    dependencies.forEach((d) => set.add(`${d.upstreamIssueId}->${d.downstreamIssueId}`));
    return set;
  }, [dependencies]);

  // Filter candidates
  const filteredUpstreamCandidates = useMemo(() => {
    const q = upstreamSearch.trim().toLowerCase();
    return issues.filter((i) => {
      if (downstreamId && i.id === downstreamId) return false;
      if (!q) return true;
      return (
        i.key.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        teamsMap.get(i.teamId)?.name.toLowerCase().includes(q) ||
        projectsMap.get(i.projectId)?.name.toLowerCase().includes(q)
      );
    }).slice(0, 50);
  }, [issues, upstreamSearch, downstreamId, teamsMap, projectsMap]);

  const filteredDownstreamCandidates = useMemo(() => {
    const q = downstreamSearch.trim().toLowerCase();
    return issues.filter((i) => {
      if (upstreamId && i.id === upstreamId) return false;
      if (!q) return true;
      return (
        i.key.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        teamsMap.get(i.teamId)?.name.toLowerCase().includes(q) ||
        projectsMap.get(i.projectId)?.name.toLowerCase().includes(q)
      );
    }).slice(0, 50);
  }, [issues, downstreamSearch, upstreamId, teamsMap, projectsMap]);

  const selectedUpstream = issuesMap.get(upstreamId);
  const selectedDownstream = issuesMap.get(downstreamId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!upstreamId || !downstreamId) {
      setError('Please select both an upstream blocker and a downstream issue.');
      return;
    }

    if (upstreamId === downstreamId) {
      setError('An issue cannot block itself (self-edge is forbidden).');
      return;
    }

    if (existingEdgeSet.has(`${upstreamId}->${downstreamId}`)) {
      setError('This dependency edge already exists in the graph.');
      return;
    }

    // Call canonical addDependency
    const success = onAddDependency(upstreamId, downstreamId);
    if (success) {
      // Reset form and close
      setUpstreamId('');
      setDownstreamId('');
      setUpstreamSearch('');
      setDownstreamSearch('');
      setError(null);
      onClose();
    } else {
      // If cycle occurred, canonical ProjectContext mounted CycleErrorDialog.
      // We keep the dialog open or close based on flow. Let's close this modal so user sees CycleErrorDialog clearly.
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Dependency Edge"
      description="Define an execution prerequisite relationship: Upstream Issue BLOCKS Downstream Issue."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-2.5 rounded-[6px] bg-[#fee2e2] border border-[#fecaca] text-[#b91c1c] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Step 1: Upstream Blocker */}
          <div className="flex flex-col border border-[#e5e3df] rounded-[8px] p-3 bg-[#fafaf9]">
            <label className="font-semibold text-[#1a1a1a] mb-1 flex items-center justify-between">
              <span>1. Upstream Issue (Blocker)</span>
              {selectedUpstream && (
                <span className="font-mono text-[11px] text-[#dd5b00] font-bold">
                  {selectedUpstream.key}
                </span>
              )}
            </label>
            <p className="text-[11px] text-[#787671] mb-2">
              The prerequisite task that must be completed.
            </p>

            {/* Search Input */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-[#787671] absolute left-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                value={upstreamSearch}
                onChange={(e) => setUpstreamSearch(e.target.value)}
                placeholder="Search candidate issues..."
                className="w-full pl-8 pr-2.5 py-1 text-xs rounded-[4px] border border-[#e5e3df] bg-white text-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#5645d4]"
              />
            </div>

            {/* Candidate List */}
            <div className="max-h-48 overflow-y-auto divide-y divide-[#e5e3df] border border-[#e5e3df] rounded-[4px] bg-white">
              {filteredUpstreamCandidates.map((issue) => {
                const isSelected = upstreamId === issue.id;
                const team = teamsMap.get(issue.teamId);

                return (
                  <div
                    key={issue.id}
                    onClick={() => setUpstreamId(issue.id)}
                    className={`p-2 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#fff5ee] border-l-2 border-l-[#dd5b00]' : 'hover:bg-[#fafaf9]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-[#1a1a1a]">
                          {issue.key}
                        </span>
                        {team && (
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: team.color || '#5645d4' }}
                          />
                        )}
                        <span className="text-[10px] text-[#787671]">
                          {issue.state.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#37352f] truncate font-medium" title={issue.title}>
                        {issue.title}
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#dd5b00] shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Downstream Blocked */}
          <div className="flex flex-col border border-[#e5e3df] rounded-[8px] p-3 bg-[#fafaf9]">
            <label className="font-semibold text-[#1a1a1a] mb-1 flex items-center justify-between">
              <span>2. Downstream Issue (Blocked)</span>
              {selectedDownstream && (
                <span className="font-mono text-[11px] text-[#5645d4] font-bold">
                  {selectedDownstream.key}
                </span>
              )}
            </label>
            <p className="text-[11px] text-[#787671] mb-2">
              The dependent task blocked by upstream.
            </p>

            {/* Search Input */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-[#787671] absolute left-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                value={downstreamSearch}
                onChange={(e) => setDownstreamSearch(e.target.value)}
                placeholder="Search candidate issues..."
                className="w-full pl-8 pr-2.5 py-1 text-xs rounded-[4px] border border-[#e5e3df] bg-white text-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#5645d4]"
              />
            </div>

            {/* Candidate List */}
            <div className="max-h-48 overflow-y-auto divide-y divide-[#e5e3df] border border-[#e5e3df] rounded-[4px] bg-white">
              {filteredDownstreamCandidates.map((issue) => {
                const isSelected = downstreamId === issue.id;
                const team = teamsMap.get(issue.teamId);

                return (
                  <div
                    key={issue.id}
                    onClick={() => setDownstreamId(issue.id)}
                    className={`p-2 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#ede9fe] border-l-2 border-l-[#5645d4]' : 'hover:bg-[#fafaf9]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-[#1a1a1a]">
                          {issue.key}
                        </span>
                        {team && (
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: team.color || '#5645d4' }}
                          />
                        )}
                        <span className="text-[10px] text-[#787671]">
                          {issue.state.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#37352f] truncate font-medium" title={issue.title}>
                        {issue.title}
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#5645d4] shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Direction Preview */}
        {selectedUpstream && selectedDownstream && (
          <div className="p-3 bg-white border border-[#e5e3df] rounded-[8px] flex items-center justify-between gap-3">
            <div className="flex-1">
              <span className="text-[10px] uppercase font-bold text-[#dd5b00]">Prerequisite:</span>
              <div className="font-mono font-bold text-xs text-[#1a1a1a]">{selectedUpstream.key}</div>
              <div className="text-[11px] text-[#5d5b54] truncate">{selectedUpstream.title}</div>
            </div>

            <div className="flex flex-col items-center justify-center shrink-0 px-3">
              <span className="font-mono text-[10px] font-bold text-[#dd5b00] tracking-wider">BLOCKS</span>
              <ArrowDown className="w-4 h-4 text-[#dd5b00]" />
            </div>

            <div className="flex-1 text-right">
              <span className="text-[10px] uppercase font-bold text-[#787671]">Dependent:</span>
              <div className="font-mono font-bold text-xs text-[#1a1a1a]">{selectedDownstream.key}</div>
              <div className="text-[11px] text-[#5d5b54] truncate">{selectedDownstream.title}</div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-[#e5e3df]">
          <Button variant="secondary" size="md" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={!upstreamId || !downstreamId}
          >
            Add Dependency
          </Button>
        </div>
      </form>
    </Modal>
  );
};
