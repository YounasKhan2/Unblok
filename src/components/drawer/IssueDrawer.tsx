import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronUp,
  ChevronDown,
  Layers,
  History,
  Link2,
  ExternalLink,
  ShieldAlert,
  MessageSquare,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { PropertyGrid } from './PropertyGrid';
import { DependencyManager } from './DependencyManager';
import { ActivityTimeline } from './ActivityTimeline';
import { CommentThread } from './CommentThread';
import { BlockerBadge } from '../ui/BlockerBadge';

export const IssueDrawer: React.FC = () => {
  const {
    selectedIssue,
    isDrawerOpen,
    setIsDrawerOpen,
    navigateIssue,
    updateIssueDetails,
    getIssueBlockerStatus,
    teams,
    comments,
  } = useProject();

  const [activeTab, setActiveTab] = useState<'DETAILS' | 'DEPENDENCIES' | 'DISCUSSIONS' | 'ACTIVITY'>('DETAILS');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Sync internal state when selectedIssue changes via J/K navigation
  useEffect(() => {
    if (selectedIssue) {
      setTitle(selectedIssue.title);
      setDescription(selectedIssue.description);
    }
  }, [selectedIssue]);

  if (!isDrawerOpen || !selectedIssue) {
    return null;
  }

  const blockerStatus = getIssueBlockerStatus(selectedIssue.id);
  const team = teams.find(t => t.id === selectedIssue.teamId);
  const issueCommentCount = comments.filter(c => c.issueId === selectedIssue.id).length;

  const handleTitleBlur = () => {
    if (title.trim() && title !== selectedIssue.title) {
      updateIssueDetails(selectedIssue.id, title.trim(), description);
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== selectedIssue.description) {
      updateIssueDetails(selectedIssue.id, title, description);
    }
  };

  return (
    <aside
      className="w-[440px] shrink-0 border-l border-[#e5e3df] bg-white h-full flex flex-col shadow-[-4px_0_24px_rgba(15,15,15,0.06)] z-30 animate-in slide-in-from-right duration-150"
      aria-label="Issue Detail Drawer"
    >
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e3df] bg-[#fafaf9]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[#5645d4] px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200">
            {selectedIssue.key}
          </span>
          <span className="text-xs text-[#787671] truncate max-w-[140px]">
            {team?.name || 'Workspace'}
          </span>
          <BlockerBadge status={blockerStatus} compact />
        </div>

        <div className="flex items-center gap-1 text-[#787671]">
          {/* J / K fast navigation buttons */}
          <button
            onClick={() => navigateIssue(-1)}
            className="p-1 hover:text-[#1a1a1a] hover:bg-[#ede9e4] rounded transition-colors"
            title="Previous issue (K)"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateIssue(1)}
            className="p-1 hover:text-[#1a1a1a] hover:bg-[#ede9e4] rounded transition-colors"
            title="Next issue (J)"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-3.5 bg-[#e5e3df] mx-1" />
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-1 hover:text-[#1a1a1a] hover:bg-[#ede9e4] rounded transition-colors"
            title="Close drawer (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Sub-Tabs */}
      <div className="flex items-center px-4 border-b border-[#e5e3df] bg-white text-xs">
        <button
          onClick={() => setActiveTab('DETAILS')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'DETAILS'
              ? 'border-[#5645d4] text-[#5645d4]'
              : 'border-transparent text-[#787671] hover:text-[#1a1a1a]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Properties</span>
        </button>

        <button
          onClick={() => setActiveTab('DEPENDENCIES')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'DEPENDENCIES'
              ? 'border-[#5645d4] text-[#5645d4]'
              : 'border-transparent text-[#787671] hover:text-[#1a1a1a]'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>Blockers</span>
          {blockerStatus.activeCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#ffe8d4] text-[#dd5b00] text-[10px] font-bold flex items-center justify-center">
              {blockerStatus.activeCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('DISCUSSIONS')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'DISCUSSIONS'
              ? 'border-[#5645d4] text-[#5645d4]'
              : 'border-transparent text-[#787671] hover:text-[#1a1a1a]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Discussion</span>
          {issueCommentCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-purple-100 text-[#5645d4] text-[10px] font-bold flex items-center justify-center">
              {issueCommentCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ACTIVITY')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'ACTIVITY'
              ? 'border-[#5645d4] text-[#5645d4]'
              : 'border-transparent text-[#787671] hover:text-[#1a1a1a]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Trail</span>
        </button>
      </div>

      {/* 3. Main Drawer Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title Input */}
        <div>
          <textarea
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            rows={2}
            className="w-full text-base font-semibold text-[#1a1a1a] bg-transparent border-0 focus:ring-1 focus:ring-[#5645d4] rounded p-1 resize-none leading-snug hover:bg-[#fafaf9] transition-colors"
            placeholder="Issue title..."
          />
        </div>

        {/* Tab 1: Details & Properties */}
        {activeTab === 'DETAILS' && (
          <div className="space-y-4">
            <PropertyGrid issue={selectedIssue} />

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#787671] block mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                rows={5}
                placeholder="Add more details, technical specifications, or reproduction steps..."
                className="w-full text-xs text-[#37352f] bg-[#fafaf9] border border-[#e5e3df] focus:border-[#5645d4] rounded-lg p-3 resize-y focus:outline-none leading-relaxed"
              />
            </div>

            {/* Quick summary of blockers inside details */}
            <div className="pt-2 border-t border-[#e5e3df]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#787671] uppercase tracking-wider">
                  Blocker Summary
                </span>
                <button
                  onClick={() => setActiveTab('DEPENDENCIES')}
                  className="text-xs text-[#5645d4] hover:underline"
                >
                  Manage Blockers →
                </button>
              </div>

              {blockerStatus.activeCount > 0 ? (
                <div className="p-2.5 rounded-lg bg-[#ffe8d4]/50 border border-[#ffd3ad] text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-[#dd5b00]">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Cannot complete: {blockerStatus.activeCount} active blocker(s)</span>
                  </div>
                  <ul className="list-disc list-inside text-[#793400] text-[11px] space-y-0.5">
                    {blockerStatus.activeBlockers.map(b => (
                      <li key={b.id}>
                        <span className="font-mono font-semibold">{b.key}</span> — {b.title}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-xs text-[#787671] py-1">
                  No active blockers. Work can proceed normally.
                </div>
              )}
            </div>

            {/* Quick Discussion Section in Details */}
            <div className="pt-2 border-t border-[#e5e3df]/70">
              <CommentThread issueId={selectedIssue.id} />
            </div>
          </div>
        )}

        {/* Tab 2: Dependencies Manager */}
        {activeTab === 'DEPENDENCIES' && <DependencyManager issue={selectedIssue} />}

        {/* Tab 3: Dedicated Discussions */}
        {activeTab === 'DISCUSSIONS' && <CommentThread issueId={selectedIssue.id} />}

        {/* Tab 4: Activity Timeline */}
        {activeTab === 'ACTIVITY' && <ActivityTimeline issueId={selectedIssue.id} />}
      </div>

      {/* 4. Footer navigation info */}
      <div className="px-4 py-2 border-t border-[#e5e3df] bg-[#fafaf9] flex items-center justify-between text-[11px] text-[#787671]">
        <span>
          Tip: Use <kbd className="font-mono px-1 py-0.5 border rounded bg-white">J</kbd> / <kbd className="font-mono px-1 py-0.5 border rounded bg-white">K</kbd> to triage
        </span>
        <span>Version: v{selectedIssue.version}</span>
      </div>
    </aside>
  );
};
