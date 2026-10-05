/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Link2, History } from 'lucide-react';
import { Issue } from '../../../types';
import { CommentThread } from '../../../components/drawer/CommentThread';
import { ActivityTimeline } from '../../../components/drawer/ActivityTimeline';
import { IssueDependencySection } from './IssueDependencySection';
import { ResolvedDependencyItem } from '../selectors';
import { useKeyboard } from '../../../context/KeyboardContext';

export type IssueTabType = 'DISCUSSION' | 'DEPENDENCIES' | 'ACTIVITY';

interface IssueContentTabsProps {
  issue: Issue;
  upstreamDependencies: ResolvedDependencyItem[];
  downstreamDependencies: ResolvedDependencyItem[];
  activeBlockerCount: number;
  commentCount: number;
  activityCount: number;
  isReadOnly?: boolean;
}

export const IssueContentTabs: React.FC<IssueContentTabsProps> = ({
  issue,
  upstreamDependencies,
  downstreamDependencies,
  activeBlockerCount,
  commentCount,
  activityCount,
  isReadOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState<IssueTabType>('DISCUSSION');
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const { registerDetailHandlers } = useKeyboard();

  // Register shortcut handler for 'M' (focus comment composer)
  useEffect(() => {
    registerDetailHandlers({
      onFocusComment: () => {
        setActiveTab('DISCUSSION');
        setTimeout(() => {
          commentTextareaRef.current?.focus();
        }, 50);
      },
    });
    return () => {
      registerDetailHandlers(null);
    };
  }, [registerDetailHandlers]);

  return (
    <div className="space-y-4">
      {/* Tab Navigation Header */}
      <div
        role="tablist"
        aria-label="Issue subsections"
        className="flex items-center gap-1 border-b border-border text-xs"
      >
        {/* Tab 1: Discussion */}
        <button
          role="tab"
          id="tab-discussion"
          aria-selected={activeTab === 'DISCUSSION'}
          aria-controls="panel-discussion"
          onClick={() => setActiveTab('DISCUSSION')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'DISCUSSION'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Discussion</span>
          {commentCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-accent/15 text-accent text-[10px] font-bold flex items-center justify-center">
              {commentCount}
            </span>
          )}
          {!isReadOnly && (
            <kbd className="hidden sm:inline font-mono text-[9px] text-text-muted border border-border px-1 rounded bg-surface-subtle">
              M
            </kbd>
          )}
        </button>

        {/* Tab 2: Dependencies */}
        <button
          role="tab"
          id="tab-dependencies"
          aria-selected={activeTab === 'DEPENDENCIES'}
          aria-controls="panel-dependencies"
          onClick={() => setActiveTab('DEPENDENCIES')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'DEPENDENCIES'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>Dependencies</span>
          {activeBlockerCount > 0 ? (
            <span className="w-4 h-4 rounded-full bg-blocker/15 text-blocker text-[10px] font-bold flex items-center justify-center">
              {activeBlockerCount}
            </span>
          ) : upstreamDependencies.length > 0 ? (
            <span className="w-4 h-4 rounded-full bg-surface-muted text-text-muted text-[10px] font-bold flex items-center justify-center">
              {upstreamDependencies.length}
            </span>
          ) : null}
        </button>

        {/* Tab 3: Activity */}
        <button
          role="tab"
          id="tab-activity"
          aria-selected={activeTab === 'ACTIVITY'}
          aria-controls="panel-activity"
          onClick={() => setActiveTab('ACTIVITY')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'ACTIVITY'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Activity & Audit</span>
          {activityCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-surface-muted text-text-muted text-[10px] font-bold flex items-center justify-center">
              {activityCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'DISCUSSION' && (
          <div
            id="panel-discussion"
            role="tabpanel"
            aria-labelledby="tab-discussion"
            className="animate-in fade-in duration-100"
          >
            <CommentThread
              issueId={issue.id}
              isReadOnly={isReadOnly}
              textareaRef={commentTextareaRef}
            />
          </div>
        )}

        {activeTab === 'DEPENDENCIES' && (
          <div
            id="panel-dependencies"
            role="tabpanel"
            aria-labelledby="tab-dependencies"
            className="animate-in fade-in duration-100"
          >
            <IssueDependencySection
              issue={issue}
              upstreamDependencies={upstreamDependencies}
              downstreamDependencies={downstreamDependencies}
              isReadOnly={isReadOnly}
            />
          </div>
        )}

        {activeTab === 'ACTIVITY' && (
          <div
            id="panel-activity"
            role="tabpanel"
            aria-labelledby="tab-activity"
            className="animate-in fade-in duration-100"
          >
            <ActivityTimeline issueId={issue.id} />
          </div>
        )}
      </div>
    </div>
  );
};
