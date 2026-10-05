/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
    projects,
    selectedIssueId,
    setSelectedIssueId,
    navigateIssue,
    updateIssueDetails,
    getIssueBlockerStatus,
    teams,
    comments,
  } = useProject();

  const location = useLocation();
  const navigate = useNavigate();

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

  // Origin return URL preserving search without drawer/tab query params
  const returnUrl = useMemo(() => {
    const returnSearch = location.search
      .replace(/([?&])drawer=[^&]*(&|$)/, '$1')
      .replace(/([?&])tab=[^&]*(&|$)/, '$1')
      .replace(/[?&]$/, '');
    return location.pathname + returnSearch;
  }, [location.pathname, location.search]);

  const handleOpenFullIssue = useCallback(() => {
    if (!activeIssue) return;
    navigate(`/issues/${activeIssue.key}`, { state: { from: returnUrl } });
  }, [activeIssue, navigate, returnUrl]);

  // Sync tab state with URL parameter if present
  const activeTab = React.useMemo(() => {
    if (drawerTab === 'dependencies' || drawerTab === 'DEPENDENCIES') return 'DEPENDENCIES';
    if (drawerTab === 'discussions' || drawerTab === 'DISCUSSIONS' || drawerTab === 'comments') return 'DISCUSSIONS';
    if (drawerTab === 'activity' || drawerTab === 'ACTIVITY' || drawerTab === 'audit') return 'ACTIVITY';
    return 'DETAILS';
  }, [drawerTab]);

  const relevantIssues = useMemo(() => {
    const match = location.pathname.match(/^\/projects\/([^/]+)/);
    if (match && match[1]) {
      const keyOrId = match[1].toLowerCase();
      const proj = projects.find(
        p => p.key.toLowerCase() === keyOrId || p.id.toLowerCase() === keyOrId
      );
      if (proj) {
        return issues.filter(i => i.projectId === proj.id);
      }
    }
    return issues;
  }, [location.pathname, projects, issues]);

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

  const handleAdjacentNavigate = useCallback((direction: -1 | 1) => {
    if (!activeIssue) return;
    const currentIndex = relevantIssues.findIndex(i => i.id === activeIssue.id);
    if (currentIndex === -1) return;
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < relevantIssues.length) {
      const next = relevantIssues[nextIndex];
      navigateToAdjacentIssue(next.key);
      setSelectedIssueId(next.id);
    }
  }, [activeIssue, relevantIssues, navigateToAdjacentIssue, setSelectedIssueId]);

  // Register drawer keyboard handlers with KeyboardContext
  useEffect(() => {
    if (isOpen && activeIssue) {
      registerDrawerHandlers({
        onNext: () => handleAdjacentNavigate(1),
        onPrev: () => handleAdjacentNavigate(-1),
        onClose: closeDrawer,
        onOpenFull: handleOpenFullIssue,
      });
      return () => {
        registerDrawerHandlers(null);
      };
    } else {
      registerDrawerHandlers(null);
    }
  }, [isOpen, activeIssue, registerDrawerHandlers, handleAdjacentNavigate, closeDrawer, handleOpenFullIssue]);

  const handleTitleBlur = () => {
    if (activeIssue && title.trim() && title !== activeIssue.title) {
      updateIssueDetails(activeIssue.id, title.trim(), description);
    }
  };

  const handleDescriptionBlur = () => {
    if (activeIssue && description !== activeIssue.description) {
      updateIssueDetails(activeIssue.id, title, description);
    }
  };

  if (!isOpen || !activeIssue || location.pathname.startsWith('/issues/')) {
    return null;
  }

  const blockerStatus = getIssueBlockerStatus(activeIssue.id);
  const team = teams.find(t => t.id === activeIssue.teamId);
  const issueCommentCount = comments.filter(c => c.issueId === activeIssue.id).length;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 sm:hidden"
        onClick={closeDrawer}
      />

      <aside
        className="fixed sm:static inset-y-0 right-0 w-full sm:w-[440px] shrink-0 border-l border-border bg-surface-base h-full flex flex-col shadow-[-4px_0_24px_rgba(15,15,15,0.06)] z-50 sm:z-30 animate-in slide-in-from-right duration-150"
        aria-label="Issue Detail Drawer"
      >
        {/* 1. Header Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-subtle shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs font-bold text-accent px-1.5 py-0.5 rounded bg-accent/10 border border-accent/30 shrink-0">
              {activeIssue.key}
            </span>
            <span className="text-xs text-text-muted truncate max-w-[120px]">
              {team?.name || 'Core Platform'}
            </span>
            <BlockerBadge status={blockerStatus} compact />
          </div>

          <div className="flex items-center gap-1 text-text-muted shrink-0">
            {/* Open Full Issue Canonical Link */}
            <Link
              to={`/issues/${activeIssue.key}`}
              state={{ from: returnUrl }}
              className="p-1 hover:text-text-primary hover:bg-surface-muted rounded transition-colors"
              title="Open full issue page (Cmd+O)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <div className="w-[1px] h-3.5 bg-border mx-0.5" />

            {/* J / K fast navigation buttons */}
            <button
              onClick={() => handleAdjacentNavigate(-1)}
              className="p-1 hover:text-text-primary hover:bg-surface-muted rounded transition-colors cursor-pointer"
              title="Previous issue (K)"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAdjacentNavigate(1)}
              className="p-1 hover:text-text-primary hover:bg-surface-muted rounded transition-colors cursor-pointer"
              title="Next issue (J)"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-3.5 bg-border mx-0.5" />

            {/* Close Drawer Button */}
            <button
              onClick={closeDrawer}
              className="p-1 hover:text-text-primary hover:bg-surface-muted rounded transition-colors cursor-pointer"
              title="Close drawer (Esc)"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Sub-Tabs */}
        <div className="flex items-center px-4 border-b border-border bg-surface-base text-xs shrink-0">
          <button
            onClick={() => setDrawerTab('properties')}
            className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'DETAILS'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Properties</span>
          </button>

          <button
            onClick={() => setDrawerTab('dependencies')}
            className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'DEPENDENCIES'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Blockers</span>
            {blockerStatus.activeCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blocker/15 text-blocker text-[10px] font-bold flex items-center justify-center">
                {blockerStatus.activeCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setDrawerTab('discussions')}
            className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'DISCUSSIONS'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Discussion</span>
            {issueCommentCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-accent/15 text-accent text-[10px] font-bold flex items-center justify-center">
                {issueCommentCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setDrawerTab('activity')}
            className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'ACTIVITY'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-primary'
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
              className="w-full text-base font-semibold text-text-primary bg-transparent border-0 focus:ring-1 focus:ring-accent rounded p-1 resize-none leading-snug hover:bg-surface-subtle transition-colors"
              placeholder="Issue title..."
            />
          </div>

          {/* Tab 1: Details & Properties */}
          {activeTab === 'DETAILS' && (
            <div className="space-y-4">
              <PropertyGrid issue={activeIssue} />

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted block mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  onBlur={handleDescriptionBlur}
                  rows={5}
                  placeholder="Add technical specifications, acceptance criteria, or logs..."
                  className="w-full text-xs text-text-secondary bg-surface-subtle border border-border focus:border-accent rounded-lg p-3 resize-y focus:outline-none leading-relaxed"
                />
              </div>

              {/* Quick summary of blockers inside details */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Blocker Summary
                  </span>
                  <button
                    onClick={() => setDrawerTab('dependencies')}
                    className="text-xs text-accent hover:underline cursor-pointer"
                  >
                    Manage Blockers →
                  </button>
                </div>

                {blockerStatus.activeCount > 0 ? (
                  <div className="p-2.5 rounded-lg bg-blocker/10 border border-blocker/30 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-blocker">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Cannot complete: {blockerStatus.activeCount} active blocker(s)</span>
                    </div>
                    <ul className="list-disc list-inside text-blocker text-[11px] space-y-0.5">
                      {blockerStatus.activeBlockers.map(b => (
                        <li key={b.id}>
                          <span className="font-mono font-semibold">{b.key}</span> — {b.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-xs text-text-muted py-1">
                    No active blockers. Work can proceed normally.
                  </div>
                )}
              </div>

              {/* Quick Discussion Section in Details */}
              <div className="pt-2 border-t border-border/70">
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
        <div className="px-4 py-2 border-t border-border bg-surface-subtle flex items-center justify-between text-[11px] text-text-muted shrink-0">
          <span>
            Use <kbd className="font-mono px-1 py-0.5 border border-border rounded bg-surface-base">J</kbd> /{' '}
            <kbd className="font-mono px-1 py-0.5 border border-border rounded bg-surface-base">K</kbd> to triage
          </span>
          <span>v{activeIssue.version}</span>
        </div>
      </aside>
    </>
  );
};
