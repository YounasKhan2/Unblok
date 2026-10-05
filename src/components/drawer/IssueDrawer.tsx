/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import { useKeyboard } from '../../context/KeyboardContext';
import { useDrawerRoute } from '../../app/router/useDrawerRoute';
import { PropertyGrid } from './PropertyGrid';
import { DependencyManager } from './DependencyManager';
import { ActivityTimeline } from './ActivityTimeline';
import { CommentThread } from './CommentThread';
import { BlockerBadge } from '../ui/BlockerBadge';

export const IssueDrawer: React.FC = () => {
  const {
    issues,
    selectedIssueId,
    setSelectedIssueId,
    navigateIssue,
    updateIssueDetails,
    getIssueBlockerStatus,
    teams,
    comments,
  } = useProject();

  const {
    isOpen,
    drawerIssueKey,
    drawerTab,
    closeDrawer,
    setDrawerTab,
    navigateToAdjacentIssue,
  } = useDrawerRoute();

  const { registerDrawerHandlers } = useKeyboard();

  // Find the active issue either from drawerIssueKey in URL or selectedIssueId
  const activeIssue = React.useMemo(() => {
    if (drawerIssueKey) {
      return issues.find(i => i.key === drawerIssueKey || i.id === drawerIssueKey) || null;
    }
    if (selectedIssueId) {
      return issues.find(i => i.id === selectedIssueId) || null;
    }
    return null;
  }, [drawerIssueKey, selectedIssueId, issues]);

  // Sync tab state with URL parameter if present
  const activeTab = React.useMemo(() => {
    if (drawerTab === 'dependencies' || drawerTab === 'DEPENDENCIES') return 'DEPENDENCIES';
    if (drawerTab === 'discussions' || drawerTab === 'DISCUSSIONS' || drawerTab === 'comments') return 'DISCUSSIONS';
    if (drawerTab === 'activity' || drawerTab === 'ACTIVITY' || drawerTab === 'audit') return 'ACTIVITY';
    return 'DETAILS';
  }, [drawerTab]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Sync internal state when activeIssue changes
  useEffect(() => {
    if (activeIssue) {
      setTitle(activeIssue.title);
      setDescription(activeIssue.description);
      if (selectedIssueId !== activeIssue.id) {
        setSelectedIssueId(activeIssue.id);
      }
    }
  }, [activeIssue, selectedIssueId, setSelectedIssueId]);

  // Register drawer keyboard handlers with KeyboardContext
  useEffect(() => {
    if (isOpen && activeIssue) {
      registerDrawerHandlers({
        onNext: () => handleAdjacentNavigate(1),
        onPrev: () => handleAdjacentNavigate(-1),
        onClose: closeDrawer,
      });
      return () => {
        registerDrawerHandlers(null);
      };
    } else {
      registerDrawerHandlers(null);
    }
  }, [isOpen, activeIssue, registerDrawerHandlers, closeDrawer, issues]);

  if (!isOpen || !activeIssue) {
    return null;
  }

  const blockerStatus = getIssueBlockerStatus(activeIssue.id);
  const team = teams.find(t => t.id === activeIssue.teamId);
  const issueCommentCount = comments.filter(c => c.issueId === activeIssue.id).length;

  const handleTitleBlur = () => {
    if (title.trim() && title !== activeIssue.title) {
      updateIssueDetails(activeIssue.id, title.trim(), description);
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== activeIssue.description) {
      updateIssueDetails(activeIssue.id, title, description);
    }
  };

  const handleAdjacentNavigate = (direction: -1 | 1) => {
    const currentIndex = issues.findIndex(i => i.id === activeIssue.id);
    if (currentIndex === -1) return;
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < issues.length) {
      const next = issues[nextIndex];
      navigateToAdjacentIssue(next.key);
      setSelectedIssueId(next.id);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 sm:hidden"
        onClick={closeDrawer}
      />

      <aside
        className="fixed sm:static inset-y-0 right-0 w-full sm:w-[440px] shrink-0 border-l border-[#e5e3df] bg-white h-full flex flex-col shadow-[-4px_0_24px_rgba(15,15,15,0.06)] z-50 sm:z-30 animate-in slide-in-from-right duration-150"
        aria-label="Issue Detail Drawer"
      >
        {/* 1. Header Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e5e3df] bg-[#fafaf9] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs font-bold text-[#5645d4] px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200 shrink-0">
              {activeIssue.key}
            </span>
            <span className="text-xs text-[#787671] truncate max-w-[120px]">
              {team?.name || 'Core Platform'}
            </span>
            <BlockerBadge status={blockerStatus} compact />
          </div>

          <div className="flex items-center gap-1 text-[#787671] shrink-0">
            {/* Open Full Issue Canonical Link */}
            <Link
              to={`/issues/${activeIssue.key}`}
              className="p-1 hover:text-[#1a1a1a] hover:bg-[#ede9e4] rounded transition-colors"
              title="Open full issue page (/issues/:key)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <div className="w-[1px] h-3.5 bg-[#e5e3df] mx-0.5" />

            {/* J / K fast navigation buttons */}
            <button
              onClick={() => handleAdjacentNavigate(-1)}
              className="p-1 hover:text-[#1a1a1a] hover:bg-[#ede9e4] rounded transition-colors cursor-pointer"
              title="Previous issue (K)"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAdjacentNavigate(1)}
              className="p-1 hover:text-[#1a1a1a] hover:bg-[#ede9e4] rounded transition-colors cursor-pointer"
              title="Next issue (J)"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-3.5 bg-[#e5e3df] mx-0.5" />

            {/* Close Drawer Button */}
            <button
              onClick={closeDrawer}
              className="p-1 hover:text-[#1a1a1a] hover:bg-[#ede9e4] rounded transition-colors cursor-pointer"
              title="Close drawer (Esc)"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Sub-Tabs */}
        <div className="flex items-center px-4 border-b border-[#e5e3df] bg-white text-xs shrink-0">
          <button
            onClick={() => setDrawerTab('properties')}
            className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'DETAILS'
                ? 'border-[#5645d4] text-[#5645d4]'
                : 'border-transparent text-[#787671] hover:text-[#1a1a1a]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Properties</span>
          </button>

          <button
            onClick={() => setDrawerTab('dependencies')}
            className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
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
            onClick={() => setDrawerTab('discussions')}
            className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
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
            onClick={() => setDrawerTab('activity')}
            className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'ACTIVITY'
                ? 'border-[#5645d4] text-[#5645d4]'
                : 'border-transparent text-[#787671] hover:text-[#1a1a1a]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit</span>
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
              <PropertyGrid issue={activeIssue} />

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#787671] block mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  onBlur={handleDescriptionBlur}
                  rows={5}
                  placeholder="Add technical specifications, acceptance criteria, or logs..."
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
                    onClick={() => setDrawerTab('dependencies')}
                    className="text-xs text-[#5645d4] hover:underline cursor-pointer"
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
                <CommentThread issueId={activeIssue.id} />
              </div>
            </div>
          )}

          {/* Tab 2: Dependencies Manager */}
          {activeTab === 'DEPENDENCIES' && <DependencyManager issue={activeIssue} />}

          {/* Tab 3: Dedicated Discussions */}
          {activeTab === 'DISCUSSIONS' && <CommentThread issueId={activeIssue.id} />}

          {/* Tab 4: Activity Timeline */}
          {activeTab === 'ACTIVITY' && <ActivityTimeline issueId={activeIssue.id} />}
        </div>

        {/* 4. Footer navigation info */}
        <div className="px-4 py-2 border-t border-[#e5e3df] bg-[#fafaf9] flex items-center justify-between text-[11px] text-[#787671] shrink-0">
          <span>
            Use <kbd className="font-mono px-1 py-0.5 border rounded bg-white">J</kbd> /{' '}
            <kbd className="font-mono px-1 py-0.5 border rounded bg-white">K</kbd> to triage
          </span>
          <span>v{activeIssue.version}</span>
        </div>
      </aside>
    </>
  );
};
