import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { isUpstreamActivelyBlocking } from '../../domain/lifecycle';
import { ShieldAlert, CheckCircle2, ArrowRight, GitFork, AlertTriangle, Network, BarChart3 } from 'lucide-react';
import { StatePill } from '../ui/StatePill';
import { PriorityIcon } from '../ui/PriorityIcon';
import { DagGraphCanvas } from './DagGraphCanvas';

export const DependencyMatrix: React.FC = () => {
  const {
    teams,
    issues,
    dependencies,
    setSelectedIssueId,
    setIsDrawerOpen,
    setFilters,
    setViewMode,
  } = useProject();

  const [subView, setSubView] = useState<'CANVAS' | 'TABLE'>('CANVAS');

  const issuesMap = new Map(issues.map(i => [i.id, i]));

  // Calculate team bottleneck metrics
  const teamBottlenecks = teams.map(team => {
    const teamIssues = issues.filter(i => i.teamId === team.id);
    const teamIssueIds = new Set(teamIssues.map(i => i.id));

    // Outbound: Team tasks that block OTHER teams' tasks
    const outboundActiveBlocks = dependencies.filter(dep => {
      if (!teamIssueIds.has(dep.upstreamIssueId)) return false;
      const upstream = issuesMap.get(dep.upstreamIssueId);
      const downstream = issuesMap.get(dep.downstreamIssueId);
      if (!upstream || !downstream) return false;
      return (
        isUpstreamActivelyBlocking(upstream.state) &&
        downstream.teamId !== team.id
      );
    });

    // Inbound: Team tasks waiting on OTHER teams' tasks
    const inboundActiveBlocks = dependencies.filter(dep => {
      if (!teamIssueIds.has(dep.downstreamIssueId)) return false;
      const upstream = issuesMap.get(dep.upstreamIssueId);
      const downstream = issuesMap.get(dep.downstreamIssueId);
      if (!upstream || !downstream) return false;
      return (
        isUpstreamActivelyBlocking(upstream.state) &&
        upstream.teamId !== team.id
      );
    });

    return {
      team,
      totalIssues: teamIssues.length,
      outboundCount: outboundActiveBlocks.length,
      inboundCount: inboundActiveBlocks.length,
      outboundDeps: outboundActiveBlocks,
      inboundDeps: inboundActiveBlocks,
    };
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Top Header & Sub-view Switcher */}
      <div className="px-6 py-3 border-b border-[#e5e3df] bg-[#fafaf9] flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-[#1a1a1a] flex items-center gap-2">
            <GitFork className="w-4 h-4 text-[#5645d4]" />
            <span>Cross-Team Dependency DAG & Critical Path</span>
          </h2>
          <p className="text-[11px] text-[#787671]">
            Visual Directed Acyclic Graph tracing bottlenecks and downstream delivery impact across teams.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-[#ede9e4] p-0.5 rounded-lg border border-[#e5e3df] text-xs">
          <button
            onClick={() => setSubView('CANVAS')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] transition-colors cursor-pointer ${
              subView === 'CANVAS'
                ? 'bg-white text-[#5645d4] font-semibold shadow-2xs'
                : 'text-[#787671] hover:text-[#1a1a1a]'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Interactive Graph Canvas</span>
          </button>

          <button
            onClick={() => setSubView('TABLE')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] transition-colors cursor-pointer ${
              subView === 'TABLE'
                ? 'bg-white text-[#5645d4] font-semibold shadow-2xs'
                : 'text-[#787671] hover:text-[#1a1a1a]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Team Bottleneck Table</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {subView === 'CANVAS' ? (
        <DagGraphCanvas />
      ) : (
        <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6">

      {/* 1. Team Bottleneck Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {teamBottlenecks.map(({ team, outboundCount, inboundCount }) => {
          const isHighBottleneck = outboundCount > 0;

          return (
            <div
              key={team.id}
              className={`p-4 rounded-xl border transition-all ${
                isHighBottleneck
                  ? 'bg-[#ffe8d4]/30 border-[#ffd3ad]'
                  : 'bg-[#fafaf9] border-[#e5e3df]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="font-semibold text-sm text-[#1a1a1a]">{team.name}</span>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white border border-[#e5e3df] text-[#5645d4] font-semibold">
                  {team.key}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-[#e5e3df] shadow-2xs">
                  <span className="text-[10px] uppercase font-semibold text-[#787671] block">
                    Blocking Others
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 font-bold text-base text-[#dd5b00]">
                    <ShieldAlert className="w-4 h-4" />
                    <span>{outboundCount} task{outboundCount === 1 ? '' : 's'}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-[#e5e3df] shadow-2xs">
                  <span className="text-[10px] uppercase font-semibold text-[#787671] block">
                    Blocked By Others
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 font-bold text-base text-[#5645d4]">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{inboundCount} task{inboundCount === 1 ? '' : 's'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setFilters(prev => ({ ...prev, teamId: team.id }));
                  setViewMode('LIST');
                }}
                className="w-full mt-3 py-1.5 text-xs text-[#5645d4] bg-white hover:bg-purple-50 border border-purple-200 rounded font-medium transition-colors"
              >
                Inspect {team.key} Issues →
              </button>
            </div>
          );
        })}
      </div>

      {/* 2. All Active Workspace Directed Blockers */}
      <div className="bg-[#fafaf9] rounded-xl border border-[#e5e3df] p-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#e5e3df]">
          <div className="font-semibold text-xs text-[#1a1a1a] uppercase tracking-wider">
            Active Directed Dependency Chains (A BLOCKS B)
          </div>
          <span className="text-xs text-[#787671]">
            Total Workspace Edges: {dependencies.length}
          </span>
        </div>

        <div className="space-y-2">
          {dependencies.map(dep => {
            const upstream = issuesMap.get(dep.upstreamIssueId);
            const downstream = issuesMap.get(dep.downstreamIssueId);
            if (!upstream || !downstream) return null;

            const isBlocking = isUpstreamActivelyBlocking(upstream.state);

            return (
              <div
                key={dep.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border text-xs gap-3 ${
                  isBlocking
                    ? 'bg-white border-[#ffd3ad] shadow-2xs'
                    : 'bg-[#fafaf9] border-[#e5e3df] opacity-75'
                }`}
              >
                {/* Upstream Task (Prerequisite) */}
                <div
                  className="flex items-center gap-2 cursor-pointer group flex-1 min-w-0"
                  onClick={() => {
                    setSelectedIssueId(upstream.id);
                    setIsDrawerOpen(true);
                  }}
                >
                  <PriorityIcon priority={upstream.priority} size="sm" />
                  <span className="font-mono font-semibold text-[#5645d4] group-hover:underline">
                    {upstream.key}
                  </span>
                  <span className="truncate text-[#37352f] max-w-[200px]">{upstream.title}</span>
                  <StatePill state={upstream.state} size="sm" />
                </div>

                {/* Arrow & Status Indicator */}
                <div className="flex items-center gap-1.5 shrink-0 px-2 text-[#787671]">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#dd5b00]">
                    {isBlocking ? 'BLOCKS' : 'RESOLVED'}
                  </span>
                  <ArrowRight className={`w-4 h-4 ${isBlocking ? 'text-[#dd5b00]' : 'text-[#1aae39]'}`} />
                </div>

                {/* Downstream Task (Waiting) */}
                <div
                  className="flex items-center gap-2 cursor-pointer group flex-1 min-w-0 justify-end"
                  onClick={() => {
                    setSelectedIssueId(downstream.id);
                    setIsDrawerOpen(true);
                  }}
                >
                  <StatePill state={downstream.state} size="sm" />
                  <span className="truncate text-[#37352f] max-w-[200px] text-right">
                    {downstream.title}
                  </span>
                  <span className="font-mono font-semibold text-[#5645d4] group-hover:underline">
                    {downstream.key}
                  </span>
                  <PriorityIcon priority={downstream.priority} size="sm" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
      )}
    </div>
  );
};
