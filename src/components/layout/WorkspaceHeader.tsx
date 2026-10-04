import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { useKeyboard } from '../../context/KeyboardContext';
import { Button } from '../ui/Button';
import { Plus, ShieldAlert, CheckCircle2, Clock, Layers, Sparkles } from 'lucide-react';

export const WorkspaceHeader: React.FC = () => {
  const { issues, getIssueBlockerStatus } = useProject();
  const { setIsCreateModalOpen } = useKeyboard();

  const total = issues.length;
  const inProgress = issues.filter(i => i.state === 'IN_PROGRESS' || i.state === 'IN_REVIEW').length;
  const blocked = issues.filter(i => getIssueBlockerStatus(i.id).isBlocked).length;
  const done = issues.filter(i => i.state === 'DONE').length;

  return (
    <header className="bg-[#0a1530] text-white px-5 py-3.5 border-b border-[#1a2a52] shrink-0 select-none shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Branding & Core Execution Wedge */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-[#5645d4] flex items-center justify-center font-bold text-white shadow-md border border-purple-400/30">
            K
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white">
                Kite Delivery Execution Engine
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/10 text-purple-200 border border-white/10 font-semibold">
                High-Density Triage
              </span>
            </div>
            <p className="text-[11px] text-[#a4a097] mt-0.5 hidden md:block">
              First-class blocker graph & multi-team dependency enforcement.
            </p>
          </div>
        </div>

        {/* Right: Real-time Metric Indicators & New Issue CTA */}
        <div className="flex items-center gap-3">
          {/* Metrics Strip */}
          <div className="hidden lg:flex items-center gap-2 bg-[#070f24] px-3 py-1.5 rounded-[8px] border border-[#1a2a52] text-xs">
            <div className="flex items-center gap-1.5 text-[#a4a097]" title="Total Backlog">
              <Layers className="w-3.5 h-3.5 text-[#787671]" />
              <span className="font-semibold text-white">{total}</span>
              <span className="text-[10px]">total</span>
            </div>

            <div className="w-[1px] h-3 bg-[#1a2a52]" />

            <div className="flex items-center gap-1.5 text-[#f5d75e]" title="Active Work">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-semibold text-white">{inProgress}</span>
              <span className="text-[10px] text-[#a4a097]">active</span>
            </div>

            <div className="w-[1px] h-3 bg-[#1a2a52]" />

            {/* Blocked Count */}
            <div
              className={`flex items-center gap-1.5 ${
                blocked > 0 ? 'text-[#ff64c8] font-bold' : 'text-[#a4a097]'
              }`}
              title="Actively Blocked Issues"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#dd5b00]" />
              <span className="font-semibold text-white">{blocked}</span>
              <span className="text-[10px] text-[#ff64c8]">blocked</span>
            </div>

            <div className="w-[1px] h-3 bg-[#1a2a52]" />

            <div className="flex items-center gap-1.5 text-[#1aae39]" title="Done">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-semibold text-white">{done}</span>
              <span className="text-[10px] text-[#a4a097]">done</span>
            </div>
          </div>

          {/* Primary CTA (Notion purple button #5645d4) */}
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
            className="shadow-sm font-semibold"
          >
            <span>New Issue</span>
            <kbd className="hidden sm:inline-block ml-1 font-mono text-[10px] bg-white/20 px-1 py-0.2 rounded text-white">
              C
            </kbd>
          </Button>
        </div>
      </div>
    </header>
  );
};
